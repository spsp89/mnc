export type BusinessStatus = "open" | "closing-soon" | "closed";
export type BncStarLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type ProductStockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "MADE_TO_ORDER";

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  accent: string;
};

export type Offer = {
  id: string;
  title: string;
  description: string;
  code?: string;
  discount: string;
  expiresAt: string;
};

export type Product = {
  id: string;
  businessId?: string;
  name: string;
  category: string;
  categorySlug?: string;
  price: number;
  discountPrice?: number;
  image: string;
  images?: string[];
  description?: string;
  brand?: string;
  minimumOrderQty?: number;
  warranty?: string;
  returnInformation?: string;
  specifications?: Record<string, string>;
  inStock: boolean;
  stockStatus?: ProductStockStatus;
  sellerName?: string;
  sellerCity?: string;
  sellerPhone?: string;
  sellerWhatsapp?: string;
  distanceKm?: number;
  sponsored?: boolean;
  bncStarLevel?: BncStarLevel;
  planName?: string;
  courierAvailable?: boolean;
  unitsSold?: number;
  homeDeliveryAvailable?: boolean;
  checkout?: boolean;
};

export type Service = {
  id: string;
  name: string;
  startingPrice: number;
  pricingUnit: string;
  duration?: string;
  homeService: boolean;
};

export type Review = {
  id: string;
  author: string;
  rating: number;
  date: string;
  body: string;
  verified: boolean;
  helpful: number;
};

export type Business = {
  id: string;
  slug: string;
  name: string;
  category: string;
  categoryId: string;
  categorySlug: string;
  subcategory: string;
  description: string;
  shortDescription: string;
  coverImage: string;
  gallery: string[];
  logoText: string;
  city: string;
  district: string;
  locality: string;
  state: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
  premium: boolean;
  sponsored: boolean;
  bncStarLevel: BncStarLevel;
  planName?: string;
  status: BusinessStatus;
  closesAt: string;
  responseTime: string;
  priceRange: string;
  yearsInBusiness: number;
  phone: string;
  whatsapp: string;
  websiteUrl?: string;
  socialLinks: Record<string, string>;
  paymentProfile?: {
    upiId: string;
    accountName?: string;
  };
  permanentDiscountPercent?: number;
  permanentDiscountLabel?: string;
  languages: string[];
  paymentMethods: string[];
  amenities: string[];
  tags: string[];
  services: Service[];
  products: Product[];
  offer?: Offer;
  reviews: Review[];
  joinedPlanAt?: string;
};

export type SearchFilters = {
  query?: string;
  location?: string;
  constituency?: string;
  district?: string;
  state?: string;
  category?: string;
  productStatus?: ProductStockStatus;
  latitude?: number;
  longitude?: number;
  radius?: number;
  rating?: number;
  openNow?: boolean;
  verified?: boolean;
  premium?: boolean;
  offers?: boolean;
  homeService?: boolean;
  delivery?: boolean;
  courier?: boolean;
  fastResponse?: boolean;
  price?: string;
  payment?: string;
  language?: string;
  minYears?: number;
  sort?: string;
};
