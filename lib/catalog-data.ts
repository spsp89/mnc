import type { Business, Category, Offer, Product } from "@/lib/types";

/**
 * Production-safe discovery configuration.
 *
 * Public records intentionally start empty. The frontend can render these
 * collections until the backend catalogue endpoints are connected.
 */
export const businesses: Business[] = [];

export const featuredProducts: Product[] = [];

export const latestOffers: Array<Offer & { businessName: string; category: string }> = [];

export const categories: Category[] = [
  { id: "cat-grocery", name: "Grocery", slug: "grocery", icon: "ShoppingBasket", description: "Fresh produce, pantry staples and daily essentials", accent: "#eef5ff" },
  { id: "cat-food", name: "Restaurants", slug: "restaurants", icon: "Utensils", description: "Local dining, cafés and takeaway", accent: "#eef5ff" },
  { id: "cat-hotels", name: "Hotels & stays", slug: "hotels-stays", icon: "Hotel", description: "Hotels, resorts, homestays and local experiences", accent: "#eef5ff" },
  { id: "cat-bakery", name: "Bakery & sweets", slug: "bakery-sweets", icon: "CakeSlice", description: "Fresh bakes, celebration cakes and sweets", accent: "#eef5ff" },
  { id: "cat-home", name: "Home services", slug: "home-services", icon: "House", description: "Repairs, cleaning and trusted technicians", accent: "#eef5ff" },
  { id: "cat-health", name: "Doctors & clinics", slug: "doctors-clinics", icon: "Stethoscope", description: "Clinics, specialists and diagnostics", accent: "#eef5ff" },
  { id: "cat-events", name: "Event services", slug: "event-services", icon: "Camera", description: "Photography, décor and celebrations", accent: "#eef5ff" },
  { id: "cat-electronics", name: "Electronics", slug: "electronics", icon: "Laptop", description: "Devices, accessories and expert repair", accent: "#eef5ff" },
  { id: "cat-beauty", name: "Beauty & wellness", slug: "beauty-wellness", icon: "Sparkles", description: "Salons, spas and personal care", accent: "#eef5ff" },
  { id: "cat-auto", name: "Automobile", slug: "automobile", icon: "CarFront", description: "Garages, detailing and roadside help", accent: "#eef5ff" },
  { id: "cat-education", name: "Education", slug: "education", icon: "GraduationCap", description: "Tutors, academies and skill training", accent: "#eef5ff" },
  { id: "cat-fashion", name: "Fashion", slug: "fashion", icon: "Shirt", description: "Local clothing, occasion wear and everyday style", accent: "#eef5ff" },
  { id: "cat-real-estate", name: "Real estate", slug: "real-estate", icon: "Building2", description: "Homes, rentals and property guidance", accent: "#eef5ff" },
];

export const popularSearches = [
  "Hotels and resorts near me",
  "Wedding photographers near me",
  "Restaurants near me",
  "Laptop repair nearby",
  "Interior designers near me",
  "Furniture shops within 5 km",
  "Grocery delivery nearby",
  "Dental clinics open now",
];

export const cities = [
  { name: "Kochi", district: "Ernakulam", count: "Explore neighbourhoods" },
  { name: "Kozhikode", district: "Kozhikode", count: "Explore neighbourhoods" },
  { name: "Thiruvananthapuram", district: "Thiruvananthapuram", count: "Explore neighbourhoods" },
  { name: "Thrissur", district: "Thrissur", count: "Explore neighbourhoods" },
  { name: "Kannur", district: "Kannur", count: "Explore neighbourhoods" },
  { name: "Kottayam", district: "Kottayam", count: "Explore neighbourhoods" },
  { name: "Wayanad", district: "Wayanad", count: "Explore neighbourhoods" },
  { name: "Alappuzha", district: "Alappuzha", count: "Explore neighbourhoods" },
];
