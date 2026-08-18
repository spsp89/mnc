import { BadRequestException, ConflictException, Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, randomBytes } from "node:crypto";
import type { Prisma } from "../../generated/prisma/client";
import type { PaymentStatus, RefundStatus } from "../../generated/prisma/enums";
import { PrismaService } from "../../database/prisma.service";
import type { AdminOperationDto, CreateAdminRecordDto } from "./dto/admin-operation.dto";
import type { CreateRankingConfigurationDto } from "./dto/create-ranking-configuration.dto";
import type { ModerateReviewDto } from "./dto/moderate-review.dto";
import type { ModerateProductDto } from "./dto/moderate-product.dto";
import type { ModerateConversationDto } from "./dto/moderate-conversation.dto";
import type { UpdateSupportTicketDto } from "./dto/update-support-ticket.dto";
import type { AdminMerchantActionDto } from "./dto/admin-merchant.dto";
import type { AdminCategoryDto, AdminListingActionDto, AdminLocationDto, ReorderTaxonomyDto, UpdateAdminCategoryDto, UpdateAdminLocationDto } from "./dto/admin-taxonomy.dto";
import type { AdminPlanDto, AdminSubscriptionActionDto, AdminSubscriptionQueryDto, AssignSubscriptionDto, ReorderPlansDto } from "./dto/admin-subscription.dto";
import type { AdminReportQueryDto, AdminUserStatusDto } from "./dto/admin-report.dto";
import { MediaService } from "../media/media.service";
import type { AdminBannerDto } from "./dto/admin-banner.dto";
import type { AdminPaymentActionDto, AdminPaymentQueryDto, AdminRefundQueryDto, CreateAutomaticRefundDto, CreateManualPaymentDto, CreateManualRefundDto } from "./dto/admin-payment.dto";
import type { CreateManualOrderDto } from "./dto/admin-order.dto";
import type { CreateTargetedOfferDto } from "./dto/admin-targeted-offer.dto";
import type { CreateAdminAdvertisementDto } from "./dto/admin-advertisement.dto";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaStorage?: MediaService,
    private readonly config?: ConfigService,
  ) {}

  private requireActionValue<const T extends readonly string[]>(
    value: string | undefined,
    allowed: T,
    label: string,
  ): T[number] {
    if (!value || !allowed.includes(value as T[number])) {
      throw new BadRequestException(`${label} must be one of: ${allowed.join(", ")}.`);
    }
    return value as T[number];
  }

  private requireCreateText(
    data: Record<string, unknown>,
    key: string,
    label: string,
    minimum = 1,
    maximum = 500,
  ) {
    const value = typeof data[key] === "string" ? data[key].trim() : "";
    if (value.length < minimum || value.length > maximum) {
      throw new BadRequestException(`${label} must be between ${minimum} and ${maximum} characters.`);
    }
    return value;
  }

  private jsonSnapshot(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private auditSnapshot(value: unknown): Prisma.InputJsonValue {
    const sensitiveKey = /^(passwordHash|tokenHash|accessToken|refreshToken|secret|otpCode|codeHash|apiKey|privateKey)$/i;
    const redact = (current: unknown): unknown => {
      if (Array.isArray(current)) return current.map(redact);
      if (current && typeof current === "object") {
        return Object.fromEntries(Object.entries(current as Record<string, unknown>).map(([key, nested]) => [
          key,
          sensitiveKey.test(key) ? "[REDACTED]" : redact(nested),
        ]));
      }
      return current;
    };
    return this.jsonSnapshot(redact(value));
  }

  private async assertCategoryParentIsAcyclic(id: string, parentId?: string | null) {
    let cursor = parentId ?? null;
    const visited = new Set<string>();
    while (cursor) {
      if (cursor === id || visited.has(cursor)) throw new BadRequestException("Category hierarchy cannot contain a cycle.");
      visited.add(cursor);
      const parent = await this.prisma.category.findUnique({ where: { id: cursor }, select: { parentId: true } });
      if (!parent) throw new BadRequestException("Parent category not found.");
      cursor = parent.parentId;
    }
  }

  private async assertLocationParentIsAcyclic(id: string, parentId?: string | null) {
    let cursor = parentId ?? null;
    const visited = new Set<string>();
    while (cursor) {
      if (cursor === id || visited.has(cursor)) throw new BadRequestException("Location hierarchy cannot contain a cycle.");
      visited.add(cursor);
      const parent = await this.prisma.managedLocation.findUnique({ where: { id: cursor }, select: { parentId: true } });
      if (!parent) throw new BadRequestException("Parent location not found.");
      cursor = parent.parentId;
    }
  }

  async banners() {
    return { data: await this.prisma.banner.findMany({ orderBy: [{ placement: "asc" }, { displayOrder: "asc" }, { createdAt: "desc" }] }) };
  }

  private validateBannerInput(input: AdminBannerDto) {
    const startsAt = input.startsAt ? new Date(input.startsAt) : null;
    const endsAt = input.endsAt ? new Date(input.endsAt) : null;
    if (startsAt && endsAt && endsAt <= startsAt) throw new BadRequestException("Banner end date must be after its start date.");
    if (Boolean(input.ctaText?.trim()) !== Boolean(input.ctaUrl?.trim())) throw new BadRequestException("CTA text and CTA URL must be supplied together.");
    return { startsAt, endsAt };
  }

  private bannerValues(input: AdminBannerDto, actorId: string, image: { objectKey: string; publicUrl: string }) {
    const { startsAt, endsAt } = this.validateBannerInput(input);
    return { title: input.title.trim(), subtitle: input.subtitle?.trim() || null, ctaText: input.ctaText?.trim() || null, ctaUrl: input.ctaUrl?.trim() || null, placement: input.placement, imageKey: image.objectKey, imageUrl: image.publicUrl, startsAt, endsAt, displayOrder: input.displayOrder, isActive: input.isActive, updatedById: actorId };
  }

  async createBanner(input: AdminBannerDto, actorId: string, requestId: string) {
    if (!this.mediaStorage) throw new BadRequestException("Media storage is unavailable.");
    this.validateBannerInput(input);
    const image = await this.mediaStorage.promoteBannerObject(actorId, input.imageKey);
    return this.auditedMutation({ actorId, requestId, action: "BANNER_CREATED", entityType: "Banner", entityId: (after: { id: string }) => after.id, reason: input.reason, before: null,
      mutate: (transaction) => transaction.banner.create({ data: { ...this.bannerValues(input, actorId, image), createdById: actorId } }) });
  }

  async updateBanner(id: string, input: AdminBannerDto, actorId: string, requestId: string) {
    const before = await this.prisma.banner.findUnique({ where: { id } });
    if (!before) throw new NotFoundException("Banner not found.");
    if (!this.mediaStorage) throw new BadRequestException("Media storage is unavailable.");
    this.validateBannerInput(input);
    const image = input.imageKey === before.imageKey || input.imageKey === before.imageKey.replace("public/banner/", "quarantine/banner/")
      ? { objectKey: before.imageKey, publicUrl: before.imageUrl }
      : await this.mediaStorage.promoteBannerObject(actorId, input.imageKey);
    return this.auditedMutation({ actorId, requestId, action: "BANNER_UPDATED", entityType: "Banner", entityId: id, reason: input.reason, before,
      mutate: (transaction) => transaction.banner.update({ where: { id }, data: this.bannerValues(input, actorId, image) }) });
  }

  private async auditedMutation<T>(options: {
    actorId: string;
    requestId: string;
    action: string;
    entityType: string;
    entityId: string | ((after: T) => string);
    reason: string;
    before: unknown;
    mutate: (transaction: Prisma.TransactionClient) => Promise<T>;
    serializable?: boolean;
  }) {
    const operation = async (transaction: Prisma.TransactionClient) => {
      const after = await options.mutate(transaction);
      const entityId = typeof options.entityId === "function"
        ? options.entityId(after)
        : options.entityId;
      const beforeSnapshot = this.auditSnapshot(options.before);
      const afterSnapshot = this.auditSnapshot(after);
      const previous = await transaction.auditLog.findFirst({
        orderBy: { createdAt: "desc" },
        select: { entryHash: true },
      });
      const payload = JSON.stringify({
        actorId: options.actorId,
        action: options.action,
        entityType: options.entityType,
        entityId,
        reason: options.reason,
        before: beforeSnapshot,
        after: afterSnapshot,
        requestId: options.requestId,
        previousHash: previous?.entryHash ?? null,
      });
      await transaction.auditLog.create({
        data: {
          actorId: options.actorId,
          action: options.action,
          entityType: options.entityType,
          entityId,
          reason: options.reason,
          before: beforeSnapshot,
          after: afterSnapshot,
          requestId: options.requestId,
          previousHash: previous?.entryHash,
          entryHash: createHash("sha256").update(payload).digest("hex"),
        },
      });
      return after;
    };
    const data = options.serializable
      ? await this.prisma.$transaction(operation, { isolationLevel: "Serializable" })
      : await this.prisma.$transaction(operation);
    return { data };
  }

  async subscriptionPlans() {
    const data = await this.prisma.subscriptionPlan.findMany({
      orderBy: [{ displayOrder: "asc" }, { monthlyPrice: "asc" }],
      include: { _count: { select: { subscriptions: true } } },
    });
    return { data };
  }

  async createSubscriptionPlan(input: AdminPlanDto, actorId: string, requestId: string) {
    const { reason, ...values } = input;
    const duplicate = await this.prisma.subscriptionPlan.findFirst({
      where: { OR: [{ name: values.name.trim() }, { slug: values.slug.trim().toLowerCase() }] },
      select: { id: true },
    });
    if (duplicate) throw new ConflictException("A plan with this name or slug already exists.");
    return this.auditedMutation({
      actorId, requestId, action: "SUBSCRIPTION_PLAN_CREATED", entityType: "SubscriptionPlan",
      entityId: (after: { id: string }) => after.id, reason, before: null,
      mutate: (transaction) => transaction.subscriptionPlan.create({
        data: {
          ...values,
          name: values.name.trim(),
          slug: values.slug.trim().toLowerCase(),
          features: values.features.map((feature) => feature.trim()).filter(Boolean),
        },
      }),
    });
  }

  async updateSubscriptionPlan(id: string, input: AdminPlanDto, actorId: string, requestId: string) {
    const before = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!before) throw new NotFoundException("Subscription plan not found.");
    const { reason, ...values } = input;
    const duplicate = await this.prisma.subscriptionPlan.findFirst({
      where: { id: { not: id }, OR: [{ name: values.name.trim() }, { slug: values.slug.trim().toLowerCase() }] },
      select: { id: true },
    });
    if (duplicate) throw new ConflictException("A plan with this name or slug already exists.");
    return this.auditedMutation({
      actorId, requestId, action: "SUBSCRIPTION_PLAN_UPDATED", entityType: "SubscriptionPlan",
      entityId: id, reason, before,
      mutate: (transaction) => transaction.subscriptionPlan.update({
        where: { id },
        data: {
          ...values,
          name: values.name.trim(),
          slug: values.slug.trim().toLowerCase(),
          features: values.features.map((feature) => feature.trim()).filter(Boolean),
        },
      }),
    });
  }

  async reorderSubscriptionPlans(input: ReorderPlansDto, actorId: string, requestId: string) {
    if (!input.ids.length || new Set(input.ids).size !== input.ids.length) {
      throw new BadRequestException("Plan order must contain unique plan identifiers.");
    }
    const existing = await this.prisma.subscriptionPlan.findMany({ where: { id: { in: input.ids } }, select: { id: true, displayOrder: true } });
    if (existing.length !== input.ids.length) throw new BadRequestException("Plan order includes an unknown plan.");
    return this.auditedMutation({
      actorId, requestId, action: "SUBSCRIPTION_PLANS_REORDERED", entityType: "SubscriptionPlanOrder",
      entityId: "global", reason: input.reason, before: existing,
      mutate: async (transaction) => {
        await Promise.all(input.ids.map((id, index) => transaction.subscriptionPlan.update({ where: { id }, data: { displayOrder: index + 1 } })));
        return transaction.subscriptionPlan.findMany({ orderBy: { displayOrder: "asc" } });
      },
    });
  }

  async subscriptions(input: AdminSubscriptionQueryDto) {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 25;
    const paymentStatuses: Record<string, string[]> = {
      pending: ["CREATED", "AUTHORIZED"], paid: ["CAPTURED"], failed: ["FAILED"],
      refunded: ["REFUNDED", "PARTIALLY_REFUNDED"], cancelled: ["CANCELLED"],
    };
    const normalizedPayment = input.paymentStatus?.toLowerCase();
    if (normalizedPayment && !paymentStatuses[normalizedPayment]) throw new BadRequestException("Unknown payment status filter.");
    const where = {
      ...(input.status ? { status: input.status as never } : {}),
      ...(input.planId ? { planId: input.planId } : {}),
      ...(normalizedPayment ? { payments: { some: { status: { in: paymentStatuses[normalizedPayment] as never[] } } } } : {}),
      ...(input.q ? { business: { OR: [
        { name: { contains: input.q, mode: "insensitive" as const } },
        { owner: { user: { email: { contains: input.q, mode: "insensitive" as const } } } },
        { owner: { user: { phone: { contains: input.q } } } },
      ] } } : {}),
    };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.businessSubscription.findMany({
        where,
        include: {
          plan: true,
          business: { select: { id: true, name: true, owner: { select: { user: { select: { email: true, phone: true } } } } } },
          payments: { orderBy: { createdAt: "desc" }, take: 10 },
        },
        orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize,
      }),
      this.prisma.businessSubscription.count({ where }),
    ]);
    const paymentLabel = (status?: string) => status === "CAPTURED" ? "paid"
      : status === "FAILED" ? "failed"
        : status === "REFUNDED" || status === "PARTIALLY_REFUNDED" ? "refunded"
          : status === "CANCELLED" ? "cancelled" : "pending";
    return { data: records.map((record) => ({ ...record, paymentStatus: record.payments.length ? paymentLabel(record.payments[0].status) : "not_applicable" })), meta: { page, pageSize, total } };
  }

  async assignSubscription(input: AssignSubscriptionDto, actorId: string, requestId: string) {
    const [business, plan] = await Promise.all([
      this.prisma.business.findFirst({ where: { id: input.businessId, deletedAt: null }, select: { id: true, name: true } }),
      this.prisma.subscriptionPlan.findFirst({ where: { id: input.planId, isActive: true } }),
    ]);
    if (!business) throw new NotFoundException("Business not found.");
    if (!plan) throw new NotFoundException("Active subscription plan not found.");
    await this.ensurePlanFitsBusiness(input.businessId, plan);
    const now = new Date();
    const periodEnd = new Date(now.getTime() + input.durationDays * 86_400_000);
    return this.auditedMutation({
      actorId, requestId, action: "SUBSCRIPTION_ADMIN_ASSIGNED", entityType: "BusinessSubscription",
      entityId: (after: { id: string }) => after.id, reason: input.reason, before: null,
      mutate: async (transaction) => {
        await transaction.businessSubscription.updateMany({
          where: { businessId: input.businessId, status: { in: ["PENDING_PAYMENT", "TRIAL", "ACTIVE", "PAST_DUE", "GRACE_PERIOD"] } },
          data: { status: "CANCELLED", autoRenew: false, renewalStatus: "CANCELLED", cancelledAt: now },
        });
        return transaction.businessSubscription.create({ data: {
          businessId: input.businessId, planId: input.planId, status: "ACTIVE", billingCycle: input.billingCycle,
          startsAt: now, currentPeriodStart: now, currentPeriodEnd: periodEnd, autoRenew: false,
          renewalStatus: "NOT_DUE", lastRenewedAt: now, source: "ADMIN_GRANT", assignedById: actorId,
        }, include: { plan: true, business: { select: { id: true, name: true } } } });
      },
    });
  }

  async updateSubscription(id: string, input: AdminSubscriptionActionDto, actorId: string, requestId: string) {
    const before = await this.prisma.businessSubscription.findUnique({ where: { id }, include: { plan: true } });
    if (!before) throw new NotFoundException("Subscription not found.");
    let replacementPlan = null;
    if (input.action === "CHANGE_PLAN") {
      replacementPlan = await this.prisma.subscriptionPlan.findFirst({ where: { id: input.planId, isActive: true } });
      if (!replacementPlan) throw new NotFoundException("Active subscription plan not found.");
      await this.ensurePlanFitsBusiness(before.businessId, replacementPlan);
    }
    const now = new Date();
    return this.auditedMutation({
      actorId, requestId, action: `SUBSCRIPTION_ADMIN_${input.action}`, entityType: "BusinessSubscription",
      entityId: id, reason: input.reason, before,
      mutate: (transaction) => {
        if (input.action === "CHANGE_PLAN") return transaction.businessSubscription.update({ where: { id }, data: { planId: replacementPlan!.id, source: "ADMIN_OVERRIDE", assignedById: actorId } });
        if (input.action === "EXTEND") {
          const base = before.currentPeriodEnd > now ? before.currentPeriodEnd : now;
          return transaction.businessSubscription.update({ where: { id }, data: {
            currentPeriodEnd: new Date(base.getTime() + input.extendDays! * 86_400_000), status: "ACTIVE",
            renewalStatus: "NOT_DUE", lastRenewedAt: now, source: "ADMIN_OVERRIDE", assignedById: actorId,
          } });
        }
        if (input.action === "REACTIVATE") return transaction.businessSubscription.update({ where: { id }, data: { status: "ACTIVE", cancelledAt: null, renewalStatus: "NOT_DUE", source: "ADMIN_OVERRIDE", assignedById: actorId } });
        return transaction.businessSubscription.update({ where: { id }, data: { status: "CANCELLED", autoRenew: false, renewalStatus: "CANCELLED", cancelledAt: now, source: "ADMIN_OVERRIDE", assignedById: actorId } });
      },
    });
  }

  private async ensurePlanFitsBusiness(businessId: string, plan: { name: string; productLimit: number | null; mediaLimit: number | null; categoryLimit: number; offerLimit: number | null }) {
    const [products, media, categories, offers] = await Promise.all([
      this.prisma.product.count({ where: { businessId, deletedAt: null } }),
      this.prisma.businessMedia.count({ where: { businessId } }),
      this.prisma.businessCategory.count({ where: { businessId } }),
      this.prisma.offer.count({ where: { businessId, targetCustomerId: null } }),
    ]);
    const excess = [
      plan.productLimit !== null && products > plan.productLimit ? `${products} products` : null,
      plan.mediaLimit !== null && media > plan.mediaLimit ? `${media} media files` : null,
      categories > plan.categoryLimit ? `${categories} categories` : null,
      plan.offerLimit !== null && offers > plan.offerLimit ? `${offers} offers` : null,
    ].filter(Boolean);
    if (excess.length) throw new ConflictException(`${plan.name} cannot be assigned because current usage exceeds its limits: ${excess.join(", ")}.`);
  }

  async getActiveRanking() {
    const configuration = await this.prisma.rankingConfiguration.findFirst({
      where: { active: true },
      orderBy: { version: "desc" },
    });
    return { data: configuration };
  }

  async createRankingConfiguration(
    input: CreateRankingConfigurationDto,
    actorId: string,
    requestId: string,
  ) {
    const values = Object.values(input.weights);
    if (!values.length || values.some((value) => !Number.isFinite(value) || value < 0 || value > 100)) {
      throw new BadRequestException("Ranking weights must be numbers between 0 and 100.");
    }
    const total = values.reduce((sum, value) => sum + value, 0);
    const usesPercentages = Math.abs(total - 100) <= 0.001;
    const usesNormalizedWeights = Math.abs(total - 1) <= 0.001;
    if (!usesPercentages && !usesNormalizedWeights) {
      throw new BadRequestException("Ranking weights must total exactly 1.0 or 100.");
    }
    const normalizedWeights = Object.fromEntries(
      Object.entries(input.weights).map(([name, value]) => [
        name,
        usesPercentages ? value / 100 : value,
      ]),
    );

    const created = await this.prisma.$transaction(async (transaction) => {
      const latest = await transaction.rankingConfiguration.findFirst({
        orderBy: { version: "desc" },
        select: { version: true },
      });
      if (input.activate) {
        await transaction.rankingConfiguration.updateMany({
          where: { active: true },
          data: { active: false },
        });
      }
      const configuration = await transaction.rankingConfiguration.create({
        data: {
          name: input.name,
          version: (latest?.version ?? 0) + 1,
          weights: normalizedWeights,
          active: input.activate,
          createdById: actorId,
          reason: input.reason,
          activatedAt: input.activate ? new Date() : undefined,
        },
      });
      const previous = await transaction.auditLog.findFirst({
        orderBy: { createdAt: "desc" },
        select: { entryHash: true },
      });
      const auditPayload = JSON.stringify({
        actorId,
        action: input.activate ? "RANKING_CONFIGURATION_ACTIVATED" : "RANKING_CONFIGURATION_CREATED",
        entityId: configuration.id,
        reason: input.reason,
        after: configuration,
        requestId,
        previousHash: previous?.entryHash ?? null,
      });
      await transaction.auditLog.create({
        data: {
          actorId,
          action: input.activate ? "RANKING_CONFIGURATION_ACTIVATED" : "RANKING_CONFIGURATION_CREATED",
          entityType: "RankingConfiguration",
          entityId: configuration.id,
          reason: input.reason,
          after: JSON.parse(JSON.stringify(configuration)),
          requestId,
          previousHash: previous?.entryHash,
          entryHash: createHash("sha256").update(auditPayload).digest("hex"),
        },
      });
      return configuration;
    });

    return { data: created };
  }

  async overview() {
    const [users, businesses, pendingVerification, pendingReviews, openTickets, capturedPayments] =
      await this.prisma.$transaction([
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.business.count({ where: { deletedAt: null } }),
        this.prisma.verificationRequest.count({ where: { status: { in: ["PENDING", "IN_REVIEW", "MORE_INFORMATION"] } } }),
        this.prisma.review.count({ where: { status: { in: ["PENDING", "FLAGGED"] }, deletedAt: null } }),
        this.prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER"] } } }),
        this.prisma.payment.aggregate({ where: { status: "CAPTURED" }, _sum: { amount: true } }),
      ]);
    return { data: { users, businesses, pendingVerification, pendingReviews, openTickets, capturedPaymentValue: capturedPayments._sum.amount ?? 0 } };
  }

  async users(page = 1, pageSize = 25, query?: string) {
    const safePage = Math.max(page, 1);
    const safeSize = Math.min(Math.max(pageSize, 1), 100);
    const normalizedQuery = query?.trim();
    const where = {
      deletedAt: null,
      ...(normalizedQuery ? { OR: [
        { email: { contains: normalizedQuery, mode: "insensitive" as const } },
        { phone: { contains: normalizedQuery } },
        { customerProfile: { displayName: { contains: normalizedQuery, mode: "insensitive" as const } } },
      ] } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (safePage - 1) * safeSize,
        take: safeSize,
        select: {
          id: true, phone: true, email: true, role: true, status: true, preferredLanguage: true,
          lastLoginAt: true, createdAt: true, customerProfile: { select: { displayName: true, defaultCity: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data, meta: { page: safePage, pageSize: safeSize, total } };
  }

  async user(id: string) {
    const data = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true, phone: true, email: true, role: true, status: true, preferredLanguage: true,
        phoneVerifiedAt: true, emailVerifiedAt: true, lastLoginAt: true, createdAt: true, updatedAt: true,
        customerProfile: true,
        businessOwner: { select: { businesses: { where: { deletedAt: null }, select: { id: true, name: true, status: true, listingStatus: true, createdAt: true } } } },
        _count: { select: { enquiries: true, reviews: true, savedBusinesses: true, savedProducts: true } },
      },
    });
    if (!data) throw new NotFoundException("User not found.");
    return { data };
  }

  async updateUserStatus(id: string, input: AdminUserStatusDto, actorId: string, requestId: string) {
    const before = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!before) throw new NotFoundException("User not found.");
    const reason = input.reason?.trim() ?? "";
    if (reason.length < 8) throw new BadRequestException("An audit reason of at least 8 characters is required.");
    if (id === actorId && input.status === "SUSPENDED") throw new BadRequestException("You cannot suspend your own administrator account.");
    if (before.status === input.status) throw new ConflictException(`User account is already ${input.status.toLowerCase()}.`);
    return this.auditedMutation({
      actorId, requestId, action: "USER_STATUS_UPDATED", entityType: "User", entityId: id,
      reason, before,
      mutate: (transaction) => transaction.user.update({ where: { id }, data: { status: input.status } }),
    });
  }

  async businesses(page = 1, pageSize = 25, query?: string) {
    const safePage = Math.max(page, 1);
    const safeSize = Math.min(Math.max(pageSize, 1), 100);
    const where = {
      deletedAt: null,
      ...(query ? { OR: [
        { name: { contains: query, mode: "insensitive" as const } },
        { slug: { contains: query, mode: "insensitive" as const } },
        { locations: { some: { city: { contains: query, mode: "insensitive" as const } } } },
      ] } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.business.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (safePage - 1) * safeSize,
        take: safeSize,
        select: {
          id: true, name: true, slug: true, status: true, verified: true, premium: true,
          averageRating: true, reviewCount: true, createdAt: true,
          locations: { where: { isPrimary: true }, take: 1, select: { city: true, district: true } },
        },
      }),
      this.prisma.business.count({ where }),
    ]);
    return { data, meta: { page: safePage, pageSize: safeSize, total } };
  }

  async merchants(page = 1, pageSize = 25, query?: string, status?: string, planId?: string, location?: string, fromValue?: string, toValue?: string) {
    const safePage = Math.max(page, 1);
    const safeSize = Math.min(Math.max(pageSize, 1), 100);
    const statuses = ["PENDING", "DRAFT", "PENDING_VERIFICATION", "ACTIVE", "SUSPENDED", "REJECTED", "CLOSED"] as const;
    if (status && !statuses.includes(status as (typeof statuses)[number])) {
      throw new BadRequestException(`Merchant status must be one of: ${statuses.join(", ")}.`);
    }
    const from = fromValue ? new Date(fromValue) : undefined;
    const to = toValue ? new Date(toValue) : undefined;
    const now = new Date();
    if (from && to && from > to) throw new BadRequestException("Joining date start must not be after end date.");
    const where: Prisma.BusinessWhereInput = {
      deletedAt: null,
      ...(status === "PENDING"
        ? { status: { in: ["DRAFT" as const, "PENDING_VERIFICATION" as const] } }
        : status ? { status: status as Exclude<(typeof statuses)[number], "PENDING"> } : {}),
      ...(query ? { OR: [
        { name: { contains: query, mode: "insensitive" as const } },
        { email: { contains: query, mode: "insensitive" as const } },
        { publicPhone: { contains: query } },
        { owner: { legalName: { contains: query, mode: "insensitive" as const } } },
        { locations: { some: { OR: [
          { city: { contains: query, mode: "insensitive" as const } },
          { district: { contains: query, mode: "insensitive" as const } },
        ] } } },
      ] } : {}),
      ...(planId ? { subscriptions: { some: { planId, status: { in: ["TRIAL", "ACTIVE", "PAST_DUE", "GRACE_PERIOD"] }, currentPeriodEnd: { gte: now } } } } : {}),
      ...(location ? { locations: { some: { OR: [
        { locality: { contains: location, mode: "insensitive" } },
        { city: { contains: location, mode: "insensitive" } },
        { district: { contains: location, mode: "insensitive" } },
        { state: { contains: location, mode: "insensitive" } },
      ] } } } : {}),
      ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.business.findMany({
        where,
        orderBy: [{ status: "asc" }, { createdAt: "asc" }],
        skip: (safePage - 1) * safeSize,
        take: safeSize,
        select: {
          id: true, name: true, slug: true, status: true, verified: true, email: true,
          publicPhone: true, profileCompleteness: true, createdAt: true, updatedAt: true,
          owner: { select: { legalName: true, user: { select: { email: true, phone: true } } } },
          locations: { where: { isPrimary: true }, take: 1, select: { locality: true, city: true, district: true, state: true } },
          subscriptions: { where: { status: { in: ["TRIAL", "ACTIVE", "PAST_DUE", "GRACE_PERIOD"] }, currentPeriodEnd: { gte: now } }, orderBy: { createdAt: "desc" }, take: 1, select: { currentPeriodEnd: true, plan: { select: { id: true, name: true } } } },
          _count: { select: { products: true, services: true, verificationRequests: true } },
        },
      }),
      this.prisma.business.count({ where }),
    ]);
    return { data, meta: { page: safePage, pageSize: safeSize, total } };
  }

  async reportSummary(query: AdminReportQueryDto) {
    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from ? new Date(query.from) : new Date(to.getTime() - 30 * 86_400_000);
    if (from > to) throw new BadRequestException("Report start date must not be after end date.");
    if (to.getTime() - from.getTime() > 366 * 86_400_000) throw new BadRequestException("Report range cannot exceed 366 days.");
    const now = new Date();
    const [
      totalMerchants, approvedMerchants, pendingMerchants, activeListings, totalOffers, activeOffers,
      merchantsInRange, listingsInRange, offersInRange, enquiries, paymentsInRange,
      capturedPaymentsInRange, capturedPaymentValueInRange, subscriptionsInRange, activeSubscriptions,
      distribution, plans,
    ] = await this.prisma.$transaction([
      this.prisma.business.count({ where: { deletedAt: null } }),
      this.prisma.business.count({ where: { deletedAt: null, status: "ACTIVE", verified: true } }),
      this.prisma.business.count({ where: { deletedAt: null, status: { in: ["DRAFT", "PENDING_VERIFICATION"] } } }),
      this.prisma.business.count({ where: { deletedAt: null, status: "ACTIVE", listingStatus: "PUBLISHED" } }),
      this.prisma.offer.count({ where: { business: { deletedAt: null } } }),
      this.prisma.offer.count({ where: { moderationStatus: "APPROVED", isActive: true, startsAt: { lte: now }, endsAt: { gte: now }, business: { status: "ACTIVE", listingStatus: "PUBLISHED", deletedAt: null } } }),
      this.prisma.business.count({ where: { deletedAt: null, createdAt: { gte: from, lte: to } } }),
      this.prisma.business.count({ where: { deletedAt: null, listingStatus: "PUBLISHED", createdAt: { gte: from, lte: to } } }),
      this.prisma.offer.count({ where: { business: { deletedAt: null }, createdAt: { gte: from, lte: to } } }),
      this.prisma.enquiry.count({ where: { createdAt: { gte: from, lte: to } } }),
      this.prisma.payment.count({ where: { createdAt: { gte: from, lte: to } } }),
      this.prisma.payment.count({ where: { status: "CAPTURED", createdAt: { gte: from, lte: to } } }),
      this.prisma.payment.aggregate({ where: { status: "CAPTURED", createdAt: { gte: from, lte: to } }, _sum: { amount: true } }),
      this.prisma.businessSubscription.count({ where: { startsAt: { gte: from, lte: to } } }),
      this.prisma.businessSubscription.count({ where: { status: { in: ["TRIAL", "ACTIVE", "PAST_DUE", "GRACE_PERIOD"] }, currentPeriodEnd: { gte: now } } }),
      this.prisma.businessSubscription.groupBy({ by: ["planId"], where: { status: { in: ["TRIAL", "ACTIVE", "PAST_DUE", "GRACE_PERIOD"] }, currentPeriodEnd: { gte: now } }, orderBy: { planId: "asc" }, _count: { _all: true } }),
      this.prisma.subscriptionPlan.findMany({
        where: { OR: [
          { isActive: true },
          { subscriptions: { some: { status: { in: ["TRIAL", "ACTIVE", "PAST_DUE", "GRACE_PERIOD"] }, currentPeriodEnd: { gte: now } } } },
        ] },
        select: { id: true, name: true, displayOrder: true }, orderBy: { displayOrder: "asc" },
      }),
    ]);
    const counts = new Map((distribution as Array<{ planId: string; _count: { _all: number } }>).map((item) => [item.planId, item._count._all]));
    return { data: {
      range: { from, to }, totalMerchants, approvedMerchants, pendingMerchants, activeListings,
      totalOffers, activeOffers, merchantsInRange, listingsInRange, offersInRange, enquiries,
      paymentsInRange, capturedPaymentsInRange,
      capturedPaymentValueInRange: capturedPaymentValueInRange._sum.amount ?? 0,
      subscriptionsInRange, activeSubscriptions,
      subscriptionDistribution: plans.map((plan) => ({ planId: plan.id, name: plan.name, count: counts.get(plan.id) ?? 0 })),
    } };
  }

  async merchant(id: string) {
    const data = await this.prisma.business.findFirst({
      where: { id, deletedAt: null },
      include: {
        owner: { include: { user: { select: { id: true, email: true, phone: true, status: true, customerProfile: true } } } },
        locations: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
        categories: { include: { category: true }, orderBy: { isPrimary: "desc" } },
        subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" }, take: 3 },
        verificationRequests: { orderBy: { createdAt: "desc" }, take: 10, include: { reviewer: { select: { email: true } } } },
        _count: { select: { products: true, services: true, offers: true, leadAssignments: true, enquiries: true, members: true } },
      },
    });
    if (!data) throw new NotFoundException("Merchant not found.");
    const audit = await this.prisma.auditLog.findMany({
      where: { entityType: "Business", entityId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, action: true, reason: true, createdAt: true, actor: { select: { email: true } } },
    });
    return { data: { ...data, audit } };
  }

  async updateMerchantStatus(
    id: string,
    input: AdminMerchantActionDto,
    actorId: string,
    requestId: string,
  ) {
    const before = await this.prisma.business.findFirst({
      where: { id, deletedAt: null },
      include: { owner: { select: { userId: true } } },
    });
    if (!before) throw new NotFoundException("Merchant not found.");
    const transitions: Record<AdminMerchantActionDto["action"], readonly string[]> = {
      APPROVE: ["DRAFT", "PENDING_VERIFICATION", "REJECTED"],
      REJECT: ["DRAFT", "PENDING_VERIFICATION"],
      SUSPEND: ["ACTIVE"],
      REACTIVATE: ["SUSPENDED"],
    };
    if (!transitions[input.action].includes(before.status)) {
      throw new ConflictException(`${input.action.toLowerCase()} is not allowed while the merchant is ${before.status.toLowerCase()}.`);
    }
    if (input.action === "REACTIVATE" && !before.verified) {
      throw new ConflictException("Only a previously approved merchant can be reactivated.");
    }
    const nextStatus = input.action === "APPROVE" || input.action === "REACTIVATE"
      ? "ACTIVE"
      : input.action === "REJECT"
        ? "REJECTED"
        : "SUSPENDED";
    const verified = input.action === "APPROVE"
      ? true
      : input.action === "REJECT"
        ? false
        : before.verified;
    return this.auditedMutation({
      actorId,
      requestId,
      action: `MERCHANT_${input.action}`,
      entityType: "Business",
      entityId: id,
      reason: input.reason,
      before,
      mutate: async (transaction) => {
        if (input.action === "APPROVE" || input.action === "REJECT") {
          await transaction.verificationRequest.updateMany({
            where: { businessId: id, status: { in: ["PENDING", "IN_REVIEW", "MORE_INFORMATION"] } },
            data: {
              reviewerId: actorId,
              status: input.action === "APPROVE" ? "APPROVED" : "REJECTED",
              notes: input.reason,
              rejectionReason: input.action === "REJECT" ? input.reason : null,
              reviewedAt: new Date(),
            },
          });
        }
        const business = await transaction.business.update({
          where: { id },
          data: {
            status: nextStatus,
            verified,
            publishedAt: nextStatus === "ACTIVE" ? before.publishedAt ?? new Date() : before.publishedAt,
          },
        });
        await transaction.notification.create({
          data: {
            userId: before.owner.userId,
            type: "VERIFICATION_UPDATE",
            channel: "IN_APP",
            title: `Merchant account ${nextStatus.toLowerCase().replaceAll("_", " ")}`,
            body: input.reason,
            data: { businessId: id, action: input.action, status: nextStatus },
            sentAt: new Date(),
          },
        });
        return business;
      },
    });
  }

  async adminCategories() {
    const data = await this.prisma.category.findMany({
      orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
      include: { parent: { select: { id: true, name: true } }, _count: { select: { children: true, businessLinks: true, products: true, services: true } } },
    });
    return { data };
  }

  async createCategory(input: AdminCategoryDto) {
    if (await this.prisma.category.findUnique({ where: { slug: input.slug }, select: { id: true } })) throw new ConflictException("Category slug is already in use.");
    const parent = input.parentId ? await this.prisma.category.findUnique({ where: { id: input.parentId }, select: { level: true } }) : null;
    if (input.parentId && !parent) throw new BadRequestException("Parent category not found.");
    const data = await this.prisma.category.create({ data: { ...input, level: (parent?.level ?? -1) + 1 } });
    return { data };
  }

  async updateCategory(id: string, input: UpdateAdminCategoryDto) {
    const current = await this.prisma.category.findUnique({ where: { id } });
    if (!current) throw new NotFoundException("Category not found.");
    if (input.slug && await this.prisma.category.findFirst({ where: { slug: input.slug, id: { not: id } }, select: { id: true } })) throw new ConflictException("Category slug is already in use.");
    if (input.parentId === id) throw new BadRequestException("A category cannot be its own parent.");
    if (input.parentId !== undefined) await this.assertCategoryParentIsAcyclic(id, input.parentId);
    const parent = input.parentId ? await this.prisma.category.findUnique({ where: { id: input.parentId }, select: { id: true, parentId: true, level: true } }) : null;
    if (input.parentId && !parent) throw new BadRequestException("Parent category not found.");
    if (parent?.parentId === id) throw new BadRequestException("Category hierarchy cannot contain a cycle.");
    const data = await this.prisma.category.update({ where: { id }, data: { ...input, ...(input.parentId !== undefined ? { level: (parent?.level ?? -1) + 1 } : {}) } });
    return { data };
  }

  async reorderCategories(input: ReorderTaxonomyDto) {
    const ids = input.items.map((item) => item.id);
    if (new Set(ids).size !== ids.length) throw new BadRequestException("Category reorder contains duplicate IDs.");
    const count = await this.prisma.category.count({ where: { id: { in: ids } } });
    if (count !== ids.length) throw new BadRequestException("Every reordered category must exist.");
    await this.prisma.$transaction(input.items.map((item) => this.prisma.category.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } })));
    return { data: { reordered: ids.length } };
  }

  async deleteCategory(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id }, include: { _count: { select: { children: true, businessLinks: true, products: true, services: true } } } });
    if (!category) throw new NotFoundException("Category not found.");
    if (Object.values(category._count).some((count) => count > 0)) throw new ConflictException("Category is in use and can only be deactivated.");
    await this.prisma.category.delete({ where: { id } });
    return { data: { id, deleted: true } };
  }

  async managedLocations() {
    const data = await this.prisma.managedLocation.findMany({ orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }, { name: "asc" }], include: { parent: { select: { id: true, name: true } }, _count: { select: { children: true, businesses: true } } } });
    return { data };
  }

  async createManagedLocation(input: AdminLocationDto) {
    if (input.parentId && !(await this.prisma.managedLocation.findUnique({ where: { id: input.parentId }, select: { id: true } }))) throw new BadRequestException("Parent location not found.");
    if (await this.prisma.managedLocation.findFirst({ where: { parentId: input.parentId ?? null, slug: input.slug }, select: { id: true } })) throw new ConflictException("Location slug is already in use under this parent.");
    const data = await this.prisma.managedLocation.create({ data: input });
    return { data };
  }

  async updateManagedLocation(id: string, input: UpdateAdminLocationDto) {
    const current = await this.prisma.managedLocation.findUnique({ where: { id }, select: { id: true, parentId: true } });
    if (!current) throw new NotFoundException("Managed location not found.");
    const effectiveParentId = input.parentId === undefined ? current.parentId : input.parentId;
    if (input.slug && await this.prisma.managedLocation.findFirst({ where: { parentId: effectiveParentId, slug: input.slug, id: { not: id } }, select: { id: true } })) throw new ConflictException("Location slug is already in use under this parent.");
    if (input.parentId === id) throw new BadRequestException("A location cannot be its own parent.");
    if (input.parentId !== undefined) await this.assertLocationParentIsAcyclic(id, input.parentId);
    const parent = input.parentId ? await this.prisma.managedLocation.findUnique({ where: { id: input.parentId }, select: { id: true, parentId: true } }) : null;
    if (input.parentId && !parent) throw new BadRequestException("Parent location not found.");
    if (parent?.parentId === id) throw new BadRequestException("Location hierarchy cannot contain a cycle.");
    const data = await this.prisma.managedLocation.update({ where: { id }, data: input });
    return { data };
  }

  async reorderManagedLocations(input: ReorderTaxonomyDto) {
    const ids = input.items.map((item) => item.id);
    if (new Set(ids).size !== ids.length) throw new BadRequestException("Location reorder contains duplicate IDs.");
    const count = await this.prisma.managedLocation.count({ where: { id: { in: ids } } });
    if (count !== ids.length) throw new BadRequestException("Every reordered location must exist.");
    await this.prisma.$transaction(input.items.map((item) => this.prisma.managedLocation.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } })));
    return { data: { reordered: ids.length } };
  }

  async deleteManagedLocation(id: string) {
    const location = await this.prisma.managedLocation.findUnique({ where: { id }, include: { _count: { select: { children: true, businesses: true } } } });
    if (!location) throw new NotFoundException("Managed location not found.");
    if (location._count.children || location._count.businesses) throw new ConflictException("Location is in use and can only be deactivated.");
    await this.prisma.managedLocation.delete({ where: { id } });
    return { data: { id, deleted: true } };
  }

  async listings(page = 1, pageSize = 25, filters: { q?: string; status?: string; categoryId?: string; locationId?: string }) {
    const safePage = Math.max(page, 1), safeSize = Math.min(Math.max(pageSize, 1), 100);
    const allowed = ["DRAFT", "PUBLISHED", "UNPUBLISHED", "ARCHIVED", "DISABLED"];
    if (filters.status && !allowed.includes(filters.status)) throw new BadRequestException("Invalid listing status.");
    const where: Prisma.BusinessWhereInput = {
      deletedAt: null,
      ...(filters.status ? { listingStatus: filters.status as "DRAFT" } : {}),
      ...(filters.categoryId ? { categories: { some: { categoryId: filters.categoryId } } } : {}),
      ...(filters.locationId ? { locations: { some: { managedLocationId: filters.locationId } } } : {}),
      ...(filters.q ? { OR: [{ name: { contains: filters.q, mode: "insensitive" } }, { slug: { contains: filters.q, mode: "insensitive" } }, { owner: { legalName: { contains: filters.q, mode: "insensitive" } } }] } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.business.findMany({ where, skip: (safePage - 1) * safeSize, take: safeSize, orderBy: { updatedAt: "desc" }, select: { id: true, name: true, slug: true, status: true, listingStatus: true, verified: true, updatedAt: true, owner: { select: { legalName: true } }, categories: { where: { isPrimary: true }, take: 1, select: { category: { select: { name: true } } } }, locations: { where: { isPrimary: true }, take: 1, select: { city: true, locality: true, managedLocationId: true } } } }),
      this.prisma.business.count({ where }),
    ]);
    return { data, meta: { page: safePage, pageSize: safeSize, total } };
  }

  async updateListingStatus(id: string, input: AdminListingActionDto, actorId: string, requestId: string) {
    const before = await this.prisma.business.findFirst({ where: { id, deletedAt: null } });
    if (!before) throw new NotFoundException("Listing not found.");
    if (input.action === "DISABLE" && before.listingStatus !== "PUBLISHED") throw new ConflictException("Only a published listing can be disabled.");
    if (input.action === "REACTIVATE" && before.listingStatus !== "DISABLED") throw new ConflictException("Only a disabled listing can be reactivated.");
    if (input.action === "REACTIVATE" && before.status !== "ACTIVE") throw new ConflictException("Approve or reactivate the merchant account before reactivating its listing.");
    const listingStatus = input.action === "DISABLE" ? "DISABLED" : "PUBLISHED";
    return this.auditedMutation({ actorId, requestId, action: `LISTING_${input.action}`, entityType: "Business", entityId: id, reason: input.reason, before, mutate: (transaction) => transaction.business.update({ where: { id }, data: { listingStatus } }) });
  }

  async reviewModeration(page = 1, pageSize = 25) {
    const safePage = Math.max(page, 1);
    const safeSize = Math.min(Math.max(pageSize, 1), 100);
    const where = { status: { in: ["PENDING" as const, "FLAGGED" as const] }, deletedAt: null };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        where,
        orderBy: { createdAt: "asc" },
        skip: (safePage - 1) * safeSize,
        take: safeSize,
        include: {
          media: true,
          reports: { where: { status: "OPEN" } },
          business: { select: { id: true, name: true } },
          customer: { select: { id: true, customerProfile: { select: { displayName: true } } } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);
    return { data, meta: { page: safePage, pageSize: safeSize, total } };
  }

  async productModeration(page = 1, pageSize = 25) {
    const safePage = Math.max(page, 1);
    const safeSize = Math.min(Math.max(pageSize, 1), 100);
    const where = { status: "SUBMITTED" as const, deletedAt: null };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: { submittedAt: "asc" },
        skip: (safePage - 1) * safeSize,
        take: safeSize,
        include: {
          business: { select: { id: true, name: true, slug: true, status: true } },
          category: { select: { id: true, name: true, slug: true } },
          media: { orderBy: { sortOrder: "asc" } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);
    return { data, meta: { page: safePage, pageSize: safeSize, total } };
  }

  async moderateProduct(
    productId: string,
    input: ModerateProductDto,
    actorId: string,
    requestId: string,
  ) {
    if (!input.reason?.trim()) {
      throw new BadRequestException("An audit reason is required when moderating a product.");
    }
    const before = await this.prisma.product.findFirst({
      where: { id: productId, status: "SUBMITTED", deletedAt: null },
      include: {
        media: {
          select: { id: true, objectKey: true, publicUrl: true, scanStatus: true },
        },
      },
    });
    if (!before) {
      throw new BadRequestException("Submitted product not found.");
    }
    const published = input.action === "PUBLISH";
    const promotedMedia = published && this.mediaStorage
      ? await this.mediaStorage.promoteProductObjects(before.media)
      : [];
    const data = await this.prisma.$transaction(async (transaction) => {
      const current = await transaction.product.findFirst({
        where: { id: productId, status: "SUBMITTED", deletedAt: null },
        select: { id: true },
      });
      if (!current) throw new BadRequestException("Submitted product not found.");
      for (const media of promotedMedia) {
        await transaction.productMedia.update({
          where: { id: media.id },
          data: {
            objectKey: media.objectKey,
            publicUrl: media.publicUrl,
            scanStatus: media.scanStatus,
          },
        });
      }
      const product = await transaction.product.update({
        where: { id: productId },
        data: {
          status: published ? "PUBLISHED" : "REJECTED",
          isActive: published,
          publishedAt: published ? new Date() : null,
          moderationReason: input.reason.trim(),
        },
      });
      const previous = await transaction.auditLog.findFirst({
        orderBy: { createdAt: "desc" },
        select: { entryHash: true },
      });
      const action = published ? "PRODUCT_PUBLISHED" : "PRODUCT_REJECTED";
      const auditPayload = JSON.stringify({
        actorId,
        action,
        productId,
        reason: input.reason.trim(),
        before,
        after: product,
        requestId,
        previousHash: previous?.entryHash ?? null,
      });
      await transaction.auditLog.create({
        data: {
          actorId,
          action,
          entityType: "Product",
          entityId: productId,
          reason: input.reason.trim(),
          before: JSON.parse(JSON.stringify(before)),
          after: JSON.parse(JSON.stringify(product)),
          requestId,
          previousHash: previous?.entryHash,
          entryHash: createHash("sha256").update(auditPayload).digest("hex"),
        },
      });
      return product;
    });
    return { data };
  }

  async moderateReview(reviewId: string, input: ModerateReviewDto, actorId: string, requestId: string) {
    const reason = input.reason?.trim() ?? "";
    if (reason.length < 8) {
      throw new BadRequestException("A moderation reason of at least 8 characters is required.");
    }
    const data = await this.prisma.$transaction(async (transaction) => {
      const before = await transaction.review.findFirst({
        where: { id: reviewId, status: { in: ["PENDING", "FLAGGED"] }, deletedAt: null },
      });
      if (!before) throw new BadRequestException("Pending or flagged review not found.");
      const review = await transaction.review.update({
        where: { id: reviewId },
        data: {
          status: input.action === "PUBLISH" ? "PUBLISHED" : "REMOVED",
          moderationReason: reason,
          deletedAt: input.action === "REMOVE" ? new Date() : null,
        },
      });
      if (input.action === "PUBLISH") {
        const summary = await transaction.review.aggregate({
          where: { businessId: review.businessId, status: "PUBLISHED", deletedAt: null },
          _avg: { overallRating: true },
          _count: true,
        });
        await transaction.business.update({
          where: { id: review.businessId },
          data: { averageRating: summary._avg.overallRating ?? 0, reviewCount: summary._count },
        });
      }
      await transaction.reviewReport.updateMany({
        where: { reviewId, status: "OPEN" },
        data: { status: "RESOLVED", resolvedAt: new Date() },
      });
      const previous = await transaction.auditLog.findFirst({ orderBy: { createdAt: "desc" }, select: { entryHash: true } });
      const action = input.action === "PUBLISH" ? "REVIEW_PUBLISHED" : "REVIEW_REMOVED";
      const auditPayload = JSON.stringify({ actorId, action, reviewId, reason, before, after: review, requestId, previousHash: previous?.entryHash ?? null });
      await transaction.auditLog.create({
        data: {
          actorId, action, entityType: "Review", entityId: reviewId, reason,
          before: JSON.parse(JSON.stringify(before)),
          after: JSON.parse(JSON.stringify(review)),
          requestId,
          previousHash: previous?.entryHash,
          entryHash: createHash("sha256").update(auditPayload).digest("hex"),
        },
      });
      return review;
    });
    return { data };
  }

  async applyOperationalAction(
    section: string,
    recordId: string,
    input: AdminOperationDto,
    actorId: string,
    requestId: string,
  ) {
    const auditAction = `ADMIN_${section.toUpperCase().replaceAll("-", "_")}_${input.action}`;

    if (section === "businesses") {
      const before = await this.prisma.business.findFirst({
        where: { id: recordId, deletedAt: null },
      });
      if (!before) throw new BadRequestException("Business not found.");
      const data = input.action === "SET_STATUS"
        ? {
            status: this.requireActionValue(input.value, [
              "DRAFT", "PENDING_VERIFICATION", "ACTIVE", "SUSPENDED", "REJECTED", "CLOSED",
            ] as const, "Business status"),
          }
        : input.action === "VERIFY"
          ? { verified: true }
          : input.action === "UNVERIFY"
            ? { verified: false }
            : input.action === "SET_PREMIUM"
              ? { premium: true }
              : input.action === "UNSET_PREMIUM"
                ? { premium: false }
                : null;
      if (!data) throw new BadRequestException("Unsupported business action.");
      return this.auditedMutation({
        actorId, requestId, action: auditAction, entityType: "Business", entityId: recordId,
        reason: input.reason, before,
        mutate: (transaction) => transaction.business.update({ where: { id: recordId }, data }),
      });
    }

    if (section === "users") {
      if (input.action !== "SET_STATUS") throw new BadRequestException("Unsupported user action.");
      const before = await this.prisma.user.findFirst({ where: { id: recordId, deletedAt: null } });
      if (!before) throw new BadRequestException("User not found.");
      const status = this.requireActionValue(
        input.value,
        ["PENDING", "ACTIVE", "SUSPENDED"] as const,
        "User status",
      );
      if (recordId === actorId && status === "SUSPENDED") {
        throw new BadRequestException("You cannot suspend your own administrator account.");
      }
      return this.auditedMutation({
        actorId, requestId, action: auditAction, entityType: "User", entityId: recordId,
        reason: input.reason, before,
        mutate: (transaction) => transaction.user.update({ where: { id: recordId }, data: { status } }),
      });
    }

    if (section === "leads") {
      if (input.action !== "SET_STATUS") throw new BadRequestException("Unsupported lead action.");
      const before = await this.prisma.lead.findUnique({ where: { id: recordId } });
      if (!before) throw new BadRequestException("Lead not found.");
      const status = this.requireActionValue(input.value, [
        "NEW", "MATCHING", "DELIVERED", "VIEWED", "ACCEPTED", "CONTACTED", "CONVERTED", "EXPIRED", "REJECTED", "SPAM",
      ] as const, "Lead status");
      return this.auditedMutation({
        actorId, requestId, action: auditAction, entityType: "Lead", entityId: recordId,
        reason: input.reason, before,
        mutate: (transaction) => transaction.lead.update({ where: { id: recordId }, data: { status } }),
      });
    }

    if (section === "enquiries") {
      if (input.action !== "SET_STATUS") throw new BadRequestException("Unsupported enquiry action.");
      const before = await this.prisma.enquiry.findUnique({ where: { id: recordId } });
      if (!before) throw new BadRequestException("Enquiry not found.");
      const status = this.requireActionValue(input.value, [
        "SUBMITTED", "MATCHING", "RESPONDED", "CLOSED", "EXPIRED", "SPAM",
      ] as const, "Enquiry status");
      return this.auditedMutation({
        actorId, requestId, action: auditAction, entityType: "Enquiry", entityId: recordId,
        reason: input.reason, before,
        mutate: (transaction) => transaction.enquiry.update({ where: { id: recordId }, data: { status } }),
      });
    }

    if (section === "categories" || section === "subcategories") {
      if (!['ACTIVATE', 'DEACTIVATE'].includes(input.action)) {
        throw new BadRequestException("Unsupported category action.");
      }
      const before = await this.prisma.category.findUnique({ where: { id: recordId } });
      if (!before || (section === "categories" ? before.parentId !== null : before.parentId === null)) {
        throw new BadRequestException(`${section === "categories" ? "Category" : "Subcategory"} not found.`);
      }
      return this.auditedMutation({
        actorId, requestId, action: auditAction, entityType: "Category", entityId: recordId,
        reason: input.reason, before,
        mutate: (transaction) => transaction.category.update({
          where: { id: recordId },
          data: { isActive: input.action === "ACTIVATE" },
        }),
      });
    }

    if (section === "services") {
      if (!['ACTIVATE', 'DEACTIVATE'].includes(input.action)) {
        throw new BadRequestException("Unsupported service action.");
      }
      const before = await this.prisma.service.findFirst({ where: { id: recordId, deletedAt: null } });
      if (!before) throw new BadRequestException("Service not found.");
      return this.auditedMutation({
        actorId, requestId, action: auditAction, entityType: "Service", entityId: recordId,
        reason: input.reason, before,
        mutate: (transaction) => transaction.service.update({
          where: { id: recordId }, data: { isActive: input.action === "ACTIVATE" },
        }),
      });
    }

    if (section === "plans") {
      if (!['ACTIVATE', 'DEACTIVATE'].includes(input.action)) {
        throw new BadRequestException("Unsupported subscription plan action.");
      }
      const before = await this.prisma.subscriptionPlan.findUnique({ where: { id: recordId } });
      if (!before) throw new BadRequestException("Subscription plan not found.");
      return this.auditedMutation({
        actorId, requestId, action: auditAction, entityType: "SubscriptionPlan", entityId: recordId,
        reason: input.reason, before,
        mutate: (transaction) => transaction.subscriptionPlan.update({
          where: { id: recordId }, data: { isActive: input.action === "ACTIVATE" },
        }),
      });
    }

    if (section === "orders") {
      if (input.action !== "SET_STATUS") throw new BadRequestException("Unsupported order action.");
      const before = await this.prisma.order.findUnique({ where: { id: recordId } });
      if (!before) throw new BadRequestException("Order not found.");
      const status = this.requireActionValue(input.value, [
        "PENDING", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "DISPATCHED", "DELIVERED", "CANCELLED", "RETURN_REQUESTED", "RETURNED", "REFUNDED",
      ] as const, "Order status");
      const now = new Date();
      return this.auditedMutation({
        actorId, requestId, action: auditAction, entityType: "Order", entityId: recordId,
        reason: input.reason, before,
        mutate: (transaction) => transaction.order.update({
          where: { id: recordId },
          data: {
            status,
            confirmedAt: status === "CONFIRMED" ? before.confirmedAt ?? now : undefined,
            deliveredAt: status === "DELIVERED" ? before.deliveredAt ?? now : undefined,
            cancelledAt: status === "CANCELLED" ? before.cancelledAt ?? now : undefined,
          },
        }),
      });
    }

    if (section === "offers") {
      const before = await this.prisma.offer.findUnique({ where: { id: recordId } });
      if (!before) throw new BadRequestException("Offer not found.");
      if (before.targetCustomerId && input.action === "FEATURE") {
        throw new BadRequestException("A customer-specific offer cannot be featured publicly.");
      }
      const data = input.action === "APPROVE"
        ? { moderationStatus: "APPROVED" as const, moderationReason: input.reason, moderatedAt: new Date(), moderatedById: actorId, isActive: true }
        : input.action === "REJECT"
          ? { moderationStatus: "REJECTED" as const, moderationReason: input.reason, moderatedAt: new Date(), moderatedById: actorId, isActive: false }
        : input.action === "ACTIVATE"
        ? { isActive: true }
        : input.action === "DEACTIVATE"
          ? { isActive: false }
          : input.action === "FEATURE"
            ? { isFeatured: true }
            : input.action === "UNFEATURE"
              ? { isFeatured: false }
              : null;
      if (!data) throw new BadRequestException("Unsupported offer action.");
      return this.auditedMutation({
        actorId, requestId, action: input.action === "APPROVE" ? "OFFER_APPROVED" : input.action === "REJECT" ? "OFFER_REJECTED" : auditAction, entityType: "Offer", entityId: recordId,
        reason: input.reason, before,
        mutate: (transaction) => transaction.offer.update({ where: { id: recordId }, data }),
      });
    }

    if (section === "advertisements") {
      if (input.action !== "SET_STATUS") throw new BadRequestException("Unsupported advertisement action.");
      const before = await this.prisma.advertisement.findUnique({ where: { id: recordId } });
      if (!before) throw new BadRequestException("Advertisement not found.");
      const status = this.requireActionValue(input.value, [
        "DRAFT", "SCHEDULED", "ACTIVE", "PAUSED", "COMPLETED", "REJECTED",
      ] as const, "Advertisement status");
      return this.auditedMutation({
        actorId, requestId, action: auditAction, entityType: "Advertisement", entityId: recordId,
        reason: input.reason, before,
        mutate: (transaction) => transaction.advertisement.update({ where: { id: recordId }, data: { status } }),
      });
    }

    if (section === "locations") {
      if (!['ACTIVATE', 'DEACTIVATE', 'MAKE_PRIMARY'].includes(input.action)) {
        throw new BadRequestException("Unsupported location action.");
      }
      const before = await this.prisma.businessLocation.findUnique({ where: { id: recordId } });
      if (!before) throw new BadRequestException("Business location not found.");
      if (input.action === "DEACTIVATE" && before.isPrimary) {
        throw new BadRequestException("Make another active location primary before deactivating this one.");
      }
      return this.auditedMutation({
        actorId, requestId, action: auditAction, entityType: "BusinessLocation", entityId: recordId,
        reason: input.reason, before,
        mutate: async (transaction) => {
          if (input.action === "MAKE_PRIMARY") {
            await transaction.businessLocation.updateMany({
              where: { businessId: before.businessId, id: { not: recordId } },
              data: { isPrimary: false },
            });
          }
          return transaction.businessLocation.update({
            where: { id: recordId },
            data: input.action === "MAKE_PRIMARY"
              ? { isPrimary: true, isActive: true }
              : { isActive: input.action === "ACTIVATE" },
          });
        },
      });
    }

    if (section === "reports") {
      if (!['RESOLVE', 'DISMISS', 'REOPEN'].includes(input.action)) {
        throw new BadRequestException("Unsupported report action.");
      }
      const before = await this.prisma.reviewReport.findUnique({ where: { id: recordId } });
      if (!before) throw new BadRequestException("Report not found.");
      const status = input.action === "REOPEN" ? "OPEN" : input.action === "DISMISS" ? "DISMISSED" : "RESOLVED";
      return this.auditedMutation({
        actorId, requestId, action: auditAction, entityType: "ReviewReport", entityId: recordId,
        reason: input.reason, before,
        mutate: (transaction) => transaction.reviewReport.update({
          where: { id: recordId },
          data: { status, resolvedAt: status === "OPEN" ? null : new Date() },
        }),
      });
    }

    if (section === "translations") {
      if (!['MARK_REVIEWED', 'CORRECT'].includes(input.action)) {
        throw new BadRequestException("Unsupported translation action.");
      }
      const before = await this.prisma.translation.findUnique({ where: { id: recordId } });
      if (!before) throw new BadRequestException("Translation not found.");
      const correctedText = input.action === "CORRECT" ? input.value?.trim() : undefined;
      if (input.action === "CORRECT" && (!correctedText || correctedText.length > 2000)) {
        throw new BadRequestException("Corrected translation must be between 1 and 2000 characters.");
      }
      return this.auditedMutation({
        actorId, requestId, action: auditAction, entityType: "Translation", entityId: recordId,
        reason: input.reason, before,
        mutate: (transaction) => transaction.translation.update({
          where: { id: recordId },
          data: input.action === "CORRECT"
            ? { translatedText: correctedText, status: "MANUALLY_CORRECTED", correctedAt: new Date(), correctedById: actorId }
            : { status: "REVIEWED" },
        }),
      });
    }

    if (section === "content") {
      if (!['APPROVE', 'QUARANTINE'].includes(input.action)) {
        throw new BadRequestException("Unsupported content action.");
      }
      const before = await this.prisma.businessMedia.findUnique({ where: { id: recordId } });
      if (!before) throw new BadRequestException("Content asset not found.");
      return this.auditedMutation({
        actorId, requestId, action: auditAction, entityType: "BusinessMedia", entityId: recordId,
        reason: input.reason, before,
        mutate: (transaction) => transaction.businessMedia.update({
          where: { id: recordId }, data: { scanStatus: input.action === "APPROVE" ? "clean" : "quarantined" },
        }),
      });
    }

    if (section === "settings") {
      if (!['REVOKE', 'RESTORE'].includes(input.action)) {
        throw new BadRequestException("Unsupported role assignment action.");
      }
      const before = await this.prisma.globalRoleAssignment.findUnique({ where: { id: recordId } });
      if (!before) throw new BadRequestException("Role assignment not found.");
      if (input.action === "REVOKE" && before.userId === actorId) {
        throw new BadRequestException("You cannot revoke your own administrator role assignment.");
      }
      if (input.action === "REVOKE" && before.role === "SUPER_ADMIN") {
        const activeSuperAdmins = await this.prisma.globalRoleAssignment.count({
          where: { role: "SUPER_ADMIN", active: true },
        });
        if (activeSuperAdmins <= 1) {
          throw new BadRequestException("At least one active super administrator must remain.");
        }
      }
      return this.auditedMutation({
        actorId, requestId, action: auditAction, entityType: "GlobalRoleAssignment", entityId: recordId,
        reason: input.reason, before,
        mutate: (transaction) => transaction.globalRoleAssignment.update({
          where: { id: recordId },
          data: { active: input.action === "RESTORE", revokedAt: input.action === "REVOKE" ? new Date() : null },
        }),
      });
    }

    throw new BadRequestException("This admin section is read-only or does not support that action.");
  }

  async createOperationalRecord(
    section: string,
    input: CreateAdminRecordDto,
    actorId: string,
    requestId: string,
  ) {
    if (section === "categories" || section === "subcategories") {
      const name = this.requireCreateText(input.data, "name", "Name", 2, 120);
      const slug = this.requireCreateText(input.data, "slug", "Slug", 2, 160).toLowerCase();
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        throw new BadRequestException("Slug must contain lowercase letters, numbers, and single hyphens only.");
      }
      const duplicate = await this.prisma.category.findUnique({ where: { slug } });
      if (duplicate) throw new BadRequestException("That category slug is already in use.");
      const description = typeof input.data.description === "string"
        ? input.data.description.trim().slice(0, 1000) || null
        : null;
      let parentId: string | null = null;
      let level = 0;
      if (section === "subcategories") {
        parentId = this.requireCreateText(input.data, "parentId", "Parent category", 1, 100);
        const parent = await this.prisma.category.findUnique({ where: { id: parentId } });
        if (!parent) throw new BadRequestException("Parent category not found.");
        level = parent.level + 1;
      }
      return this.auditedMutation({
        actorId,
        requestId,
        action: `ADMIN_${section.toUpperCase()}_CREATED`,
        entityType: "Category",
        entityId: (created: { id: string }) => created.id,
        reason: input.reason,
        before: {},
        mutate: (transaction) => transaction.category.create({
          data: { name, slug, description, parentId, level, isActive: true },
        }),
      });
    }

    if (section === "notifications") {
      const recipientEmail = this.requireCreateText(input.data, "recipientEmail", "Recipient email", 3, 320).toLowerCase();
      const title = this.requireCreateText(input.data, "title", "Title", 3, 160);
      const body = this.requireCreateText(input.data, "body", "Message", 8, 1000);
      const recipient = await this.prisma.user.findFirst({
        where: { email: { equals: recipientEmail, mode: "insensitive" }, deletedAt: null },
        select: { id: true, email: true },
      });
      if (!recipient) throw new BadRequestException("No active user has that email address.");
      return this.auditedMutation({
        actorId,
        requestId,
        action: "ADMIN_NOTIFICATION_CREATED",
        entityType: "Notification",
        entityId: (created: { id: string }) => created.id,
        reason: input.reason,
        before: {},
        mutate: (transaction) => transaction.notification.create({
          data: {
            userId: recipient.id,
            type: "SUPPORT_UPDATE",
            channel: "IN_APP",
            title,
            body,
            data: { source: "admin-console", actorId },
            sentAt: new Date(),
          },
          include: { user: { select: { email: true } } },
        }),
      });
    }

    if (section === "translations") {
      const entityType = this.requireActionValue(
        this.requireCreateText(input.data, "entityType", "Content type", 2, 40).toUpperCase(),
        ["WEBSITE", "BUSINESS", "PRODUCT", "SERVICE", "CATEGORY", "OFFER"] as const,
        "Content type",
      );
      const entityId = this.requireCreateText(input.data, "entityId", "Content record", 1, 160);
      const field = this.requireCreateText(input.data, "field", "Field", 1, 80).toLowerCase();
      if (!/^[a-z][a-z0-9_]*$/.test(field)) {
        throw new BadRequestException("Field must use lowercase letters, numbers, and underscores only.");
      }
      const sourceLanguage = this.requireCreateText(input.data, "sourceLanguage", "Source language", 2, 5);
      const targetLanguage = this.requireCreateText(input.data, "targetLanguage", "Target language", 2, 5);
      const languagePattern = /^[a-z]{2,3}(?:-[A-Z]{2})?$/;
      if (!languagePattern.test(sourceLanguage) || !languagePattern.test(targetLanguage)) {
        throw new BadRequestException("Languages must use a valid code such as en, ml, hi, or en-IN.");
      }
      if (sourceLanguage === targetLanguage) {
        throw new BadRequestException("Source and target languages must be different.");
      }
      const originalText = this.requireCreateText(input.data, "originalText", "Source text", 1, 2000);
      const translatedText = this.requireCreateText(input.data, "translatedText", "Translated text", 1, 2000);
      const duplicate = await this.prisma.translation.findUnique({
        where: { entityType_entityId_field_targetLanguage: { entityType, entityId, field, targetLanguage } },
        select: { id: true },
      });
      if (duplicate) {
        throw new BadRequestException("A translation for this content field and target language already exists.");
      }
      return this.auditedMutation({
        actorId,
        requestId,
        action: "ADMIN_TRANSLATION_CREATED",
        entityType: "Translation",
        entityId: (created: { id: string }) => created.id,
        reason: input.reason,
        before: {},
        mutate: (transaction) => transaction.translation.create({
          data: {
            entityType,
            entityId,
            field,
            sourceLanguage,
            targetLanguage,
            originalText,
            translatedText,
            provider: "ADMIN",
            status: "MANUALLY_CORRECTED",
            correctedAt: new Date(),
            correctedById: actorId,
          },
        }),
      });
    }

    if (section === "services") {
      const businessId = this.requireCreateText(input.data, "businessId", "Business", 1, 100);
      const categoryId = this.requireCreateText(input.data, "categoryId", "Category", 1, 100);
      const name = this.requireCreateText(input.data, "name", "Name", 2, 160);
      const slug = this.requireCreateText(input.data, "slug", "Slug", 2, 180).toLowerCase();
      const description = this.requireCreateText(input.data, "description", "Description", 8, 5000);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        throw new BadRequestException("Slug must contain lowercase letters, numbers, and single hyphens only.");
      }
      const pricingType = this.requireActionValue(
        typeof input.data.pricingType === "string" ? input.data.pricingType : "STARTING_AT",
        ["FIXED", "STARTING_AT", "HOURLY", "DAILY", "PER_UNIT", "QUOTE"] as const,
        "Pricing type",
      );
      const rawPrice = typeof input.data.startingPrice === "string" ? input.data.startingPrice.trim() : "";
      const startingPrice = rawPrice ? Number(rawPrice) : null;
      if (pricingType !== "QUOTE" && (startingPrice === null || !Number.isFinite(startingPrice) || startingPrice < 0)) {
        throw new BadRequestException("Starting price must be a valid non-negative amount unless pricing is quote-based.");
      }
      if (startingPrice !== null && (!Number.isFinite(startingPrice) || startingPrice < 0 || startingPrice > 999999999.99)) {
        throw new BadRequestException("Starting price must be between 0 and 999999999.99.");
      }
      const rawDuration = typeof input.data.durationMinutes === "string" ? input.data.durationMinutes.trim() : "";
      const durationMinutes = rawDuration ? Number(rawDuration) : null;
      if (durationMinutes !== null && (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 10080)) {
        throw new BadRequestException("Duration must be a whole number between 1 and 10080 minutes.");
      }
      const [business, category, duplicate] = await Promise.all([
        this.prisma.business.findFirst({ where: { id: businessId, deletedAt: null }, select: { id: true } }),
        this.prisma.category.findUnique({ where: { id: categoryId }, select: { id: true, isActive: true } }),
        this.prisma.service.findUnique({ where: { businessId_slug: { businessId, slug } }, select: { id: true } }),
      ]);
      if (!business) throw new BadRequestException("Business not found.");
      if (!category?.isActive) throw new BadRequestException("Select an active category.");
      if (duplicate) throw new BadRequestException("That service slug is already in use for this business.");
      return this.auditedMutation({
        actorId,
        requestId,
        action: "ADMIN_SERVICE_CREATED",
        entityType: "Service",
        entityId: (created: { id: string }) => created.id,
        reason: input.reason,
        before: {},
        mutate: async (transaction) => {
          await transaction.businessCategory.upsert({
            where: { businessId_categoryId: { businessId, categoryId } },
            create: { businessId, categoryId },
            update: {},
          });
          return transaction.service.create({ data: {
            businessId,
            categoryId,
            name,
            slug,
            description,
            pricingType,
            startingPrice,
            durationMinutes,
            homeService: input.data.homeService === true || input.data.homeService === "true",
            isActive: input.data.isActive !== false && input.data.isActive !== "false",
          },
          include: {
            business: { select: { id: true, name: true } },
            category: { select: { id: true, name: true } },
          } });
        },
      });
    }

    throw new BadRequestException("This admin section does not support record creation.");
  }

  async serviceOptions() {
    const [businesses, activeCategories] = await Promise.all([
      this.prisma.business.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" }, take: 500,
        select: { id: true, name: true, status: true, categories: { select: { categoryId: true } } } }),
      this.prisma.category.findMany({ where: { isActive: true }, orderBy: [{ level: "asc" }, { name: "asc" }],
        select: { id: true, name: true, parentId: true } }),
    ]);
    return {
      data: businesses.map(({ categories: businessLinks, ...business }) => ({
        ...business,
        categories: activeCategories.map((category) => ({
          ...category,
          linked: businessLinks.some(({ categoryId }) => categoryId === category.id),
        })),
      })),
    };
  }

  async inventory(section: string) {
    switch (section) {
      case "leads": {
        const records = await this.prisma.lead.findMany({
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            requirement: true,
            productQuery: true,
            source: true,
            urgency: true,
            status: true,
            expiresAt: true,
            createdAt: true,
            category: { select: { name: true } },
            assignments: {
              take: 1,
              orderBy: { matchScore: "desc" },
              select: { business: { select: { name: true } } },
            },
          },
        });
        return {
          data: records.map(({ category, assignments, ...record }) => ({
            ...record,
            category: category.name,
            business: assignments[0]?.business,
            description:
              record.productQuery ||
              [record.source, record.urgency].filter(Boolean).join(" · "),
          })),
        };
      }
      case "enquiries": {
        const records = await this.prisma.enquiry.findMany({
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            requirement: true,
            urgency: true,
            contactPreference: true,
            status: true,
            preferredDate: true,
            expiresAt: true,
            createdAt: true,
            category: { select: { name: true } },
            business: { select: { name: true } },
            items: { select: { productId: true, serviceId: true, quantity: true } },
          },
        });
        return {
          data: records.map(({ category, items, ...record }) => ({
            ...record,
            category: category.name,
            description: [
              record.contactPreference,
              record.urgency,
              `${items.length} item${items.length === 1 ? "" : "s"}`,
            ].filter(Boolean).join(" · "),
          })),
        };
      }
      case "orders": {
        const records = await this.prisma.order.findMany({
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            fulfilmentType: true,
            total: true,
            notes: true,
            createdAt: true,
            business: { select: { name: true } },
            items: { select: { nameSnapshot: true, quantity: true } },
          },
        });
        return {
          data: records.map(({ orderNumber, items, ...record }) => ({
            ...record,
            title: orderNumber,
            description:
              record.notes ||
              `₹${Number(record.total).toLocaleString("en-IN")} · ${items.length} item${items.length === 1 ? "" : "s"} · ${record.fulfilmentType}`,
          })),
        };
      }
      case "advertisements": {
        const records = await this.prisma.advertisement.findMany({
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            title: true,
            placement: true,
            destination: true,
            budget: true,
            spent: true,
            status: true,
            startsAt: true,
            endsAt: true,
            impressions: true,
            clicks: true,
            business: { select: { name: true } },
          },
        });
        return {
          data: records.map((record) => ({
            ...record,
            category: record.placement,
            description: `₹${Number(record.spent).toLocaleString("en-IN")} of ₹${Number(record.budget).toLocaleString("en-IN")} · ${record.impressions} impressions · ${record.clicks} clicks`,
          })),
        };
      }
      case "reports": {
        const records = await this.prisma.reviewReport.findMany({
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            reason: true,
            details: true,
            status: true,
            createdAt: true,
            resolvedAt: true,
            review: {
              select: {
                id: true,
                business: { select: { name: true } },
              },
            },
          },
        });
        return {
          data: records.map(({ review, ...record }) => ({
            ...record,
            title: record.reason,
            description: record.details,
            business: review.business,
          })),
        };
      }
      case "notifications": {
        const records = await this.prisma.notification.findMany({
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            title: true,
            body: true,
            type: true,
            channel: true,
            readAt: true,
            sentAt: true,
            failedAt: true,
            createdAt: true,
            user: { select: { email: true } },
          },
        });
        return {
          data: records.map((record) => ({
            ...record,
            status: record.failedAt
              ? "FAILED"
              : record.sentAt
                ? "SENT"
                : "QUEUED",
            email: record.user.email,
            category: `${record.type} · ${record.channel}`,
          })),
        };
      }
      case "translations": {
        const records = await this.prisma.translation.findMany({
          orderBy: { updatedAt: "desc" },
          take: 100,
          select: {
            id: true,
            entityType: true,
            entityId: true,
            field: true,
            sourceLanguage: true,
            targetLanguage: true,
            originalText: true,
            translatedText: true,
            provider: true,
            status: true,
            updatedAt: true,
          },
        });
        return {
          data: records.map((record) => ({
            ...record,
            title: `${record.entityType} · ${record.field}`,
            category: `${record.sourceLanguage} → ${record.targetLanguage}`,
            description: record.translatedText,
          })),
        };
      }
      case "content": {
        const records = await this.prisma.businessMedia.findMany({
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            mediaType: true,
            altText: true,
            publicUrl: true,
            scanStatus: true,
            sortOrder: true,
            createdAt: true,
            business: { select: { name: true } },
          },
        });
        return {
          data: records.map((record) => ({
            ...record,
            title: record.altText || `${record.mediaType} asset`,
            status: record.scanStatus,
            description: record.publicUrl,
          })),
        };
      }
      case "settings": {
        const records = await this.prisma.globalRoleAssignment.findMany({
          orderBy: { updatedAt: "desc" },
          take: 100,
          select: {
            id: true,
            role: true,
            reason: true,
            active: true,
            createdAt: true,
            updatedAt: true,
            revokedAt: true,
            user: { select: { email: true, status: true } },
          },
        });
        return {
          data: records.map((record) => ({
            ...record,
            title: record.user.email || record.role,
            email: record.user.email,
            status: record.active ? "ACTIVE" : "REVOKED",
            category: record.role,
            description: record.reason,
          })),
        };
      }
      case "categories": {
        const records = await this.prisma.category.findMany({
          where: { parentId: null },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          take: 100,
          select: {
            id: true,
            name: true,
            nameMalayalam: true,
            slug: true,
            description: true,
            icon: true,
            level: true,
            sortOrder: true,
            isActive: true,
            _count: { select: { children: true, businessLinks: true, products: true, services: true } },
          },
        });
        return {
          data: records.map((record) => ({
            ...record,
            status: record.isActive ? "ACTIVE" : "INACTIVE",
            description: record.description || `${record._count.children} subcategories · ${record._count.businessLinks} businesses · ${record._count.products + record._count.services} listings`,
          })),
        };
      }
      case "subcategories": {
        const records = await this.prisma.category.findMany({
          where: { parentId: { not: null } },
          orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
          take: 100,
          select: {
            id: true,
            name: true,
            slug: true,
            level: true,
            isActive: true,
            description: true,
            parent: { select: { id: true, name: true } },
          },
        });
        return {
          data: records.map(({ parent, ...record }) => ({
            ...record,
            status: record.isActive ? "ACTIVE" : "INACTIVE",
            category: parent?.name,
            parentId: parent?.id,
            parent,
          })),
        };
      }
      case "plans": {
        const records = await this.prisma.subscriptionPlan.findMany({
          orderBy: [{ displayOrder: "asc" }, { monthlyPrice: "asc" }],
          take: 100,
        });
        return {
          data: records.map((record) => ({
            ...record,
            status: record.isActive ? "ACTIVE" : "INACTIVE",
            description: `₹${Number(record.monthlyPrice).toLocaleString("en-IN")}/month · ₹${Number(record.annualPrice).toLocaleString("en-IN")}/year · ${record.productLimit ?? "Unlimited"} products`,
          })),
        };
      }
      case "locations": {
        const records = await this.prisma.businessLocation.findMany({
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            label: true,
            locality: true,
            city: true,
            district: true,
            state: true,
            postalCode: true,
            serviceRadiusKm: true,
            isPrimary: true,
            isActive: true,
            createdAt: true,
            business: { select: { id: true, name: true } },
          },
        });
        return {
          data: records.map((record) => ({
            ...record,
            title: record.locality,
            status: record.isActive ? "ACTIVE" : "INACTIVE",
            category: `${record.city} · ${record.district}`,
            description: `${record.postalCode} · ${record.serviceRadiusKm} km service radius${record.isPrimary ? " · primary" : ""}`,
          })),
        };
      }
      case "services": {
        const records = await this.prisma.service.findMany({
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            name: true,
            description: true,
            pricingType: true,
            startingPrice: true,
            homeService: true,
            isActive: true,
            createdAt: true,
            business: { select: { name: true } },
            category: { select: { name: true } },
          },
        });
        return {
          data: records.map(({ category, ...record }) => ({
            ...record,
            category: category.name,
            status: record.isActive ? "ACTIVE" : "INACTIVE",
          })),
        };
      }
      case "offers": {
        const now = new Date();
        const records = await this.prisma.offer.findMany({
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            discountValue: true,
            couponCode: true,
            startsAt: true,
            endsAt: true,
            isFeatured: true,
            featuredRequested: true,
            isActive: true,
            moderationStatus: true,
            moderationReason: true,
            redemptionCount: true,
            maxRedemptions: true,
            source: true,
            targetCustomerId: true,
            business: { select: { name: true } },
            targetCustomer: { select: { email: true, phone: true, customerProfile: { select: { displayName: true } } } },
          },
        });
        return {
          data: records.map((record) => ({
            ...record,
            status: record.moderationStatus !== "APPROVED"
              ? record.moderationStatus
              : !record.isActive
              ? "INACTIVE"
              : record.startsAt > now
                ? "SCHEDULED"
                : record.endsAt < now
                  ? "EXPIRED"
                  : "ACTIVE",
            category: record.type,
            recipient: record.targetCustomer
              ? record.targetCustomer.customerProfile?.displayName || record.targetCustomer.email || record.targetCustomer.phone || record.targetCustomerId
              : null,
          })),
        };
      }
      default:
        throw new BadRequestException("Unsupported admin inventory section.");
    }
  }

  async support(page = 1) {
    const safePage = Math.max(page, 1);
    const data = await this.prisma.supportTicket.findMany({
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      skip: (safePage - 1) * 50,
      take: 50,
      include: { user: { select: { id: true, email: true, phone: true } } },
    });
    const total = await this.prisma.supportTicket.count();
    return { data, meta: { page: safePage, pageSize: 50, total } };
  }

  async updateSupportTicket(
    ticketId: string,
    input: UpdateSupportTicketDto,
    actorId: string,
    requestId: string,
  ) {
    if (!input.status && !input.priority && !input.assignToMe) {
      throw new BadRequestException("Change the ticket status, priority, or assignment.");
    }
    const before = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { user: { select: { id: true, email: true, phone: true } } },
    });
    if (!before) throw new BadRequestException("Support ticket not found.");

    const data = await this.prisma.$transaction(async (transaction) => {
      const resolvedAt = input.status
        ? ["RESOLVED", "CLOSED"].includes(input.status)
          ? before.resolvedAt ?? new Date()
          : null
        : undefined;
      const updated = await transaction.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: input.status,
          priority: input.priority,
          assignedToId: input.assignToMe ? actorId : undefined,
          resolvedAt,
        },
        include: { user: { select: { id: true, email: true, phone: true } } },
      });
      const previous = await transaction.auditLog.findFirst({
        orderBy: { createdAt: "desc" },
        select: { entryHash: true },
      });
      const after = {
        status: updated.status,
        priority: updated.priority,
        assignedToId: updated.assignedToId,
        resolvedAt: updated.resolvedAt,
      };
      const auditPayload = JSON.stringify({
        actorId,
        action: "SUPPORT_TICKET_UPDATED",
        entityId: ticketId,
        reason: input.note,
        after,
        requestId,
        previousHash: previous?.entryHash ?? null,
      });
      await transaction.auditLog.create({
        data: {
          actorId,
          action: "SUPPORT_TICKET_UPDATED",
          entityType: "SupportTicket",
          entityId: ticketId,
          reason: input.note,
          before: {
            status: before.status,
            priority: before.priority,
            assignedToId: before.assignedToId,
            resolvedAt: before.resolvedAt,
          },
          after,
          requestId,
          previousHash: previous?.entryHash,
          entryHash: createHash("sha256").update(auditPayload).digest("hex"),
        },
      });
      if (before.userId && input.status && input.status !== before.status) {
        await transaction.notification.create({
          data: {
            userId: before.userId,
            type: "SUPPORT_UPDATE",
            channel: "IN_APP",
            title: `Support ticket ${before.ticketNumber} updated`,
            body: input.note,
            data: { ticketId, ticketNumber: before.ticketNumber, status: updated.status },
            sentAt: new Date(),
          },
        });
      }
      return updated;
    });
    return { data };
  }

  async conversations(page = 1, pageSize = 50) {
    const safePage = Math.max(page, 1);
    const safeSize = Math.min(Math.max(pageSize, 1), 100);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.conversation.findMany({
        orderBy: { updatedAt: "desc" },
        skip: (safePage - 1) * safeSize,
        take: safeSize,
        include: {
          business: { select: { id: true, name: true, slug: true } },
          enquiry: { select: { id: true, requirement: true, status: true } },
          members: {
            select: {
              user: {
                select: {
                  id: true,
                  email: true,
                  phone: true,
                  customerProfile: { select: { displayName: true } },
                },
              },
            },
          },
          messages: {
            where: { deletedAt: null },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true, body: true, type: true, createdAt: true },
          },
          _count: { select: { messages: true } },
        },
      }),
      this.prisma.conversation.count(),
    ]);
    return { data, meta: { page: safePage, pageSize: safeSize, total } };
  }

  async conversationMessages(conversationId: string) {
    const data = await this.prisma.message.findMany({
      where: { conversationId, deletedAt: null },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            phone: true,
            customerProfile: { select: { displayName: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 500,
    });
    return { data };
  }

  async moderateConversation(
    conversationId: string,
    input: ModerateConversationDto,
    actorId: string,
    requestId: string,
  ) {
    const before = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!before) throw new BadRequestException("Conversation not found.");
    const data = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.conversation.update({
        where: { id: conversationId },
        data: { status: input.status },
      });
      const previous = await transaction.auditLog.findFirst({
        orderBy: { createdAt: "desc" },
        select: { entryHash: true },
      });
      const payload = JSON.stringify({
        actorId,
        action: "CONVERSATION_MODERATED",
        entityId: conversationId,
        reason: input.reason,
        before,
        after: updated,
        requestId,
        previousHash: previous?.entryHash ?? null,
      });
      await transaction.auditLog.create({
        data: {
          actorId,
          action: "CONVERSATION_MODERATED",
          entityType: "Conversation",
          entityId: conversationId,
          reason: input.reason,
          before: JSON.parse(JSON.stringify(before)),
          after: JSON.parse(JSON.stringify(updated)),
          requestId,
          previousHash: previous?.entryHash,
          entryHash: createHash("sha256").update(payload).digest("hex"),
        },
      });
      return updated;
    });
    return { data };
  }

  async finance() {
    const [payments, refunds, settlements] = await this.prisma.$transaction([
      this.prisma.payment.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      this.prisma.refund.findMany({ orderBy: { requestedAt: "desc" }, take: 100 }),
      this.prisma.settlement.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    ]);
    return { data: { payments, refunds, settlements } };
  }

  async payments(input: AdminPaymentQueryDto) {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 25;
    const where: Prisma.PaymentWhereInput = {
      ...(input.status ? { status: input.status as PaymentStatus } : {}),
      ...(input.q ? { OR: [
        { id: { contains: input.q, mode: "insensitive" } },
        { providerPaymentId: { contains: input.q, mode: "insensitive" } },
        { idempotencyKey: { contains: input.q, mode: "insensitive" } },
        { order: { orderNumber: { contains: input.q, mode: "insensitive" } } },
        { subscription: { business: { name: { contains: input.q, mode: "insensitive" } } } },
      ] } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize,
        include: { order: { select: { orderNumber: true } }, subscription: { select: { business: { select: { name: true } }, plan: { select: { name: true } } } }, statusHistory: { orderBy: { createdAt: "desc" }, take: 10 } } }),
      this.prisma.payment.count({ where }),
    ]);
    return { data, meta: { page, pageSize, total } };
  }

  async createManualPayment(input: CreateManualPaymentDto, actorId: string, requestId: string) {
    const receivedAt = new Date(input.receivedAt);
    if (Number.isNaN(receivedAt.getTime())) throw new BadRequestException("Received date is invalid.");
    if (receivedAt.getTime() > Date.now() + 300_000) throw new BadRequestException("Received date cannot be in the future.");
    const reference = input.reference.trim().toUpperCase();
    const providerPaymentId = `MANUAL-${input.method}-${reference}`;
    const [subscription, duplicate] = await Promise.all([
      this.prisma.businessSubscription.findUnique({
        where: { id: input.subscriptionId },
        include: { business: { select: { id: true, name: true } }, plan: { select: { id: true, name: true } } },
      }),
      this.prisma.payment.findUnique({ where: { providerPaymentId }, select: { id: true } }),
    ]);
    if (!subscription) throw new NotFoundException("Subscription not found.");
    if (duplicate) throw new ConflictException("That manual payment reference has already been recorded for this method.");
    const evidence = input.evidence.trim();
    const idempotencyKey = `manual:${createHash("sha256").update(`${input.method}:${reference}`).digest("hex")}`;
    return this.auditedMutation({
      actorId,
      requestId,
      action: "PAYMENT_MANUAL_CAPTURED",
      entityType: "Payment",
      entityId: (after: { id: string }) => after.id,
      reason: input.reason,
      before: null,
      mutate: (transaction) => transaction.payment.create({
        data: {
          subscriptionId: subscription.id,
          provider: "MANUAL",
          providerPaymentId,
          idempotencyKey,
          amount: input.amount,
          currency: "INR",
          status: "CAPTURED",
          capturedAt: receivedAt,
          metadata: {
            method: input.method,
            reference,
            evidence,
            recordedById: actorId,
            businessId: subscription.business.id,
            businessName: subscription.business.name,
            planId: subscription.plan.id,
            planName: subscription.plan.name,
          },
          statusHistory: {
            create: {
              previousStatus: null,
              newStatus: "CAPTURED",
              source: "ADMIN_MANUAL",
              sourceReference: reference,
              actorId,
              reason: input.reason,
              metadata: { method: input.method, evidence },
            },
          },
        },
        include: {
          subscription: { select: { business: { select: { name: true } }, plan: { select: { name: true } } } },
          statusHistory: { orderBy: { createdAt: "desc" }, take: 10 },
        },
      }),
    });
  }

  async refunds(input: AdminRefundQueryDto) {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 25;
    const where: Prisma.RefundWhereInput = {
      ...(input.status ? { status: input.status as RefundStatus } : {}),
      ...(input.q ? { OR: [
        { id: { contains: input.q, mode: "insensitive" } },
        { providerRefundId: { contains: input.q, mode: "insensitive" } },
        { externalReference: { contains: input.q, mode: "insensitive" } },
        { reason: { contains: input.q, mode: "insensitive" } },
        { payment: { providerPaymentId: { contains: input.q, mode: "insensitive" } } },
        { order: { orderNumber: { contains: input.q, mode: "insensitive" } } },
        { payment: { subscription: { business: { name: { contains: input.q, mode: "insensitive" } } } } },
      ] } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.refund.findMany({
        where, orderBy: { requestedAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize,
        include: {
          order: { select: { orderNumber: true } },
          payment: { select: { provider: true, providerPaymentId: true, currency: true, subscription: { select: { business: { select: { name: true } }, plan: { select: { name: true } } } } } },
        },
      }),
      this.prisma.refund.count({ where }),
    ]);
    return { data, meta: { page, pageSize, total } };
  }

  async refundablePayments() {
    const payments = await this.prisma.payment.findMany({
      where: { status: { in: ["CAPTURED", "PARTIALLY_REFUNDED"] } },
      orderBy: { capturedAt: "desc" },
      take: 250,
      include: {
        order: { select: { orderNumber: true } },
        subscription: { select: { business: { select: { name: true } }, plan: { select: { name: true } } } },
        refunds: { where: { status: { not: "REJECTED" } }, select: { amount: true } },
      },
    });
    return { data: payments.map((payment) => {
      const reserved = payment.refunds.reduce((sum, refund) => sum + Number(refund.amount), 0);
      return {
        id: payment.id,
        provider: payment.provider,
        providerPaymentId: payment.providerPaymentId,
        currency: payment.currency,
        amount: Number(payment.amount),
        refundableAmount: Math.max(0, Number(payment.amount) - reserved),
        capturedAt: payment.capturedAt,
        order: payment.order,
        subscription: payment.subscription,
        automaticAvailable: payment.provider.toLowerCase() === "razorpay" && Boolean(payment.providerPaymentId),
      };
    }).filter((payment) => payment.refundableAmount > 0) };
  }

  private async refundablePayment(paymentId: string, amount: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { refunds: { where: { status: { not: "REJECTED" } }, select: { amount: true } } },
    });
    if (!payment) throw new NotFoundException("Payment not found.");
    if (!["CAPTURED", "PARTIALLY_REFUNDED"].includes(payment.status)) throw new ConflictException("Only captured payments can be refunded.");
    const reserved = payment.refunds.reduce((sum, refund) => sum + Number(refund.amount), 0);
    const remaining = Number(payment.amount) - reserved;
    if (amount > remaining + 0.0001) throw new BadRequestException(`Refund amount exceeds the available balance of ${remaining.toFixed(2)} ${payment.currency}.`);
    return { payment, remaining };
  }

  async createManualRefund(input: CreateManualRefundDto, actorId: string, requestId: string) {
    const completedAt = new Date(input.completedAt);
    if (Number.isNaN(completedAt.getTime())) throw new BadRequestException("Refund completion date is invalid.");
    if (completedAt.getTime() > Date.now() + 300_000) throw new BadRequestException("Refund completion date cannot be in the future.");
    const { payment } = await this.refundablePayment(input.paymentId, input.amount);
    const reference = input.reference.trim().toUpperCase();
    const providerRefundId = `MANUAL-${input.method}-${reference}`;
    const duplicate = await this.prisma.refund.findUnique({ where: { providerRefundId }, select: { id: true } });
    if (duplicate) throw new ConflictException("That manual refund reference has already been recorded for this method.");
    return this.auditedMutation({
      actorId, requestId, action: "REFUND_MANUAL_COMPLETED", entityType: "Refund", entityId: (after: { id: string }) => after.id,
      reason: input.auditReason, before: null,
      serializable: true,
      mutate: async (transaction) => {
        const current = await transaction.payment.findUnique({ where: { id: payment.id }, include: { refunds: { where: { status: { not: "REJECTED" } }, select: { amount: true } } } });
        if (!current || !["CAPTURED", "PARTIALLY_REFUNDED"].includes(current.status)) throw new ConflictException("Payment is no longer eligible for a refund.");
        const currentRemaining = Number(current.amount) - current.refunds.reduce((sum, item) => sum + Number(item.amount), 0);
        if (input.amount > currentRemaining + 0.0001) throw new ConflictException("The refundable balance changed. Reload and try again.");
        const refund = await transaction.refund.create({ data: {
          orderId: payment.orderId, paymentId: payment.id, amount: input.amount, reason: input.reason,
          status: "COMPLETED", source: "MANUAL", method: input.method, externalReference: reference,
          requestedById: actorId, notes: input.evidence.trim(), providerRefundId, completedAt,
          metadata: { confirmedReturned: true, evidence: input.evidence.trim(), auditReason: input.auditReason.trim() },
        } });
        const currentPaymentStatus = Math.abs(currentRemaining - input.amount) < 0.005 ? "REFUNDED" as const : "PARTIALLY_REFUNDED" as const;
        await transaction.payment.update({ where: { id: payment.id }, data: {
          status: currentPaymentStatus,
          statusHistory: { create: { previousStatus: current.status, newStatus: currentPaymentStatus, source: "ADMIN_MANUAL_REFUND", sourceReference: reference, actorId, reason: input.auditReason, metadata: { refundId: refund.id, amount: input.amount, method: input.method, refundReason: input.reason, evidence: input.evidence.trim() } } },
        } });
        return refund;
      },
    });
  }

  async createAutomaticRefund(input: CreateAutomaticRefundDto, actorId: string, requestId: string) {
    const keyId = this.config?.get<string>("RAZORPAY_KEY_ID");
    const keySecret = this.config?.get<string>("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) throw new ServiceUnavailableException("Automatic refunds are unavailable because Razorpay is not configured.");
    const { payment } = await this.refundablePayment(input.paymentId, input.amount);
    if (payment.provider.toLowerCase() !== "razorpay" || !payment.providerPaymentId) {
      throw new BadRequestException("This payment was not captured by Razorpay. Record a manual refund instead.");
    }
    const requested = await this.auditedMutation({
      actorId, requestId, action: "REFUND_PROVIDER_REQUESTED", entityType: "Refund", entityId: (after: { id: string }) => after.id,
      reason: input.auditReason, before: null,
      serializable: true,
      mutate: async (transaction) => {
        const current = await transaction.payment.findUnique({ where: { id: payment.id }, include: { refunds: { where: { status: { not: "REJECTED" } }, select: { amount: true } } } });
        if (!current || !["CAPTURED", "PARTIALLY_REFUNDED"].includes(current.status)) throw new ConflictException("Payment is no longer eligible for a refund.");
        const currentRemaining = Number(current.amount) - current.refunds.reduce((sum, item) => sum + Number(item.amount), 0);
        if (input.amount > currentRemaining + 0.0001) throw new ConflictException("The refundable balance changed. Reload and try again.");
        return transaction.refund.create({ data: {
          orderId: current.orderId, paymentId: current.id, amount: input.amount, reason: input.reason,
          status: "REQUESTED", source: "RAZORPAY", requestedById: actorId,
        } });
      },
    });
    const refund = requested.data;
    const authorization = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    try {
      const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(payment.providerPaymentId)}/refund`, {
        method: "POST",
        headers: { authorization: `Basic ${authorization}`, "content-type": "application/json" },
        body: JSON.stringify({ amount: Math.round(input.amount * 100), speed: "normal", receipt: refund.id.slice(0, 40), notes: { bnc_refund_id: refund.id, bnc_payment_id: payment.id } }),
        signal: AbortSignal.timeout(10_000),
      });
      const provider = await response.json() as { id?: string; payment_id?: string; amount?: number; status?: string; error?: { description?: string } };
      if (!response.ok || !provider.id) throw new Error(`PROVIDER_REJECTED:${provider.error?.description ?? "Razorpay refund request failed."}`);
      if (provider.payment_id !== payment.providerPaymentId || provider.amount !== Math.round(input.amount * 100)) throw new Error("Refund provider returned mismatched payment or amount details.");
      const updated = await this.prisma.refund.update({ where: { id: refund.id }, data: {
        status: "PROCESSING", providerRefundId: provider.id,
        metadata: { providerStatus: provider.status ?? null, receipt: refund.id.slice(0, 40) },
      } });
      return { data: updated, confirmationPending: true };
    } catch (error) {
      const failure = error instanceof Error ? error.message : "Provider request failed";
      const providerRejected = failure.startsWith("PROVIDER_REJECTED:");
      await this.auditedMutation({
        actorId, requestId: `${requestId}:provider-failure`, action: providerRejected ? "REFUND_PROVIDER_REJECTED" : "REFUND_PROVIDER_CONFIRMATION_PENDING", entityType: "Refund", entityId: refund.id,
        reason: input.auditReason, before: refund,
        mutate: (transaction) => transaction.refund.update({ where: { id: refund.id }, data: {
          status: providerRejected ? "REJECTED" : "PROCESSING",
          failureReason: (providerRejected ? failure.replace("PROVIDER_REJECTED:", "") : "Provider response is uncertain; awaiting webhook reconciliation.").slice(0, 500),
        } }),
      });
      throw new ServiceUnavailableException(providerRejected
        ? "The provider rejected the refund request. No completed refund was recorded."
        : "Provider confirmation is pending. The refund is reserved for webhook reconciliation and cannot be requested again.");
    }
  }

  async manualOrderOptions() {
    const [customers, businesses] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: { status: "ACTIVE", deletedAt: null, role: { in: ["CUSTOMER", "BUSINESS_OWNER"] } },
        orderBy: { createdAt: "desc" }, take: 250,
        select: { id: true, email: true, phone: true, role: true, customerProfile: { select: { displayName: true } } },
      }),
      this.prisma.business.findMany({
        where: { status: "ACTIVE", deletedAt: null, products: { some: { status: "PUBLISHED", isActive: true, deletedAt: null, stockStatus: { not: "OUT_OF_STOCK" } } } },
        orderBy: { name: "asc" }, take: 250,
        select: {
          id: true, name: true,
          products: {
            where: { status: "PUBLISHED", isActive: true, deletedAt: null, stockStatus: { not: "OUT_OF_STOCK" } },
            orderBy: { name: "asc" }, take: 500,
            select: { id: true, name: true, price: true, discountPrice: true, minimumOrderQty: true, variants: { where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, sku: true, price: true, stock: true } } },
          },
        },
      }),
    ]);
    return { data: { customers, businesses } };
  }

  async createManualOrder(input: CreateManualOrderDto, actorId: string, requestId: string) {
    const reference = input.externalReference.trim().toUpperCase();
    const address = input.deliveryAddress ?? {};
    if (input.fulfilmentType === "delivery") {
      for (const field of ["addressLine1", "city", "state", "postalCode"] as const) {
        if (typeof address[field] !== "string" || address[field].trim().length < 2) throw new BadRequestException(`Delivery address ${field} is required.`);
      }
    }
    if (input.fulfilmentType === "pickup" && Number(input.deliveryFee ?? 0) > 0) throw new BadRequestException("Pickup orders cannot include a delivery fee.");
    const productIds = [...new Set(input.items.map((item) => item.productId))];
    const [customer, business, duplicate, products] = await Promise.all([
      this.prisma.user.findFirst({ where: { id: input.customerId, status: "ACTIVE", deletedAt: null, role: { in: ["CUSTOMER", "BUSINESS_OWNER"] } }, select: { id: true, email: true, phone: true } }),
      this.prisma.business.findFirst({ where: { id: input.businessId, status: "ACTIVE", deletedAt: null }, select: { id: true, name: true } }),
      this.prisma.order.findUnique({ where: { businessId_externalReference: { businessId: input.businessId, externalReference: reference } }, select: { id: true } }),
      this.prisma.product.findMany({
        where: { id: { in: productIds }, businessId: input.businessId, status: "PUBLISHED", isActive: true, deletedAt: null, stockStatus: { not: "OUT_OF_STOCK" } },
        include: { variants: { where: { isActive: true } } },
      }),
    ]);
    if (!customer) throw new NotFoundException("Active customer not found.");
    if (!business) throw new NotFoundException("Active business not found.");
    if (duplicate) throw new ConflictException("That external order reference has already been recorded.");
    if (products.length !== productIds.length) throw new BadRequestException("One or more products are unavailable from this business.");
    const items = input.items.map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId)!;
      if (item.quantity < product.minimumOrderQty) throw new BadRequestException(`${product.name} requires a minimum quantity of ${product.minimumOrderQty}.`);
      const variant = item.variantId ? product.variants.find((candidate) => candidate.id === item.variantId) : undefined;
      if (item.variantId && !variant) throw new BadRequestException(`Selected variant for ${product.name} is unavailable.`);
      if (variant && variant.stock < item.quantity) throw new BadRequestException(`Insufficient stock for ${product.name}.`);
      const unitPaise = Math.round(Number(variant?.price ?? product.discountPrice ?? product.price) * 100);
      return { productId: product.id, variantId: variant?.id, nameSnapshot: variant ? `${product.name} · ${variant.name}` : product.name, skuSnapshot: variant?.sku, quantity: item.quantity, unitPrice: unitPaise / 100, total: unitPaise * item.quantity / 100 };
    });
    const subtotalPaise = items.reduce((sum, item) => sum + Math.round(item.total * 100), 0);
    const discountPaise = Math.round(Number(input.discount ?? 0) * 100);
    const taxPaise = Math.round(Number(input.tax ?? 0) * 100);
    const deliveryFeePaise = Math.round(Number(input.deliveryFee ?? 0) * 100);
    if (discountPaise > subtotalPaise) throw new BadRequestException("Discount cannot exceed the catalogue subtotal.");
    const totalPaise = subtotalPaise - discountPaise + taxPaise + deliveryFeePaise;
    const orderNumber = `BNC-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${randomBytes(3).toString("hex").toUpperCase()}`;
    return this.auditedMutation({
      actorId, requestId, action: "ORDER_MANUAL_CREATED", entityType: "Order", entityId: (after: { id: string }) => after.id,
      reason: input.reason, before: null, serializable: true,
      mutate: async (transaction) => {
        const existing = await transaction.order.findUnique({ where: { businessId_externalReference: { businessId: business.id, externalReference: reference } }, select: { id: true } });
        if (existing) throw new ConflictException("That external order reference has already been recorded.");
        for (const item of items) {
          if (item.variantId) {
            const reserved = await transaction.productVariant.updateMany({ where: { id: item.variantId, isActive: true, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } });
            if (reserved.count !== 1) throw new ConflictException(`Stock changed for ${item.nameSnapshot}. Reload and try again.`);
          }
        }
        const order = await transaction.order.create({
          data: {
            orderNumber, customerId: customer.id, businessId: business.id, status: "PENDING", source: "ADMIN_MANUAL",
            externalReference: reference, createdById: actorId, fulfilmentType: input.fulfilmentType,
            deliveryAddress: input.fulfilmentType === "delivery" ? this.jsonSnapshot(address) : undefined,
            subtotal: subtotalPaise / 100, discount: discountPaise / 100, tax: taxPaise / 100,
            deliveryFee: deliveryFeePaise / 100, total: totalPaise / 100, notes: input.notes?.trim() || null,
            items: { create: items },
          },
          include: { business: { select: { name: true } }, customer: { select: { email: true, phone: true, customerProfile: { select: { displayName: true } } } }, items: true },
        });
        await transaction.notification.create({ data: {
          userId: customer.id, type: "ORDER_UPDATE", channel: "IN_APP", title: `Order ${orderNumber} created`,
          body: `${business.name} order was entered by BNC operations and is awaiting confirmation.`, data: { orderId: order.id, source: "ADMIN_MANUAL" }, sentAt: new Date(),
        } });
        return order;
      },
    });
  }

  async targetedOfferOptions() {
    const [customers, businesses] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: { status: "ACTIVE", deletedAt: null, role: { in: ["CUSTOMER", "BUSINESS_OWNER"] } },
        orderBy: { createdAt: "desc" }, take: 250,
        select: { id: true, email: true, phone: true, role: true, customerProfile: { select: { displayName: true } } },
      }),
      this.prisma.business.findMany({
        where: { status: "ACTIVE", deletedAt: null }, orderBy: { name: "asc" }, take: 250,
        select: {
          id: true, name: true,
          products: { where: { status: "PUBLISHED", isActive: true, deletedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true } },
          services: { where: { isActive: true, deletedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true } },
        },
      }),
    ]);
    return { data: { customers, businesses } };
  }

  async createTargetedOffer(input: CreateTargetedOfferDto, actorId: string, requestId: string) {
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    if (endsAt <= startsAt) throw new BadRequestException("Offer end time must be after the start time.");
    if (endsAt <= new Date()) throw new BadRequestException("Offer end time must be in the future.");
    if (input.type === "PERCENTAGE" && (input.discountValue == null || input.discountValue > 100)) throw new BadRequestException("Percentage offers require a discount value from 0 to 100.");
    const couponCode = input.couponCode.trim().toUpperCase();
    const productIds = [...new Set(input.productIds ?? [])];
    const serviceIds = [...new Set(input.serviceIds ?? [])];
    const [customer, business, productCount, serviceCount, duplicateCoupon] = await Promise.all([
      this.prisma.user.findFirst({ where: { id: input.customerId, status: "ACTIVE", deletedAt: null, role: { in: ["CUSTOMER", "BUSINESS_OWNER"] } }, select: { id: true, email: true, phone: true, customerProfile: { select: { displayName: true } } } }),
      this.prisma.business.findFirst({ where: { id: input.businessId, status: "ACTIVE", deletedAt: null }, select: { id: true, name: true } }),
      productIds.length ? this.prisma.product.count({ where: { id: { in: productIds }, businessId: input.businessId, status: "PUBLISHED", isActive: true, deletedAt: null } }) : Promise.resolve(0),
      serviceIds.length ? this.prisma.service.count({ where: { id: { in: serviceIds }, businessId: input.businessId, isActive: true, deletedAt: null } }) : Promise.resolve(0),
      this.prisma.offer.findFirst({ where: { businessId: input.businessId, couponCode, endsAt: { gte: new Date() }, isActive: true }, select: { id: true } }),
    ]);
    if (!customer) throw new NotFoundException("Active customer not found.");
    if (!business) throw new NotFoundException("Active business not found.");
    if (productCount !== productIds.length || serviceCount !== serviceIds.length) throw new BadRequestException("Offer items must be active catalogue entries owned by the selected business.");
    if (duplicateCoupon) throw new ConflictException("That coupon code is already active for this business.");
    const now = new Date();
    return this.auditedMutation({
      actorId, requestId, action: "OFFER_TARGETED_CREATED", entityType: "Offer", entityId: (after: { id: string }) => after.id,
      reason: input.reason, before: null, serializable: true,
      mutate: async (transaction) => {
        const racedCoupon = await transaction.offer.findFirst({ where: { businessId: business.id, couponCode, endsAt: { gte: now }, isActive: true }, select: { id: true } });
        if (racedCoupon) throw new ConflictException("That coupon code is already active for this business.");
        const offer = await transaction.offer.create({ data: {
          businessId: business.id, targetCustomerId: customer.id, source: "ADMIN_TARGETED", createdById: actorId,
          title: input.title.trim(), description: input.description.trim(), type: input.type,
          discountValue: input.discountValue, couponCode, minimumSpend: input.minimumSpend,
          startsAt, endsAt, maxRedemptions: input.maxRedemptions ?? 1, isFeatured: false, featuredRequested: false,
          isActive: true, moderationStatus: "APPROVED", moderationReason: input.reason,
          moderatedAt: now, moderatedById: actorId, notifiedAt: now, targetedCount: 1,
          products: productIds.length ? { create: productIds.map((productId) => ({ productId })) } : undefined,
          services: serviceIds.length ? { create: serviceIds.map((serviceId) => ({ serviceId })) } : undefined,
        }, include: { business: { select: { name: true } }, targetCustomer: { select: { id: true, email: true, phone: true, customerProfile: { select: { displayName: true } } } }, products: true, services: true } });
        await transaction.notification.create({ data: {
          id: `targeted-offer-${offer.id}-${customer.id}`, userId: customer.id, type: "NEARBY_OFFER", channel: "IN_APP",
          title: startsAt > now ? "A private offer is coming" : "A private offer for you",
          body: `${business.name}: ${offer.title}`, data: { offerId: offer.id, couponCode, private: true }, sentAt: now,
        } });
        return offer;
      },
    });
  }

  async advertisementOptions() {
    const businesses = await this.prisma.business.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      take: 500,
      select: { id: true, name: true, status: true, listingStatus: true },
    });
    return { data: { businesses } };
  }

  async createAdvertisement(input: CreateAdminAdvertisementDto, actorId: string, requestId: string) {
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    if (endsAt <= startsAt) throw new BadRequestException("Advertisement end time must be after its start time.");
    if (endsAt <= new Date()) throw new BadRequestException("Advertisement end time must be in the future.");
    const location = input.location?.trim() || null;
    if (input.audience !== "ALL" && !location) throw new BadRequestException(`A ${input.audience.toLowerCase()} name is required for this audience.`);
    if (input.audience === "ALL" && location) throw new BadRequestException("Location must be empty for an all-users audience.");
    const business = input.businessId
      ? await this.prisma.business.findFirst({ where: { id: input.businessId, deletedAt: null }, select: { id: true, name: true, status: true } })
      : null;
    if (input.businessId && !business) throw new NotFoundException("Business not found.");
    if (input.status === "SCHEDULED" && business && business.status !== "ACTIVE") {
      throw new BadRequestException("Only an active business can sponsor a scheduled advertisement. Save it as draft until the business is active.");
    }
    const creative = input.creativeKey
      ? await this.mediaStorage?.promoteAdvertisementObject(actorId, input.creativeKey)
      : null;
    if (input.creativeKey && !creative) throw new BadRequestException("Advertisement media storage is unavailable.");
    const target = { audience: input.audience, ...(location ? { location } : {}) };
    return this.auditedMutation({
      actorId, requestId, action: "ADVERTISEMENT_ADMIN_CREATED", entityType: "Advertisement",
      entityId: (after: { id: string }) => after.id, reason: input.reason, before: null,
      mutate: (transaction) => transaction.advertisement.create({
        data: {
          businessId: business?.id ?? null,
          title: input.title.trim(),
          placement: input.placement,
          target,
          creativeKey: creative?.objectKey ?? null,
          destination: input.destination.trim(),
          budget: input.budget,
          spent: 0,
          status: input.status,
          startsAt,
          endsAt,
          impressions: 0,
          clicks: 0,
        },
        include: { business: { select: { id: true, name: true } } },
      }),
    });
  }

  async updatePaymentStatus(id: string, input: AdminPaymentActionDto, actorId: string, requestId: string) {
    const before = await this.prisma.payment.findUnique({ where: { id } });
    if (!before) throw new NotFoundException("Payment not found.");
    if (!["CREATED", "AUTHORIZED"].includes(before.status)) {
      throw new ConflictException("Only an unsettled created or authorised payment can be failed or cancelled manually.");
    }
    const status = input.action === "CANCEL" ? "CANCELLED" as const : "FAILED" as const;
    return this.auditedMutation({ actorId, requestId, action: `PAYMENT_${status}`, entityType: "Payment", entityId: id, reason: input.reason, before,
      mutate: (transaction) => transaction.payment.update({ where: { id }, data: {
        status,
        failedAt: status === "FAILED" ? new Date() : before.failedAt,
        statusHistory: { create: { previousStatus: before.status, newStatus: status, source: "ADMIN", actorId, reason: input.reason } },
      } }),
    });
  }

  async auditLog(page = 1) {
    const safePage = Math.max(page, 1);
    const data = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * 100,
      take: 100,
      select: {
        id: true, actorId: true, action: true, entityType: true, entityId: true, reason: true,
        before: true, after: true, requestId: true, previousHash: true, entryHash: true, createdAt: true,
        actor: { select: { id: true, email: true, role: true } },
      },
    });
    const total = await this.prisma.auditLog.count();
    return {
      data: data.map((entry) => ({
        ...entry,
        before: this.auditSnapshot(entry.before),
        after: this.auditSnapshot(entry.after),
      })),
      meta: { page: safePage, pageSize: 100, total, totalPages: Math.max(1, Math.ceil(total / 100)) },
    };
  }
}
