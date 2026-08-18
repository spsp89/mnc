import { ConflictException, ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import type { Prisma } from "../../generated/prisma/client";

const entitlementSelect = {
  id: true,
  slug: true,
  name: true,
  priority: true,
  starLevel: true,
  listingReach: true,
  offerReach: true,
  offerLimit: true,
  productLimit: true,
  mediaLimit: true,
  categoryLimit: true,
  descriptionEnabled: true,
  socialLinksEnabled: true,
  bookingEnabled: true,
  deliveryEnabled: true,
  automaticLeadAlerts: true,
} as const satisfies Prisma.SubscriptionPlanSelect;

export type EntitledPlan = Prisma.SubscriptionPlanGetPayload<{
  select: typeof entitlementSelect;
}>;

export type BooleanPlanFeature =
  | "descriptionEnabled"
  | "socialLinksEnabled"
  | "bookingEnabled"
  | "deliveryEnabled"
  | "automaticLeadAlerts";

const featureLabels: Record<BooleanPlanFeature, string> = {
  descriptionEnabled: "Business descriptions",
  socialLinksEnabled: "Social media links",
  bookingEnabled: "Booking",
  deliveryEnabled: "Delivery integration",
  automaticLeadAlerts: "Automatic lead alerts",
};

type EntitlementClient = Pick<
  Prisma.TransactionClient,
  "businessSubscription" | "product" | "businessMedia" | "businessCategory" | "offer"
>;

@Injectable()
export class PlanEntitlementsService {
  constructor(private readonly prisma: PrismaService) {}

  private async activePlanWith(
    client: EntitlementClient,
    businessId: string,
  ): Promise<EntitledPlan | null> {
    const subscription = await client.businessSubscription.findFirst({
      where: {
        businessId,
        status: { in: ["TRIAL", "ACTIVE", "GRACE_PERIOD"] },
        currentPeriodEnd: { gte: new Date() },
      },
      orderBy: [{ plan: { priority: "desc" } }, { startsAt: "asc" }],
      select: { plan: { select: entitlementSelect } },
    });
    return subscription?.plan ?? null;
  }

  private async requirePlanWith(
    client: EntitlementClient,
    businessId: string,
  ): Promise<EntitledPlan> {
    const plan = await this.activePlanWith(client, businessId);
    if (!plan) {
      throw new ForbiddenException(
        "Activate a Bronze, Silver, Gold, Platinum, Diamond or Ruby plan to use business catalogue features.",
      );
    }
    return plan;
  }

  private async lockBusinessCapacity(
    transaction: Prisma.TransactionClient,
    businessId: string,
  ) {
    // A transaction-scoped PostgreSQL advisory lock serializes every limit-bound
    // create for one business. The text key avoids assumptions about UUID shape,
    // and PostgreSQL releases the lock automatically on commit or rollback.
    await transaction.$queryRaw<Array<{ pg_advisory_xact_lock: null }>>`
      SELECT pg_advisory_xact_lock(
        hashtextextended(${`bnc:plan-capacity:${businessId}`}, 0)
      )
    `;
  }

  private async withCapacityTransaction<T>(
    businessId: string,
    verify: (transaction: Prisma.TransactionClient) => Promise<unknown>,
    operation: (transaction: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (transaction) => {
      await this.lockBusinessCapacity(transaction, businessId);
      await verify(transaction);
      return operation(transaction);
    }, { maxWait: 5_000, timeout: 15_000 });
  }

  async activePlan(businessId: string): Promise<EntitledPlan | null> {
    return this.activePlanWith(this.prisma, businessId);
  }

  async requirePlan(businessId: string): Promise<EntitledPlan> {
    return this.requirePlanWith(this.prisma, businessId);
  }

  async requireFeature(
    businessId: string,
    feature: BooleanPlanFeature,
  ): Promise<EntitledPlan> {
    const plan = await this.requirePlan(businessId);
    if (!plan[feature]) {
      throw new ForbiddenException(
        `${featureLabels[feature]} is not included in the ${plan.name} plan.`,
      );
    }
    return plan;
  }

  async assertProductCapacity(businessId: string) {
    return this.assertProductCapacityWith(this.prisma, businessId);
  }

  private async assertProductCapacityWith(client: EntitlementClient, businessId: string) {
    const plan = await this.requirePlanWith(client, businessId);
    const used = await client.product.count({
      where: { businessId, deletedAt: null },
    });
    if (plan.productLimit !== null && used >= plan.productLimit) {
      throw new ConflictException(
        `${plan.name} allows ${plan.productLimit} products. Archive a product or upgrade the plan before adding another.`,
      );
    }
    return { plan, used, limit: plan.productLimit };
  }

  async withProductCapacity<T>(
    businessId: string,
    operation: (transaction: Prisma.TransactionClient) => Promise<T>,
  ) {
    return this.withCapacityTransaction(
      businessId,
      (transaction) => this.assertProductCapacityWith(transaction, businessId),
      operation,
    );
  }

  async assertGalleryCapacity(businessId: string) {
    return this.assertGalleryCapacityWith(this.prisma, businessId);
  }

  private async assertGalleryCapacityWith(client: EntitlementClient, businessId: string) {
    const plan = await this.requirePlanWith(client, businessId);
    const used = await client.businessMedia.count({ where: { businessId } });
    if (plan.mediaLimit !== null && used >= plan.mediaLimit) {
      throw new ConflictException(
        plan.mediaLimit === 0
          ? `${plan.name} does not include gallery photos.`
          : `${plan.name} allows ${plan.mediaLimit} gallery photos. Remove a photo or upgrade the plan before adding another.`,
      );
    }
    return { plan, used, limit: plan.mediaLimit };
  }

  async withGalleryCapacity<T>(
    businessId: string,
    operation: (transaction: Prisma.TransactionClient) => Promise<T>,
  ) {
    return this.withCapacityTransaction(
      businessId,
      (transaction) => this.assertGalleryCapacityWith(transaction, businessId),
      operation,
    );
  }

  async assertOfferCapacity(businessId: string) {
    return this.assertOfferCapacityWith(this.prisma, businessId);
  }

  private async assertOfferCapacityWith(client: EntitlementClient, businessId: string) {
    const plan = await this.requirePlanWith(client, businessId);
    const used = await client.offer.count({ where: { businessId, targetCustomerId: null } });
    if (plan.offerLimit !== null && used >= plan.offerLimit) {
      throw new ConflictException(
        plan.offerLimit === 0
          ? `${plan.name} does not include offers.`
          : `${plan.name} allows ${plan.offerLimit} offers. Remove an offer or upgrade the plan before adding another.`,
      );
    }
    return { plan, used, limit: plan.offerLimit };
  }

  async withOfferCapacity<T>(
    businessId: string,
    operation: (transaction: Prisma.TransactionClient) => Promise<T>,
  ) {
    return this.withCapacityTransaction(
      businessId,
      (transaction) => this.assertOfferCapacityWith(transaction, businessId),
      operation,
    );
  }

  async assertCategoryCapacity(businessId: string, requestedCount: number) {
    const plan = await this.requirePlan(businessId);
    if (requestedCount > plan.categoryLimit) {
      throw new ConflictException(
        `${plan.name} allows ${plan.categoryLimit} ${plan.categoryLimit === 1 ? "category" : "categories"}.`,
      );
    }
    return plan;
  }

  async usage(businessId: string) {
    const plan = await this.requirePlan(businessId);
    const [products, galleryPhotos, categories, offers] = await Promise.all([
      this.prisma.product.count({ where: { businessId, deletedAt: null } }),
      this.prisma.businessMedia.count({ where: { businessId } }),
      this.prisma.businessCategory.count({ where: { businessId } }),
      this.prisma.offer.count({ where: { businessId, targetCustomerId: null } }),
    ]);
    return {
      plan,
      products: { used: products, limit: plan.productLimit },
      galleryPhotos: { used: galleryPhotos, limit: plan.mediaLimit },
      categories: { used: categories, limit: plan.categoryLimit },
      offers: { used: offers, limit: plan.offerLimit },
    };
  }
}
