import { BadGatewayException, ServiceUnavailableException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";

export type DeliveryRequest = {
  orderId: string;
  orderNumber: string;
  pickup: Record<string, unknown>;
  drop: Record<string, unknown>;
  items: Array<{ name: string; quantity: number }>;
  currentDeliveryFee: number;
};

export type DeliveryProviderResult = {
  providerRef?: string;
  amount?: number;
  currency: string;
  trackingUrl?: string;
  status: string;
  driver?: {
    name?: string;
    phone?: string;
    vehicleNumber?: string;
  };
  raw: Record<string, unknown>;
};

export interface DeliveryProvider {
  readonly name: string;
  readonly configured: boolean;
  quote(input: DeliveryRequest): Promise<DeliveryProviderResult>;
  create(input: DeliveryRequest): Promise<DeliveryProviderResult>;
  track(providerRef: string): Promise<DeliveryProviderResult>;
  cancel(providerRef: string): Promise<DeliveryProviderResult>;
}

export class ManualDeliveryProvider implements DeliveryProvider {
  readonly name = "MANUAL";
  readonly configured = true;

  async quote(input: DeliveryRequest): Promise<DeliveryProviderResult> {
    return {
      amount: input.currentDeliveryFee,
      currency: "INR",
      status: "QUOTED",
      raw: { mode: "manual", orderNumber: input.orderNumber },
    };
  }

  async create(input: DeliveryRequest): Promise<DeliveryProviderResult> {
    return {
      providerRef: `manual-${input.orderId}`,
      amount: input.currentDeliveryFee,
      currency: "INR",
      status: "REQUESTED",
      raw: { mode: "manual", orderNumber: input.orderNumber },
    };
  }

  async track(providerRef: string): Promise<DeliveryProviderResult> {
    return { providerRef, currency: "INR", status: "REQUESTED", raw: { mode: "manual" } };
  }

  async cancel(providerRef: string): Promise<DeliveryProviderResult> {
    return { providerRef, currency: "INR", status: "CANCELLED", raw: { mode: "manual" } };
  }
}

export class HttpDeliveryProvider implements DeliveryProvider {
  readonly name: string;
  readonly configured: boolean;
  private readonly baseUrl?: string;
  private readonly token?: string;

  constructor(private readonly config: ConfigService) {
    this.name = config.get<string>("DELIVERY_PROVIDER") ?? "HTTP";
    this.baseUrl = config.get<string>("DELIVERY_API_BASE_URL");
    this.token = config.get<string>("DELIVERY_API_TOKEN");
    this.configured = Boolean(this.baseUrl && this.token);
  }

  quote(input: DeliveryRequest) {
    return this.request(this.config.get<string>("DELIVERY_QUOTE_PATH") ?? "/quotes", "POST", input);
  }

  create(input: DeliveryRequest) {
    return this.request(this.config.get<string>("DELIVERY_CREATE_PATH") ?? "/deliveries", "POST", input);
  }

  track(providerRef: string) {
    const path = (this.config.get<string>("DELIVERY_STATUS_PATH") ?? "/deliveries/{id}")
      .replace("{id}", encodeURIComponent(providerRef));
    return this.request(path, "GET");
  }

  cancel(providerRef: string) {
    const path = (this.config.get<string>("DELIVERY_CANCEL_PATH") ?? "/deliveries/{id}/cancel")
      .replace("{id}", encodeURIComponent(providerRef));
    return this.request(path, "POST");
  }

  private async request(path: string, method: "GET" | "POST", body?: DeliveryRequest) {
    if (!this.configured) {
      throw new ServiceUnavailableException(`${this.name} delivery credentials are not configured.`);
    }
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`, {
        method,
        headers: {
          accept: "application/json",
          authorization: `Bearer ${this.token}`,
          ...(body ? { "content-type": "application/json", "idempotency-key": body.orderId } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(12_000),
      });
    } catch {
      throw new BadGatewayException(`${this.name} delivery service could not be reached.`);
    }
    const raw = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) {
      throw new BadGatewayException(
        typeof raw.message === "string" ? raw.message : `${this.name} delivery request failed.`,
      );
    }
    const estimate = typeof raw.estimate === "object" && raw.estimate ? raw.estimate as Record<string, unknown> : {};
    const fare = typeof raw.fare === "object" && raw.fare ? raw.fare as Record<string, unknown> : {};
    const driverSource = (
      (typeof raw.driver === "object" && raw.driver)
      || (typeof raw.captain === "object" && raw.captain)
      || (typeof raw.partner === "object" && raw.partner)
      || {}
    ) as Record<string, unknown>;
    const amount = Number(raw.amount ?? estimate.amount ?? fare.amount);
    return {
      providerRef: String(raw.id ?? raw.reference ?? raw.delivery_id ?? "") || undefined,
      amount: Number.isFinite(amount) ? amount : undefined,
      currency: String(raw.currency ?? estimate.currency ?? fare.currency ?? "INR"),
      trackingUrl: String(raw.trackingUrl ?? raw.tracking_url ?? "") || undefined,
      status: String(raw.status ?? "REQUESTED").toUpperCase(),
      driver: {
        name: String(driverSource.name ?? driverSource.driver_name ?? "") || undefined,
        phone: String(driverSource.phone ?? driverSource.mobile ?? "") || undefined,
        vehicleNumber: String(
          driverSource.vehicleNumber
          ?? driverSource.vehicle_number
          ?? driverSource.registration_number
          ?? "",
        ) || undefined,
      },
      raw,
    };
  }
}
