import type {
  HomeBusiness,
  HomeCategory,
  HomeJob,
  HomeOffer,
  HomeProduct,
  HomeProfessional,
  HomeService,
  LuckyDrawWinner,
  PopularLocation,
} from "@/lib/home-types";

export const homePopularSearches = [
  "Grocery",
  "Hotels",
  "Doctors",
  "Restaurants",
  "Electricians",
  "Beauty parlours",
  "Photographers",
];

export const homeCategories: HomeCategory[] = [
  { id: "grocery", catalogueSlug: "grocery", name: "Grocery", query: "Grocery shops", icon: "Apple", businessCount: 0, productCount: 0, featured: true },
  { id: "clinics", catalogueSlug: "doctors-clinics", name: "Clinics", query: "Clinics and doctors", icon: "HeartPulse", businessCount: 0, productCount: 0 },
  { id: "restaurants", catalogueSlug: "restaurants", name: "Restaurants", query: "Restaurants", icon: "Utensils", businessCount: 0, productCount: 0, featured: true },
  { id: "hotels", catalogueSlug: "hotels-stays", name: "Hotels & stays", query: "Hotels and resorts", icon: "Hotel", businessCount: 0, productCount: 0, featured: true },
  { id: "bakery", catalogueSlug: "bakery-sweets", name: "Bakery & sweets", query: "Bakery and sweets", icon: "CakeSlice", businessCount: 0, productCount: 0 },
  { id: "electronics", catalogueSlug: "electronics", name: "Electronics", query: "Electronics shops", icon: "Laptop", businessCount: 0, productCount: 0 },
  { id: "fashion", catalogueSlug: "fashion", name: "Fashion", query: "Fashion stores", icon: "Store", businessCount: 0, productCount: 0 },
  { id: "beauty", catalogueSlug: "beauty-wellness", name: "Beauty & wellness", query: "Beauty and wellness", icon: "Scissors", businessCount: 0, productCount: 0 },
  { id: "home", catalogueSlug: "home-services", name: "Home services", query: "Home services", icon: "House", businessCount: 0, productCount: 0, featured: true },
  { id: "auto", catalogueSlug: "automobile", name: "Automobile", query: "Automobile services", icon: "CarFront", businessCount: 0, productCount: 0 },
  { id: "photo", catalogueSlug: "event-services", name: "Photography", query: "Photographers", icon: "Camera", businessCount: 0, productCount: 0 },
  { id: "education", catalogueSlug: "education", name: "Education", query: "Education and training", icon: "GraduationCap", businessCount: 0, productCount: 0 },
  { id: "real-estate", catalogueSlug: "real-estate", name: "Real estate", query: "Real estate", icon: "Building2", businessCount: 0, productCount: 0 },
  { id: "insurance", catalogueSlug: "insurance", name: "Insurance", query: "Insurance plans and advisors", icon: "ShieldCheck", businessCount: 0, productCount: 0, featured: true },
];

/** Data-backed homepage collections remain empty until the API supplies records. */
export const homeBusinesses: HomeBusiness[] = [];
export const homeOffers: HomeOffer[] = [];
export const homeProducts: HomeProduct[] = [];
export const homeProfessionals: HomeProfessional[] = [];
export const homeJobs: HomeJob[] = [];
export const luckyDrawWinners: LuckyDrawWinner[] = [];

export const homeServices: HomeService[] = [
  { id: "service-doctor", name: "Doctors", providerType: "Clinics & specialists", icon: "Stethoscope", availableProviders: 0 },
  { id: "service-beauty", name: "Beauty parlours", providerType: "Salon appointments", icon: "Scissors", availableProviders: 0 },
  { id: "service-consultant", name: "Consultants", providerType: "Professional advice", icon: "BriefcaseBusiness", availableProviders: 0 },
  { id: "service-repair", name: "Service centres", providerType: "Repair & maintenance", icon: "Wrench", availableProviders: 0 },
  { id: "service-property", name: "Property experts", providerType: "Agents & consultants", icon: "Building2", availableProviders: 0 },
  { id: "service-hotels", name: "Hotels & stays", providerType: "Rooms & local experiences", icon: "Hotel", availableProviders: 0 },
  { id: "service-cleaning", name: "Home cleaning", providerType: "Cleaning & pest care", icon: "House", availableProviders: 0 },
  { id: "service-tutors", name: "Tutors & classes", providerType: "Learning & coaching", icon: "GraduationCap", availableProviders: 0 },
  { id: "service-insurance", name: "Insurance advisors", providerType: "Personal & business protection", icon: "ShieldCheck", availableProviders: 0 },
];

export const popularLocations: PopularLocation[] = [
  { name: "Kochi", district: "Ernakulam", neighbourhoods: "Fort Kochi · Kakkanad · Vyttila" },
  { name: "Kozhikode", district: "Kozhikode", neighbourhoods: "Nadakkavu · Mavoor Road · Kottooli" },
  { name: "Thiruvananthapuram", district: "Thiruvananthapuram", neighbourhoods: "Kowdiar · Kazhakkoottam · Pattom" },
  { name: "Thrissur", district: "Thrissur", neighbourhoods: "Punkunnam · Ayyanthole · East Fort" },
  { name: "Kannur", district: "Kannur", neighbourhoods: "Thavakkara · Talap · Payyambalam" },
  { name: "Kottayam", district: "Kottayam", neighbourhoods: "Kanjikuzhy · Nagampadam · Kumaranalloor" },
  { name: "Wayanad", district: "Wayanad", neighbourhoods: "Vythiri · Kalpetta · Sulthan Bathery" },
  { name: "Alappuzha", district: "Alappuzha", neighbourhoods: "Alappuzha Beach · Punnamada · Marari" },
];
