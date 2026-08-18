import { Prisma } from "../../generated/prisma/client";

const toRadians = (value: number) => (value * Math.PI) / 180;

export type AdministrativeContext = {
  constituency?: string;
  district?: string;
  state?: string;
};

type RawLocationClient = {
  $queryRaw<T>(query: Prisma.Sql): Promise<T>;
};

export async function resolveAdministrativeContext(
  prisma: RawLocationClient,
  input: AdministrativeContext & { latitude?: number; longitude?: number },
): Promise<AdministrativeContext> {
  const explicit = {
    constituency: input.constituency?.trim() || undefined,
    district: input.district?.trim() || undefined,
    state: input.state?.trim() || undefined,
  };
  if (
    explicit.constituency &&
    explicit.district &&
    explicit.state
  ) {
    return explicit;
  }
  if (typeof input.latitude !== "number" || typeof input.longitude !== "number") {
    return explicit;
  }

  const rows = await prisma.$queryRaw<Array<{
    constituency: string | null;
    district: string;
    state: string;
  }>>(Prisma.sql`
    SELECT COALESCE("constituency", "city") AS constituency, "district", "state"
    FROM "BusinessLocation"
    WHERE "isActive" = true
    ORDER BY ST_Distance(
      "locationPoint",
      ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography
    ) ASC
    LIMIT 1
  `);
  const nearest = rows[0];
  return {
    constituency: explicit.constituency ?? nearest?.constituency ?? undefined,
    district: explicit.district ?? nearest?.district ?? undefined,
    state: explicit.state ?? nearest?.state ?? undefined,
  };
}

export function calculateDistanceKm(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
) {
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(latitudeB - latitudeA);
  const longitudeDelta = toRadians(longitudeB - longitudeA);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(latitudeA)) *
      Math.cos(toRadians(latitudeB)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function comparePlanRanking(
  left: { priority: number; startsAt?: Date },
  right: { priority: number; startsAt?: Date },
) {
  const priorityDifference = right.priority - left.priority;
  if (priorityDifference !== 0) return priorityDifference;
  return (
    (left.startsAt?.getTime() ?? Number.MAX_SAFE_INTEGER) -
    (right.startsAt?.getTime() ?? Number.MAX_SAFE_INTEGER)
  );
}
