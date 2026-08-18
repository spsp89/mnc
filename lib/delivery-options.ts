const HOME_DELIVERY_MODES = new Set([
  "delivery",
  "home_delivery",
  "local_delivery",
  "courier",
]);

const object = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

const normalizedMode = (value: unknown) =>
  typeof value === "string"
    ? value.trim().toLowerCase().replace(/[\s-]+/g, "_")
    : "";

const enabled = (value: unknown) => value === true || value === "true";

function isHomeDeliveryOption(value: unknown): boolean {
  if (HOME_DELIVERY_MODES.has(normalizedMode(value))) return true;

  const option = object(value);
  return (
    enabled(option.homeDelivery) ||
    enabled(option.localDelivery) ||
    enabled(option.courier) ||
    [option.type, option.mode, option.value, option.method].some((entry) =>
      HOME_DELIVERY_MODES.has(normalizedMode(entry)),
    )
  );
}

/** Returns true only when a product explicitly supports delivery to the buyer. */
export function hasHomeDelivery(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(isHomeDeliveryOption);
  return isHomeDeliveryOption(value);
}

/** Keeps the catalogue payload compact while preserving an explicit opt-in. */
export function deliveryOptionsForHomeDelivery(homeDeliveryAvailable: boolean): string[] {
  return homeDeliveryAvailable ? ["local_delivery"] : [];
}
