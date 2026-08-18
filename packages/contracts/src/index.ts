export type ApiSuccess<T> = {
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
    requestId?: string;
  };
};

export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
    requestId: string;
  };
};

export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export type PageQuery = {
  page?: number;
  pageSize?: number;
  sort?: string;
};

export type BusinessSearchQuery = PageQuery & {
  query?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: 1 | 3 | 5 | 10 | 25 | 50;
  rating?: number;
  openNow?: boolean;
  verified?: boolean;
  premium?: boolean;
  offers?: boolean;
  homeService?: boolean;
};

export type LeadStatus =
  | "new"
  | "delivered"
  | "viewed"
  | "accepted"
  | "contacted"
  | "converted"
  | "expired"
  | "rejected";

