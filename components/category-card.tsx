import {
  Camera,
  CarFront,
  CakeSlice,
  GraduationCap,
  Hotel,
  House,
  Laptop,
  ShoppingBasket,
  Shirt,
  Sparkles,
  Stethoscope,
  Building2,
  Utensils,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { Category } from "@/lib/types";
import { categoryImage } from "@/lib/category-images";

const icons = {
  Camera,
  CarFront,
  CakeSlice,
  GraduationCap,
  Hotel,
  House,
  Laptop,
  ShoppingBasket,
  Shirt,
  Sparkles,
  Stethoscope,
  Building2,
  Utensils,
  ShieldCheck,
  grocery: ShoppingBasket,
  restaurants: Utensils,
  "hotels-stays": Hotel,
  "bakery-sweets": CakeSlice,
  "home-services": House,
  "doctors-clinics": Stethoscope,
  "event-services": Camera,
  electronics: Laptop,
  "beauty-wellness": Sparkles,
  automobile: CarFront,
  education: GraduationCap,
  fashion: Shirt,
  "real-estate": Building2,
  "sports-fitness": Sparkles,
  "professional-services": Building2,
  insurance: ShieldCheck,
};

export function CategoryCard({ category }: { category: Category }) {
  const Icon = icons[category.icon as keyof typeof icons] ?? House;

  return (
    <Link
      className="category-card"
      href={`/products?category=${encodeURIComponent(category.slug)}`}
      style={{ "--category-accent": category.accent } as CSSProperties}
    >
      <Image className="category-card-background" src={categoryImage(category.slug)} alt="" fill sizes="(max-width: 680px) 92vw, (max-width: 1050px) 46vw, 25vw" aria-hidden="true" />
      <span className="category-card-shade" aria-hidden="true" />
      <span className="category-icon"><Icon size={24} /></span>
      <span className="category-copy">
        <strong>{category.name}</strong>
        <small>{category.description}</small>
      </span>
    </Link>
  );
}
