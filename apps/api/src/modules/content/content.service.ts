import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}
  async banners(placement?: string) {
    const now = new Date();
    return { data: await this.prisma.banner.findMany({
      where: { isActive: true, ...(placement ? { placement } : {}), AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }] },
      orderBy: [{ placement: "asc" }, { displayOrder: "asc" }],
      select: { id: true, title: true, subtitle: true, ctaText: true, ctaUrl: true, placement: true, imageUrl: true, startsAt: true, endsAt: true, displayOrder: true },
    }) };
  }
}
