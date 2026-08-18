import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import type { SuggestLocationsDto } from "./dto/suggest-locations.dto";

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async tree() {
    const data = await this.prisma.managedLocation.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, type: true, parentId: true, latitude: true, longitude: true },
    });
    return { data };
  }

  async cities(state = "Kerala") {
    const rows = await this.prisma.businessLocation.groupBy({
      by: ["city", "district", "state"],
      where: {
        state: { equals: state, mode: "insensitive" },
        isActive: true,
        business: { status: "ACTIVE", listingStatus: "PUBLISHED", deletedAt: null },
      },
      _count: { businessId: true },
      orderBy: { _count: { businessId: "desc" } },
    });
    return {
      data: rows.map((row) => ({
        city: row.city,
        district: row.district,
        state: row.state,
        businessCount: row._count.businessId,
      })),
    };
  }

  async suggest(query: SuggestLocationsDto) {
    const data = await this.prisma.businessLocation.findMany({
      where: {
        isActive: true,
        ...(query.state ? { state: { equals: query.state, mode: "insensitive" } } : {}),
        OR: [
          { locality: { contains: query.q, mode: "insensitive" } },
          { city: { contains: query.q, mode: "insensitive" } },
          { district: { contains: query.q, mode: "insensitive" } },
          { postalCode: { startsWith: query.q } },
        ],
      },
      distinct: ["locality", "city", "district", "state", "postalCode"],
      select: {
        locality: true,
        city: true,
        district: true,
        state: true,
        postalCode: true,
        latitude: true,
        longitude: true,
      },
      orderBy: [{ city: "asc" }, { locality: "asc" }],
      take: 20,
    });
    return { data };
  }
}
