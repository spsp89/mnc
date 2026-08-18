import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { PersonalDataService } from "../../common/crypto/personal-data.service";
import { LeadsService } from "../leads/leads.service";
import type { CreateEnquiryDto } from "./dto/create-enquiry.dto";
import { BusinessAccessService } from "../../common/auth/business-access.service";
import type { Prisma } from "../../generated/prisma/client";
import type { MerchantEnquiryQueryDto, UpdateMerchantEnquiryStatusDto } from "./dto/merchant-enquiry.dto";

@Injectable()
export class EnquiriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly personalData: PersonalDataService,
    private readonly leads: LeadsService,
    private readonly businessAccess: BusinessAccessService,
  ) {}

  async create(input: CreateEnquiryDto, customerId?: string) {
    if (!input.consent) {
      throw new BadRequestException("Contact-sharing consent is required for an enquiry.");
    }
    await this.validateTarget(input);
    const phone = input.phone.replace(/\D/g, "");
    if (phone.length < 10 || phone.length > 15) throw new BadRequestException("Enter a valid mobile number.");
    const duplicateKey = this.personalData.fingerprint(
      `${phone}:${input.categoryId}:${input.businessId ?? "matched"}:${input.requirement.toLowerCase().trim()}`,
    );
    const duplicate = await this.prisma.lead.findFirst({
      where: {
        duplicateKey,
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
        status: { notIn: ["EXPIRED", "SPAM", "REJECTED"] },
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictException("A matching enquiry was already submitted recently.");
    }

    const encryptedContact = this.personalData.encrypt(
      JSON.stringify({ phone, preference: input.contactPreference }),
    );
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const result = await this.prisma.$transaction(async (transaction) => {
      const lead = await transaction.lead.create({
        data: {
          customerId,
          categoryId: input.categoryId,
          source: input.businessId ? "DIRECT_ENQUIRY" : "QUOTE_REQUEST",
          requirement: input.requirement,
          approximateLocation: { locality: input.locality },
          latitude: input.latitude,
          longitude: input.longitude,
          radiusKm: 5,
          urgency: input.urgency,
          contactEncrypted: encryptedContact,
          consentScope: {
            channels: [input.contactPreference],
            businessId: input.businessId ?? null,
          },
          status: "NEW",
          expiresAt,
          duplicateKey,
        },
      });
      const enquiry = await transaction.enquiry.create({
        data: {
          customerId,
          businessId: input.businessId,
          categoryId: input.categoryId,
          leadId: lead.id,
          requirement: input.requirement,
          location: {
            locality: input.locality,
            latitude: input.latitude,
            longitude: input.longitude,
          },
          preferredDate: input.preferredDate ? new Date(input.preferredDate) : undefined,
          urgency: input.urgency,
          customerName: input.customerName,
          contactEncrypted: encryptedContact,
          contactPreference: input.contactPreference,
          consentGrantedAt: new Date(),
          expiresAt,
          items: input.items?.length
            ? {
                create: input.items.map((item) => ({
                  productId: item.productId,
                  serviceId: item.serviceId,
                  details: item.details,
                })),
              }
            : undefined,
        },
      });
      return { lead, enquiry };
    });

    await this.leads.queueMatch(result.lead.id);
    return {
      data: {
        id: result.enquiry.id,
        leadId: result.lead.id,
        status: result.enquiry.status,
        expiresAt,
      },
    };
  }

  private async validateTarget(input: CreateEnquiryDto) {
    const category = await this.prisma.category.findFirst({ where: { id: input.categoryId, isActive: true }, select: { id: true } });
    if (!category) throw new BadRequestException("Select an active enquiry category.");
    if (input.businessId) {
      const business = await this.prisma.business.findFirst({ where: {
        id: input.businessId, status: "ACTIVE", listingStatus: "PUBLISHED", deletedAt: null,
        categories: { some: { categoryId: input.categoryId, category: { isActive: true } } },
      }, select: { id: true, attributes: true } });
      if (!business) throw new BadRequestException("The selected business cannot receive enquiries in this category.");
      if ((business.attributes as Record<string, unknown> | null)?.acceptNewEnquiries === false) throw new ConflictException("This business is not accepting new enquiries.");
    }
    const items = input.items ?? [];
    if (items.some((item) => Boolean(item.productId) === Boolean(item.serviceId))) {
      throw new BadRequestException("Each enquiry item must reference exactly one product or service.");
    }
    const productIds = [...new Set(items.flatMap((item) => item.productId ? [item.productId] : []))];
    const serviceIds = [...new Set(items.flatMap((item) => item.serviceId ? [item.serviceId] : []))];
    const [products, services] = await Promise.all([
      productIds.length ? this.prisma.product.count({ where: { id: { in: productIds }, categoryId: input.categoryId, status: "PUBLISHED", isActive: true, deletedAt: null, ...(input.businessId ? { businessId: input.businessId } : {}) } }) : 0,
      serviceIds.length ? this.prisma.service.count({ where: { id: { in: serviceIds }, categoryId: input.categoryId, isActive: true, deletedAt: null, ...(input.businessId ? { businessId: input.businessId } : {}) } }) : 0,
    ]);
    if (products !== productIds.length || services !== serviceIds.length) throw new BadRequestException("Enquiry items must be active catalogue records in the selected category and business.");
  }

  async listForCustomer(userId: string) {
    const data = await this.prisma.enquiry.findMany({
      where: { customerId: userId },
      select: {
        id: true,
        businessId: true,
        requirement: true,
        location: true,
        preferredDate: true,
        urgency: true,
        contactPreference: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        business: { select: { id: true, name: true, slug: true, verified: true } },
        lead: {
          select: {
            status: true,
            assignments: {
              select: {
                status: true,
                business: { select: { id: true, name: true, slug: true, verified: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return { data };
  }

  async listForBusiness(userId: string, input: MerchantEnquiryQueryDto | string) {
    const query: MerchantEnquiryQueryDto = typeof input === "string" ? { businessId: input } : input;
    const businessId = query.businessId;
    await this.businessAccess.require(userId, businessId, "business:leads:manage");
    const business = await this.prisma.business.findUnique({ where: { id: businessId }, select: { id: true, name: true, slug: true } });
    if (!business) throw new NotFoundException("Business listing not found.");
    const { from, to } = this.merchantRange(query.from, query.to);
    const ownership = this.merchantOwnership(businessId);
    const filters: Prisma.EnquiryWhereInput[] = [ownership];
    if (from || to) filters.push({ createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } });
    if (query.q) filters.push({ OR: [
        { requirement: { contains: query.q, mode: "insensitive" } },
        { customerName: { contains: query.q, mode: "insensitive" } },
        { category: { name: { contains: query.q, mode: "insensitive" } } },
      ] });
    if (query.status === "NEW") filters.push({ OR: [
        { merchantStates: { none: { businessId } } },
        { merchantStates: { some: { businessId, status: "NEW" } } },
      ] });
    else if (query.status) filters.push({ merchantStates: { some: { businessId, status: query.status } } });
    const where: Prisma.EnquiryWhereInput = { AND: filters };
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.enquiry.findMany({
      where,
      select: {
        id: true,
        businessId: true,
        requirement: true,
        location: true,
        preferredDate: true,
        urgency: true,
        customerName: true,
        contactPreference: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        category: { select: { id: true, name: true, slug: true } },
        lead: { select: {
          source: true,
          assignments: { where: { businessId }, take: 1, select: { id: true, status: true } },
        } },
        merchantStates: { where: { businessId }, take: 1, select: { status: true, updatedAt: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
      this.prisma.enquiry.count({ where }),
    ]);
    return {
      data: data.map((enquiry) => ({
        ...enquiry,
        isDirect: enquiry.businessId === businessId,
        source: enquiry.lead?.source ?? (enquiry.businessId ? "DIRECT_ENQUIRY" : "QUOTE_REQUEST"),
        listing: business,
        assignmentId: enquiry.lead?.assignments[0]?.id ?? null,
        assignmentStatus: enquiry.lead?.assignments[0]?.status ?? null,
        merchantStatus: enquiry.merchantStates[0]?.status ?? "NEW",
        statusUpdatedAt: enquiry.merchantStates[0]?.updatedAt ?? enquiry.createdAt,
        contactAvailable: enquiry.businessId === businessId || enquiry.lead?.assignments[0]?.status === "ACCEPTED",
        lead: undefined,
        merchantStates: undefined,
      })),
      meta: { page, pageSize, total },
    };
  }

  async merchantDetail(userId: string, id: string, businessId: string) {
    await this.businessAccess.require(userId, businessId, "business:leads:manage");
    const enquiry = await this.prisma.enquiry.findFirst({
      where: { id, ...this.merchantOwnership(businessId) },
      select: {
        id: true, businessId: true, requirement: true, location: true, preferredDate: true, urgency: true,
        customerName: true, contactEncrypted: true, contactPreference: true, status: true, expiresAt: true, createdAt: true,
        category: { select: { id: true, name: true, slug: true } },
        items: { select: { id: true, quantity: true, details: true, product: { select: { id: true, name: true } }, service: { select: { id: true, name: true } } } },
        lead: { select: { source: true, assignments: { where: { businessId }, take: 1, select: { id: true, status: true } } } },
        merchantStates: { where: { businessId }, take: 1, select: { status: true, updatedAt: true } },
      },
    });
    if (!enquiry) throw new NotFoundException("Enquiry not found for this business listing.");
    const assignment = enquiry.lead?.assignments[0];
    if (assignment && ["QUEUED", "DELIVERED"].includes(assignment.status)) {
      await this.prisma.leadAssignment.update({ where: { id: assignment.id }, data: { status: "VIEWED", viewedAt: new Date() } });
    }
    const canReadContact = enquiry.businessId === businessId || assignment?.status === "ACCEPTED";
    const listing = await this.prisma.business.findUniqueOrThrow({ where: { id: businessId }, select: { id: true, name: true, slug: true } });
    return { data: {
      ...enquiry,
      source: enquiry.lead?.source ?? (enquiry.businessId ? "DIRECT_ENQUIRY" : "QUOTE_REQUEST"),
      listing,
      assignmentId: assignment?.id ?? null,
      assignmentStatus: assignment?.status === "QUEUED" || assignment?.status === "DELIVERED" ? "VIEWED" : assignment?.status ?? null,
      merchantStatus: enquiry.merchantStates[0]?.status ?? "NEW",
      statusUpdatedAt: enquiry.merchantStates[0]?.updatedAt ?? enquiry.createdAt,
      contact: canReadContact ? JSON.parse(this.personalData.decrypt(enquiry.contactEncrypted)) : null,
      contactAvailable: canReadContact,
      contactEncrypted: undefined,
      lead: undefined,
      merchantStates: undefined,
    } };
  }

  async updateMerchantStatus(userId: string, id: string, input: UpdateMerchantEnquiryStatusDto) {
    await this.businessAccess.require(userId, input.businessId, "business:leads:manage");
    const enquiry = await this.prisma.enquiry.findFirst({ where: { id, ...this.merchantOwnership(input.businessId) }, select: { id: true } });
    if (!enquiry) throw new NotFoundException("Enquiry not found for this business listing.");
    const data = await this.prisma.merchantEnquiryState.upsert({
      where: { enquiryId_businessId: { enquiryId: id, businessId: input.businessId } },
      create: { enquiryId: id, businessId: input.businessId, status: input.status, updatedById: userId },
      update: { status: input.status, updatedById: userId },
    });
    return { data };
  }

  private merchantOwnership(businessId: string): Prisma.EnquiryWhereInput {
    return { OR: [
      { businessId },
      { lead: { assignments: { some: { businessId, status: { in: ["QUEUED", "DELIVERED", "VIEWED", "ACCEPTED"] } } } } },
    ] };
  }

  private merchantRange(fromValue?: string, toValue?: string) {
    const from = fromValue ? new Date(fromValue) : undefined;
    const to = toValue ? new Date(toValue) : undefined;
    if (from && to && from > to) throw new BadRequestException("Enquiry start date must not be after end date.");
    return { from, to };
  }

  async close(userId: string, id: string) {
    const enquiry = await this.prisma.enquiry.findUnique({
      where: { id },
      select: { customerId: true, businessId: true },
    });
    if (!enquiry) throw new NotFoundException("Enquiry not found.");
    if (enquiry.customerId !== userId) {
      if (!enquiry.businessId) throw new ForbiddenException("You cannot close this enquiry.");
      await this.businessAccess.require(userId, enquiry.businessId, "business:leads:manage");
    }
    const data = await this.prisma.enquiry.update({ where: { id }, data: { status: "CLOSED" } });
    return { data };
  }

}
