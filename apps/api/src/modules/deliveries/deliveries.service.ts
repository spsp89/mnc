import { ConflictException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { BusinessAccessService } from "../../common/auth/business-access.service";
import { PlanEntitlementsService } from "../../common/subscriptions/plan-entitlements.service";
import { PrismaService } from "../../database/prisma.service";
import type { Prisma } from "../../generated/prisma/client";
import { MediaService } from "../media/media.service";
import type {
  CaptureDeliveryProofDto,
  SettleDeliveryDto,
  UpdateDeliveryDispatchDto,
} from "./dto/delivery-lifecycle.dto";
import { HttpDeliveryProvider, ManualDeliveryProvider, type DeliveryProvider, type DeliveryRequest } from "./delivery-provider";

const shipmentStatuses = new Set(["QUOTED", "REQUESTED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "CANCELLED", "FAILED"]);
type ShipmentStatus = "QUOTED" | "REQUESTED" | "ASSIGNED" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED" | "FAILED";
const terminalShipmentStatuses = new Set(["DELIVERED", "CANCELLED", "FAILED"]);
const shipmentProgression: Record<string, Set<string>> = {
  QUOTED: new Set(["REQUESTED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "CANCELLED", "FAILED"]),
  REQUESTED: new Set(["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "CANCELLED", "FAILED"]),
  ASSIGNED: new Set(["PICKED_UP", "IN_TRANSIT", "DELIVERED", "CANCELLED", "FAILED"]),
  PICKED_UP: new Set(["IN_TRANSIT", "DELIVERED", "CANCELLED", "FAILED"]),
  IN_TRANSIT: new Set(["DELIVERED", "CANCELLED", "FAILED"]),
};

@Injectable()
export class DeliveriesService {
  private readonly provider: DeliveryProvider;

  constructor(
    private readonly prisma: PrismaService,
    private readonly businessAccess: BusinessAccessService,
    private readonly config: ConfigService,
    private readonly media: MediaService,
    private readonly planEntitlements: PlanEntitlementsService,
  ) {
    this.provider = config.get<string>("DELIVERY_PROVIDER") === "MANUAL"
      ? new ManualDeliveryProvider()
      : new HttpDeliveryProvider(config);
  }

  readiness() {
    return {
      data: {
        provider: this.provider.name,
        configured: this.provider.configured,
        mode: this.provider.name === "MANUAL" ? "manual dispatch fallback" : "external API",
      },
    };
  }

  async manage(userId: string, businessId: string) {
    await this.businessAccess.require(userId, businessId, "business:catalog:manage");
    await this.planEntitlements.requireFeature(businessId, "deliveryEnabled");
    const data = await this.prisma.deliveryShipment.findMany({
      where: { businessId },
      include: {
        order: { select: { orderNumber: true, status: true, deliveryAddress: true, total: true } },
        proof: true,
        settlement: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return { data, provider: this.readiness().data };
  }

  async quote(userId: string, orderId: string) {
    const { order, request } = await this.authorizedOrder(userId, orderId);
    const result = await this.provider.quote(request);
    const data = await this.prisma.deliveryShipment.upsert({
      where: { orderId },
      create: {
        orderId,
        businessId: order.businessId,
        customerId: order.customerId,
        provider: this.provider.name,
        status: "QUOTED",
        quotedAmount: result.amount,
        currency: result.currency,
        trackingUrl: result.trackingUrl,
        driverName: result.driver?.name,
        driverPhone: result.driver?.phone,
        vehicleNumber: result.driver?.vehicleNumber,
        providerData: result.raw as Prisma.InputJsonValue,
        lastSyncedAt: new Date(),
      },
      update: {
        provider: this.provider.name,
        status: "QUOTED",
        quotedAmount: result.amount,
        currency: result.currency,
        providerData: result.raw as Prisma.InputJsonValue,
        lastSyncedAt: new Date(),
      },
    });
    return { data, provider: this.readiness().data };
  }

  async create(userId: string, orderId: string) {
    const { order, request } = await this.authorizedOrder(userId, orderId);
    if (order.fulfilmentType.toLowerCase() !== "delivery" || !order.deliveryAddress) {
      throw new ConflictException("This order is not configured for delivery.");
    }
    const existing = await this.prisma.deliveryShipment.findUnique({ where: { orderId } });
    if (existing?.providerRef && !["FAILED", "CANCELLED", "QUOTED"].includes(existing.status)) {
      return { data: existing, idempotent: true, provider: this.readiness().data };
    }
    const result = await this.provider.create(request);
    const status = this.status(result.status, "REQUESTED");
    const data = await this.prisma.deliveryShipment.upsert({
      where: { orderId },
      create: {
        orderId,
        businessId: order.businessId,
        customerId: order.customerId,
        provider: this.provider.name,
        providerRef: result.providerRef,
        status,
        quotedAmount: result.amount,
        currency: result.currency,
        trackingUrl: result.trackingUrl,
        driverName: result.driver?.name,
        driverPhone: result.driver?.phone,
        vehicleNumber: result.driver?.vehicleNumber,
        providerData: result.raw as Prisma.InputJsonValue,
        requestedAt: new Date(),
        lastSyncedAt: new Date(),
      },
      update: {
        provider: this.provider.name,
        providerRef: result.providerRef,
        status,
        quotedAmount: result.amount,
        currency: result.currency,
        trackingUrl: result.trackingUrl,
        providerData: result.raw as Prisma.InputJsonValue,
        requestedAt: new Date(),
        lastSyncedAt: new Date(),
      },
    });
    return { data, provider: this.readiness().data };
  }

  async track(userId: string, orderId: string) {
    const shipment = await this.requireShipment(userId, orderId);
    if (!shipment.providerRef || this.provider.name === "MANUAL") return { data: shipment };
    const result = await this.provider.track(shipment.providerRef);
    const status = this.status(result.status, shipment.status);
    const data = await this.prisma.deliveryShipment.update({
      where: { orderId },
      data: {
        status,
        trackingUrl: result.trackingUrl ?? shipment.trackingUrl,
        driverName: result.driver?.name ?? shipment.driverName,
        driverPhone: result.driver?.phone ?? shipment.driverPhone,
        vehicleNumber: result.driver?.vehicleNumber ?? shipment.vehicleNumber,
        providerData: result.raw as Prisma.InputJsonValue,
        lastSyncedAt: new Date(),
        deliveredAt: status === "DELIVERED" ? new Date() : undefined,
      },
    });
    return { data };
  }

  async cancel(userId: string, orderId: string) {
    const shipment = await this.requireShipment(userId, orderId);
    if (["DELIVERED", "CANCELLED"].includes(shipment.status)) throw new ConflictException("This delivery cannot be cancelled.");
    const result = shipment.providerRef
      ? await this.provider.cancel(shipment.providerRef)
      : { raw: {}, status: "CANCELLED" };
    const data = await this.prisma.deliveryShipment.update({
      where: { orderId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        lastSyncedAt: new Date(),
        providerData: result.raw as Prisma.InputJsonValue,
      },
    });
    return { data };
  }

  async updateDispatch(userId: string, orderId: string, input: UpdateDeliveryDispatchDto) {
    const shipment = await this.requireBusinessShipment(userId, orderId);
    if (["CANCELLED", "FAILED"].includes(shipment.status)) {
      throw new ConflictException("This delivery lifecycle is already closed.");
    }
    if (input.status === "DELIVERED" && !shipment.proof) {
      throw new ConflictException("Capture proof of delivery before marking the shipment delivered.");
    }
    const now = new Date();
    const data = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.deliveryShipment.update({
        where: { orderId },
        data: {
          status: input.status,
          driverName: input.driverName ?? shipment.driverName,
          driverPhone: input.driverPhone ?? shipment.driverPhone,
          vehicleNumber: input.vehicleNumber ?? shipment.vehicleNumber,
          deliveredAt: input.status === "DELIVERED" ? now : undefined,
          lastSyncedAt: now,
        },
        include: { proof: true, settlement: true },
      });
      if (input.status === "DELIVERED") {
        await transaction.order.update({
          where: { id: shipment.orderId },
          data: { status: "DELIVERED", deliveredAt: now },
        });
      } else if (["ASSIGNED", "PICKED_UP", "IN_TRANSIT"].includes(input.status)) {
        await transaction.order.updateMany({
          where: { id: shipment.orderId, status: { not: "DELIVERED" } },
          data: { status: "DISPATCHED" },
        });
      }
      await transaction.notification.create({
        data: {
          userId: shipment.customerId,
          type: "ORDER_UPDATE",
          channel: "IN_APP",
          title: `Delivery ${input.status.toLowerCase().replaceAll("_", " ")}`,
          body: `${shipment.order.orderNumber} · ${input.driverName ?? shipment.driverName ?? "Delivery partner"}`,
          data: { orderId, shipmentId: shipment.id, status: input.status },
          sentAt: now,
        },
      });
      return updated;
    });
    return { data };
  }

  async captureProof(userId: string, orderId: string, input: CaptureDeliveryProofDto) {
    const shipment = await this.requireBusinessShipment(userId, orderId);
    if (["CANCELLED", "FAILED"].includes(shipment.status)) {
      throw new ConflictException("Proof cannot be attached to a cancelled or failed delivery.");
    }
    await this.media.requireOwnedObjects(
      userId,
      "delivery_proof",
      shipment.businessId,
      [input.objectKey],
    );
    const now = new Date();
    const grossAmount = Number(shipment.order.deliveryFee);
    const providerFee = Number(shipment.quotedAmount ?? shipment.order.deliveryFee);
    const netPayable = Math.max(0, grossAmount - providerFee);
    const data = await this.prisma.$transaction(async (transaction) => {
      const proof = await transaction.deliveryProof.upsert({
        where: { shipmentId: shipment.id },
        create: {
          shipmentId: shipment.id,
          objectKey: input.objectKey,
          receiverName: input.receiverName,
          notes: input.notes,
          latitude: input.latitude,
          longitude: input.longitude,
          capturedAt: now,
          capturedById: userId,
        },
        update: {
          objectKey: input.objectKey,
          receiverName: input.receiverName,
          notes: input.notes,
          latitude: input.latitude,
          longitude: input.longitude,
          capturedAt: now,
          capturedById: userId,
        },
      });
      await transaction.deliveryShipment.update({
        where: { id: shipment.id },
        data: { status: "DELIVERED", deliveredAt: now, lastSyncedAt: now },
      });
      await transaction.order.update({
        where: { id: shipment.orderId },
        data: { status: "DELIVERED", deliveredAt: now },
      });
      await transaction.deliverySettlement.upsert({
        where: { shipmentId: shipment.id },
        create: {
          shipmentId: shipment.id,
          status: "READY",
          grossAmount,
          providerFee,
          netPayable,
          currency: shipment.currency,
          readyAt: now,
          createdById: userId,
        },
        update: {
          status: "READY",
          grossAmount,
          providerFee,
          netPayable,
          readyAt: now,
        },
      });
      await transaction.notification.create({
        data: {
          userId: shipment.customerId,
          type: "ORDER_UPDATE",
          channel: "IN_APP",
          title: "Delivery completed",
          body: `${shipment.order.orderNumber} was received by ${input.receiverName}.`,
          data: { orderId, shipmentId: shipment.id, proofCaptured: true },
          sentAt: now,
        },
      });
      return proof;
    });
    return { data };
  }

  async settle(userId: string, orderId: string, input: SettleDeliveryDto) {
    const shipment = await this.requireBusinessShipment(userId, orderId);
    if (shipment.status !== "DELIVERED" || !shipment.proof) {
      throw new ConflictException("A delivered shipment with proof is required before settlement.");
    }
    const now = new Date();
    const grossAmount = Number(shipment.order.deliveryFee);
    const data = await this.prisma.deliverySettlement.upsert({
      where: { shipmentId: shipment.id },
      create: {
        shipmentId: shipment.id,
        status: "SETTLED",
        grossAmount,
        providerFee: input.providerFee,
        netPayable: Math.max(0, grossAmount - input.providerFee),
        currency: shipment.currency,
        reference: input.reference,
        notes: input.notes,
        readyAt: shipment.deliveredAt ?? now,
        settledAt: now,
        createdById: userId,
      },
      update: {
        status: "SETTLED",
        grossAmount,
        providerFee: input.providerFee,
        netPayable: Math.max(0, grossAmount - input.providerFee),
        reference: input.reference,
        notes: input.notes,
        settledAt: now,
      },
    });
    return { data };
  }

  async webhook(
    provider: string,
    providedSignature: string | undefined,
    eventId: string | undefined,
    rawBody: Buffer,
    payload: Record<string, unknown>,
  ) {
    const normalizedProvider = provider.trim().toUpperCase();
    if (this.provider.name === "MANUAL" || normalizedProvider !== this.provider.name.toUpperCase()) {
      throw new ServiceUnavailableException("This delivery provider is not enabled.");
    }
    const expected = this.config.get<string>("DELIVERY_WEBHOOK_SECRET");
    const signature = providedSignature?.replace(/^sha256=/i, "").trim().toLowerCase();
    const calculated = expected ? createHmac("sha256", expected).update(rawBody).digest("hex") : "";
    if (!expected || !signature || calculated.length !== signature.length
      || !timingSafeEqual(Buffer.from(calculated), Buffer.from(signature))) {
      throw new UnauthorizedException("Invalid delivery webhook signature.");
    }
    if (!eventId?.trim()) throw new UnauthorizedException("Delivery webhook event ID is required.");

    const webhookProvider = `DELIVERY_${normalizedProvider}`;
    const normalizedEventId = eventId.trim();
    const eventType = String(payload.event ?? payload.type ?? payload.status ?? "delivery.update").slice(0, 120);
    let webhookEvent: { id: string };
    try {
      webhookEvent = await this.prisma.webhookEvent.create({
        data: {
          provider: webhookProvider,
          eventId: normalizedEventId,
          eventType,
          payloadHash: createHash("sha256").update(rawBody).digest("hex"),
          payload: payload as Prisma.InputJsonValue,
        },
        select: { id: true },
      });
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
        return { received: true, duplicate: true };
      }
      throw error;
    }

    const providerRef = String(payload.id ?? payload.reference ?? payload.delivery_id ?? "");
    try {
      if (!providerRef) throw new NotFoundException("Delivery reference missing.");
      const shipment = await this.prisma.deliveryShipment.findFirst({
        where: { provider: normalizedProvider, providerRef },
      });
      if (!shipment) throw new NotFoundException("Delivery shipment not found.");
      const requestedStatus = this.status(String(payload.status ?? ""), shipment.status);
      const status = this.allowedProviderTransition(shipment.status, requestedStatus);
      const driver = this.driver(payload);
      const now = new Date();
      const data = await this.prisma.$transaction(async (transaction) => {
        if (status === shipment.status) {
          await transaction.webhookEvent.update({
            where: { id: webhookEvent.id },
            data: { status: "IGNORED", attempts: { increment: 1 }, processedAt: now },
          });
          return shipment;
        }
        const updated = await transaction.deliveryShipment.update({
          where: { id: shipment.id },
          data: {
            status,
            trackingUrl: String(payload.trackingUrl ?? payload.tracking_url ?? "") || shipment.trackingUrl,
            driverName: driver.name ?? shipment.driverName,
            driverPhone: driver.phone ?? shipment.driverPhone,
            vehicleNumber: driver.vehicleNumber ?? shipment.vehicleNumber,
            providerData: payload as Prisma.InputJsonValue,
            lastSyncedAt: now,
            deliveredAt: status === "DELIVERED" ? now : undefined,
            cancelledAt: status === "CANCELLED" ? now : undefined,
          },
        });
        if (status === "DELIVERED") {
          await transaction.order.update({ where: { id: shipment.orderId }, data: { status: "DELIVERED", deliveredAt: now } });
        } else if (["ASSIGNED", "PICKED_UP", "IN_TRANSIT"].includes(status)) {
          await transaction.order.updateMany({ where: { id: shipment.orderId, status: { not: "DELIVERED" } }, data: { status: "DISPATCHED" } });
        }
        await transaction.webhookEvent.update({
          where: { id: webhookEvent.id },
          data: { status: "PROCESSED", attempts: { increment: 1 }, processedAt: now },
        });
        return updated;
      });
      return { data, received: true };
    } catch (error) {
      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: "FAILED",
          attempts: { increment: 1 },
          error: error instanceof Error ? error.message.slice(0, 500) : "Unknown delivery webhook error",
        },
      });
      throw error;
    }
  }

  private async authorizedOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { select: { nameSnapshot: true, quantity: true } },
        business: {
          select: {
            id: true,
            name: true,
            publicPhone: true,
            locations: { where: { isPrimary: true, isActive: true }, take: 1 },
          },
        },
      },
    });
    if (!order) throw new NotFoundException("Order not found.");
    await this.planEntitlements.requireFeature(order.businessId, "deliveryEnabled");
    const access = await this.businessAccess.accessFor(userId, order.businessId);
    if (order.customerId !== userId && !access?.capabilities.includes("business:catalog:manage")) {
      throw new ForbiddenException("You cannot manage this delivery.");
    }
    const pickup = order.business.locations[0];
    if (!pickup) throw new ConflictException("The business pickup address is missing.");
    const drop = order.deliveryAddress && typeof order.deliveryAddress === "object"
      ? order.deliveryAddress as Record<string, unknown>
      : {};
    const request: DeliveryRequest = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      pickup: {
        businessName: order.business.name,
        phone: order.business.publicPhone,
        addressLine1: pickup.addressLine1,
        addressLine2: pickup.addressLine2,
        locality: pickup.locality,
        city: pickup.city,
        state: pickup.state,
        postalCode: pickup.postalCode,
        latitude: Number(pickup.latitude),
        longitude: Number(pickup.longitude),
      },
      drop,
      items: order.items.map((item) => ({ name: item.nameSnapshot, quantity: item.quantity })),
      currentDeliveryFee: Number(order.deliveryFee),
    };
    return { order, request };
  }

  private async requireShipment(userId: string, orderId: string) {
    const shipment = await this.prisma.deliveryShipment.findUnique({ where: { orderId } });
    if (!shipment) throw new NotFoundException("Delivery shipment not found.");
    const access = await this.businessAccess.accessFor(userId, shipment.businessId);
    if (shipment.customerId !== userId && !access?.capabilities.includes("business:catalog:manage")) {
      throw new ForbiddenException("You cannot access this delivery.");
    }
    return shipment;
  }

  private async requireBusinessShipment(userId: string, orderId: string) {
    const shipment = await this.prisma.deliveryShipment.findUnique({
      where: { orderId },
      include: {
        proof: true,
        settlement: true,
        order: {
          select: {
            orderNumber: true,
            deliveryFee: true,
            total: true,
            status: true,
          },
        },
      },
    });
    if (!shipment) throw new NotFoundException("Delivery shipment not found.");
    await this.businessAccess.require(userId, shipment.businessId, "business:catalog:manage");
    return shipment;
  }

  private driver(payload: Record<string, unknown>) {
    const source = (
      (typeof payload.driver === "object" && payload.driver)
      || (typeof payload.captain === "object" && payload.captain)
      || (typeof payload.partner === "object" && payload.partner)
      || {}
    ) as Record<string, unknown>;
    return {
      name: String(source.name ?? source.driver_name ?? "") || undefined,
      phone: String(source.phone ?? source.mobile ?? "") || undefined,
      vehicleNumber: String(
        source.vehicleNumber
        ?? source.vehicle_number
        ?? source.registration_number
        ?? "",
      ) || undefined,
    };
  }

  private status(input: string, fallback: ShipmentStatus): ShipmentStatus {
    const normalized = input.toUpperCase().replaceAll("-", "_").replaceAll(" ", "_");
    const aliases: Record<string, string> = {
      ACCEPTED: "REQUESTED",
      DRIVER_ASSIGNED: "ASSIGNED",
      PICKED: "PICKED_UP",
      OUT_FOR_DELIVERY: "IN_TRANSIT",
      COMPLETED: "DELIVERED",
      CANCELED: "CANCELLED",
    };
    const value = aliases[normalized] ?? normalized;
    return (shipmentStatuses.has(value) ? value : fallback) as ShipmentStatus;
  }

  private allowedProviderTransition(current: ShipmentStatus, requested: ShipmentStatus): ShipmentStatus {
    if (current === requested || terminalShipmentStatuses.has(current)) return current;
    return shipmentProgression[current]?.has(requested) ? requested : current;
  }
}
