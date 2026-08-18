import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

type CategoryCountField = "businessLinks" | "products" | "services";
type CountedCategory = {
  _count: Record<CategoryCountField, number>;
  children?: CountedCategory[];
};

const aggregateCategoryCount = (
  category: CountedCategory,
  field: CategoryCountField,
): number => category._count[field] + (category.children ?? []).reduce(
  (total, child) => total + aggregateCategoryCount(child, field),
  0,
);

const aggregateCounts = (category: CountedCategory) => ({
  businessLinks: aggregateCategoryCount(category, "businessLinks"),
  products: aggregateCategoryCount(category, "products"),
  services: aggregateCategoryCount(category, "services"),
});

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async tree(language = "en") {
    const data = await this.prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        children: {
          where: { isActive: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          include: {
            children: {
              where: { isActive: true },
              orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
              include: {
                _count: { select: { businessLinks: true, products: true, services: true } },
              },
            },
            _count: { select: { businessLinks: true, products: true, services: true } },
          },
        },
        _count: { select: { businessLinks: true, products: true, services: true } },
      },
    });
    return {
      data: data.map((category) => ({
        ...category,
        _count: aggregateCounts(category),
        displayName: language === "ml" && category.nameMalayalam ? category.nameMalayalam : category.name,
        children: category.children.map((child) => ({
          ...child,
          _count: aggregateCounts(child),
          displayName: language === "ml" && child.nameMalayalam ? child.nameMalayalam : child.name,
          children: child.children.map((grandchild) => ({
            ...grandchild,
            _count: aggregateCounts(grandchild),
            displayName:
              language === "ml" && grandchild.nameMalayalam
                ? grandchild.nameMalayalam
                : grandchild.name,
          })),
        })),
      })),
    };
  }

  async bySlug(slug: string) {
    const category = await this.prisma.category.findFirst({
      where: { slug, isActive: true },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
        _count: { select: { businessLinks: true, products: true, services: true } },
      },
    });
    if (!category) throw new NotFoundException("Category not found.");
    return { data: category };
  }
}
