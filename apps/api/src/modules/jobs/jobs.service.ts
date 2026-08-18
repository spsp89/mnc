import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { BusinessAccessService } from "../../common/auth/business-access.service";
import { PrismaService } from "../../database/prisma.service";
import type { ApplyJobDto } from "./dto/apply-job.dto";
import type { CreateJobDto } from "./dto/create-job.dto";
import type { ListJobsDto } from "./dto/list-jobs.dto";
import type { UpdateJobApplicationDto } from "./dto/update-job-application.dto";
import type { UpdateJobDto } from "./dto/update-job.dto";

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly businessAccess: BusinessAccessService,
  ) {}

  async list(query: ListJobsDto) {
    const now = new Date();
    const where = {
      status: "PUBLISHED" as const,
      deletedAt: null,
      OR: [{ closesAt: null }, { closesAt: { gte: now } }],
      ...(query.city ? { city: { equals: query.city, mode: "insensitive" as const } } : {}),
      ...(query.employmentType ? { employmentType: query.employmentType } : {}),
      ...(query.q ? {
        AND: [{
          OR: [
            { title: { contains: query.q, mode: "insensitive" as const } },
            { description: { contains: query.q, mode: "insensitive" as const } },
            { business: { name: { contains: query.q, mode: "insensitive" as const } } },
          ],
        }],
      } : {}),
      business: { status: "ACTIVE" as const, listingStatus: "PUBLISHED" as const, deletedAt: null },
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where,
        include: {
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
              verified: true,
              permanentDiscountPercent: true,
            },
          },
        },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.job.count({ where }),
    ]);
    return { data, meta: { page: query.page, pageSize: query.pageSize, total } };
  }

  async find(id: string) {
    const data = await this.prisma.job.findFirst({
      where: {
        id,
        status: "PUBLISHED",
        deletedAt: null,
        business: { status: "ACTIVE", listingStatus: "PUBLISHED", deletedAt: null },
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            coverImageUrl: true,
            verified: true,
            publicPhone: true,
          },
        },
      },
    });
    if (!data) throw new NotFoundException("Job not found.");
    return { data };
  }

  async manage(userId: string, businessId: string) {
    await this.businessAccess.require(userId, businessId, "business:catalog:manage");
    const data = await this.prisma.job.findMany({
      where: { businessId, deletedAt: null },
      include: { _count: { select: { applications: true } } },
      orderBy: { updatedAt: "desc" },
    });
    return { data };
  }

  async create(userId: string, input: CreateJobDto) {
    await this.businessAccess.require(userId, input.businessId, "business:catalog:manage");
    this.validateSalary(input.salaryMin, input.salaryMax);
    const data = await this.prisma.job.create({
      data: {
        businessId: input.businessId,
        title: input.title,
        slug: input.slug,
        description: input.description,
        employmentType: input.employmentType,
        workplaceType: input.workplaceType ?? "ON_SITE",
        skills: input.skills,
        salaryMin: input.salaryMin,
        salaryMax: input.salaryMax,
        city: input.city,
        district: input.district,
        state: input.state,
        applicationUrl: input.applicationUrl,
        contactEmail: input.contactEmail,
        closesAt: input.closesAt ? new Date(input.closesAt) : undefined,
      },
    });
    return { data };
  }

  async update(userId: string, id: string, input: UpdateJobDto) {
    const current = await this.prisma.job.findUnique({ where: { id } });
    if (!current) throw new NotFoundException("Job not found.");
    await this.businessAccess.require(userId, current.businessId, "business:catalog:manage");
    if (current.status === "ARCHIVED") throw new ConflictException("Archived jobs cannot be edited.");
    this.validateSalary(input.salaryMin ?? Number(current.salaryMin), input.salaryMax ?? Number(current.salaryMax));
    const fields = { ...input };
    delete fields.businessId;
    delete fields.closesAt;
    const data = await this.prisma.job.update({
      where: { id },
      data: {
        ...fields,
        skills: input.skills,
        closesAt: input.closesAt ? new Date(input.closesAt) : undefined,
      },
    });
    return { data };
  }

  async publish(userId: string, id: string) {
    const current = await this.prisma.job.findUnique({ where: { id } });
    if (!current) throw new NotFoundException("Job not found.");
    await this.businessAccess.require(userId, current.businessId, "business:catalog:manage");
    await this.businessAccess.requireApprovedForPublication(current.businessId);
    if (current.closesAt && current.closesAt <= new Date()) {
      throw new BadRequestException("The closing date must be in the future.");
    }
    const data = await this.prisma.job.update({
      where: { id },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });
    return { data };
  }

  async close(userId: string, id: string) {
    const current = await this.prisma.job.findUnique({ where: { id } });
    if (!current) throw new NotFoundException("Job not found.");
    await this.businessAccess.require(userId, current.businessId, "business:catalog:manage");
    const data = await this.prisma.job.update({ where: { id }, data: { status: "CLOSED" } });
    return { data };
  }

  async apply(jobId: string, input: ApplyJobDto, applicantId?: string) {
    const job = await this.prisma.job.findFirst({
      where: {
        id: jobId,
        status: "PUBLISHED",
        deletedAt: null,
        OR: [{ closesAt: null }, { closesAt: { gte: new Date() } }],
      },
      select: { id: true },
    });
    if (!job) throw new ConflictException("This job is no longer accepting applications.");
    const data = await this.prisma.jobApplication.create({
      data: { jobId, applicantId, ...input },
    });
    return { data: { id: data.id, status: data.status, createdAt: data.createdAt } };
  }

  async myApplications(userId: string) {
    const data = await this.prisma.jobApplication.findMany({
      where: { applicantId: userId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            status: true,
            city: true,
            business: { select: { name: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return { data };
  }

  async applications(userId: string, jobId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId }, select: { businessId: true } });
    if (!job) throw new NotFoundException("Job not found.");
    await this.businessAccess.require(userId, job.businessId, "business:catalog:manage");
    const data = await this.prisma.jobApplication.findMany({
      where: { jobId },
      orderBy: { createdAt: "desc" },
    });
    return { data };
  }

  async updateApplication(userId: string, applicationId: string, input: UpdateJobApplicationDto) {
    const application = await this.prisma.jobApplication.findUnique({
      where: { id: applicationId },
      select: { job: { select: { businessId: true } } },
    });
    if (!application) throw new NotFoundException("Application not found.");
    await this.businessAccess.require(userId, application.job.businessId, "business:catalog:manage");
    const data = await this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status: input.status },
    });
    return { data };
  }

  private validateSalary(minimum?: number, maximum?: number) {
    if (minimum !== undefined && maximum !== undefined && maximum < minimum) {
      throw new BadRequestException("Maximum salary cannot be lower than minimum salary.");
    }
  }
}
