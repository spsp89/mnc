import type { BncStarLevel, Business, Product } from "@/lib/types";

export type HomeIconName =
  | "Apple"
  | "BadgeIndianRupee"
  | "BriefcaseBusiness"
  | "Building2"
  | "CakeSlice"
  | "Camera"
  | "CarFront"
  | "GraduationCap"
  | "HeartPulse"
  | "Hotel"
  | "House"
  | "Laptop"
  | "Scissors"
  | "ShieldCheck"
  | "Stethoscope"
  | "Store"
  | "Utensils"
  | "Wrench";

export type HomeCategory = {
  id: string;
  catalogueSlug: string;
  name: string;
  query: string;
  icon: HomeIconName;
  businessCount: number;
  productCount: number;
  featured?: boolean;
};

export type HomeBusiness = {
  business: Business;
  starLevel: BncStarLevel;
  discount?: string;
  featured?: boolean;
};

export type HomeOffer = {
  id: string;
  title: string;
  businessName: string;
  category: string;
  image: string;
  originalPrice: number;
  offerPrice: number;
  discountPercentage: number;
  distanceKm?: number;
  expiryLabel: string;
  tab: "Nearby" | "Popular" | "Ending Soon" | "Exclusive";
};

export type HomeProduct = Product & {
  shopName: string;
  distanceKm?: number;
};

export type HomeService = {
  id: string;
  name: string;
  providerType: string;
  icon: HomeIconName;
  availableProviders: number;
};

export type HomePageData = {
  businesses: HomeBusiness[];
  offers: HomeOffer[];
  products: HomeProduct[];
  bestSellers: HomeProduct[];
  topServices: HomeTopService[];
  professionals: HomeProfessional[];
  jobs: HomeJob[];
  weeklyDraws: HomeWeeklyDraw[];
  categories: HomeCategory[];
  services: HomeService[];
};

export type HomeTopService = {
  id: string;
  name: string;
  businessName: string;
  businessSlug: string;
  category: string;
  image: string;
  city: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  startingPrice: number;
  pricingUnit: string;
  planName?: string;
};

export type HomeWeeklyDraw = {
  id: string;
  title: string;
  prizeDescription: string;
  weekStartsAt: string;
  weekEndsAt: string;
  status: "OPEN" | "PUBLISHED";
  winner?: {
    name: string;
    city: string;
    orderNumber?: string;
  };
  audit?: {
    algorithm?: string;
    candidateHash?: string;
    selectionSeed?: string;
    selectionHash?: string;
    selectionIndex?: number;
    candidateCount?: number;
    usageEventCount?: number;
  };
};

export type HomeProfessional = {
  id: string;
  name: string;
  businessName: string;
  specialisation: string;
  image: string;
  nextAvailable: string;
  price: number;
  distanceKm?: number;
};

export type HomeJob = {
  id: string;
  title: string;
  companyName: string;
  companyInitials: string;
  location: string;
  salary: string;
  employmentType: string;
  posted: string;
  skills: string[];
};

export type LuckyDrawWinner = {
  id: string;
  name: string;
  location: string;
  prize: string;
  orderId: string;
};

export type PopularLocation = {
  name: string;
  district: string;
  neighbourhoods: string;
};
