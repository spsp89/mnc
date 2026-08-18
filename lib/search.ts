import { businesses } from "@/lib/catalog-data";
import type { Business, SearchFilters } from "@/lib/types";

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export function calculateDistanceKm(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
) {
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(latitudeB - latitudeA);
  const longitudeDelta = toRadians(longitudeB - longitudeA);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(latitudeA)) *
      Math.cos(toRadians(latitudeB)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const normalise = (value: string) =>
  value
    .toLocaleLowerCase("en-IN")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const synonyms: Record<string, string[]> = {
  hotel: ["stay", "resort", "room", "homestay", "accommodation", "ഹോട്ടൽ"],
  resort: ["hotel", "stay", "room", "getaway"],
  grocery: ["supermarket", "provisions", "vegetables", "delivery", "പലചരക്ക്"],
  photographer: ["photo", "photography", "studio", "ഫോട്ടോഗ്രാഫർ"],
  repair: ["service", "fix", "technician", "റിപ്പയർ"],
  restaurant: ["food", "cafe", "dining", "ഹോട്ടൽ", "റെസ്റ്റോറന്റ്"],
  interior: ["home design", "decor", "modular kitchen", "ഇന്റീരിയർ"],
  doctor: ["clinic", "physician", "health", "ഡോക്ടർ"],
};

function searchTextFor(business: Business) {
  return normalise(
    [
      business.name,
      business.category,
      business.subcategory,
      business.description,
      business.city,
      business.district,
      business.locality,
      ...business.tags,
      ...business.services.map((service) => service.name),
      ...business.products.map((product) => product.name),
    ].join(" "),
  );
}

function relevanceScore(business: Business, query: string) {
  if (!query) return 1;
  const text = searchTextFor(business);
  const terms = normalise(query).split(" ").filter(Boolean);
  const expandedTerms = terms.flatMap((term) => [term, ...(synonyms[term] ?? [])]);
  let score = 0;

  for (const term of expandedTerms) {
    const normalisedTerm = normalise(term);
    if (normalise(business.name).includes(normalisedTerm)) score += 12;
    if (normalise(business.category).includes(normalisedTerm)) score += 8;
    if (normalise(business.subcategory).includes(normalisedTerm)) score += 7;
    if (text.includes(normalisedTerm)) score += 3;
  }

  return score;
}

function organicScore(business: Business, relevance: number) {
  const profileCompleteness = business.gallery.length > 1 ? 1 : 0.72;
  const freshness = business.status === "open" ? 1 : 0.75;
  return (
    relevance * 0.32 +
    (business.distanceKm === undefined ? 0 : Math.max(0, 10 - business.distanceKm) * 0.14) +
    business.rating * 1.2 +
    Math.log10(business.reviewCount + 1) * 1.5 +
    (business.verified ? 2 : 0) +
    profileCompleteness +
    freshness
  );
}

export function searchBusinesses(filters: SearchFilters = {}) {
  const radius = filters.radius ?? 5;
  const query = filters.query?.trim() ?? "";
  const location = normalise(filters.location ?? "");

  const matches = businesses
    .map((business) => ({
      business,
      relevance: relevanceScore(business, query),
    }))
    .filter(({ business, relevance }) => {
      if (query && relevance === 0) return false;
      if (business.distanceKm !== undefined && business.distanceKm > radius) return false;
      if (
        location &&
        !normalise(`${business.locality} ${business.city} ${business.district} ${business.state}`).includes(location)
      ) {
        return false;
      }
      if (filters.rating && business.rating < filters.rating) return false;
      if (filters.openNow && business.status === "closed") return false;
      if (filters.verified && !business.verified) return false;
      if (filters.premium && !business.premium) return false;
      if (filters.offers && !business.offer) return false;
      if (filters.homeService && !business.services.some((service) => service.homeService)) return false;
      if (filters.delivery && business.products.length === 0) return false;
      if (filters.fastResponse && Number(business.responseTime.match(/\d+/)?.[0] ?? 999) > 15) return false;
      if (filters.price && business.priceRange !== filters.price) return false;
      if (filters.payment && !business.paymentMethods.includes(filters.payment)) return false;
      if (filters.language && !business.languages.includes(filters.language)) return false;
      if (filters.minYears && business.yearsInBusiness < filters.minYears) return false;
      return true;
    });

  return matches
    .sort((left, right) => {
      const sort = filters.sort ?? "recommended";
      if (sort === "nearest") {
        return (
          (left.business.distanceKm ?? Number.MAX_SAFE_INTEGER) -
          (right.business.distanceKm ?? Number.MAX_SAFE_INTEGER)
        );
      }
      if (sort === "rating") return right.business.rating - left.business.rating;
      if (sort === "reviews") return right.business.reviewCount - left.business.reviewCount;
      if (sort === "recent") return (right.business.joinedPlanAt ?? "").localeCompare(left.business.joinedPlanAt ?? "");
      if (sort === "relevant") return right.relevance - left.relevance;
      if (sort === "price-low") return left.business.priceRange.length - right.business.priceRange.length;
      if (sort === "price-high") return right.business.priceRange.length - left.business.priceRange.length;

      if (left.business.sponsored !== right.business.sponsored) {
        return Number(right.business.sponsored) - Number(left.business.sponsored);
      }
      if (left.business.bncStarLevel !== right.business.bncStarLevel) {
        return right.business.bncStarLevel - left.business.bncStarLevel;
      }
      const planStartDifference =
        new Date(left.business.joinedPlanAt ?? "9999-12-31").getTime() -
        new Date(right.business.joinedPlanAt ?? "9999-12-31").getTime();
      if (planStartDifference !== 0) {
        return planStartDifference;
      }
      return organicScore(right.business, right.relevance) - organicScore(left.business, left.relevance);
    })
    .map(({ business }) => business);
}

export function getBusinessBySlug(slug: string) {
  return businesses.find((business) => business.slug === slug);
}

export function getSearchSuggestions(query: string) {
  const normalisedQuery = normalise(query);
  if (!normalisedQuery) return [];

  return businesses
    .filter((business) => searchTextFor(business).includes(normalisedQuery))
    .slice(0, 5)
    .map((business) => ({
      id: business.id,
      label: business.name,
      meta: `${business.subcategory} · ${business.locality}`,
      href: `/business/${business.slug}`,
    }));
}
