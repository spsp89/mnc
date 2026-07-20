import type { CatalogBusinessData } from "@/lib/catalog";

export type FeaturedShopItem = {
  name: string;
  text: string;
  image: string;
  label: string;
};

const featuredShopItems: Record<string, FeaturedShopItem[]> = {
  "spice-garden": [
    {
      name: "Kerala meals",
      text: "Lunch meals with curries, rice, sides, and daily specials.",
      image: "/mockup/im-restaurant.jpg",
      label: "Lunch",
    },
    {
      name: "Evening snacks",
      text: "Fresh snacks for dine-in and takeaway orders.",
      image: "/mockup/im-sweets.jpg",
      label: "Snacks",
    },
    {
      name: "Family biryani",
      text: "Weekend biryani packs for families and small groups.",
      image: "/mockup/im-fish.jpg",
      label: "Popular",
    },
  ],
  "royale-tailors": [
    {
      name: "Formal shirts",
      text: "Custom formal shirts with fit and fabric options.",
      image: "/mockup/im-tailor.jpg",
      label: "Custom",
    },
    {
      name: "Suit alterations",
      text: "Alterations for suits, trousers, and blazers.",
      image: "/mockup/im-card_suit.jpg",
      label: "Alteration",
    },
    {
      name: "Fabric collection",
      text: "Premium fabric selection for business and occasion wear.",
      image: "/mockup/im-card_fabric.jpg",
      label: "Fabric",
    },
  ],
  "fresh-basket": [
    {
      name: "Fresh vegetables",
      text: "Daily vegetables sourced for home kitchens and small shops.",
      image: "/mockup/im-vegetables.jpg",
      label: "Fresh",
    },
    {
      name: "Grocery packs",
      text: "Monthly essentials and pantry restock bundles.",
      image: "/mockup/im-grocery.jpg",
      label: "Bundle",
    },
    {
      name: "Supermarket shelf",
      text: "Packaged snacks, staples, and daily household items.",
      image: "/mockup/im-supermarket.jpg",
      label: "Essentials",
    },
  ],
  "maya-beauty-salon": [
    {
      name: "Hair styling",
      text: "Haircuts, styling, and appointment-based grooming.",
      image: "/mockup/im-beauty.jpg",
      label: "Beauty",
    },
    {
      name: "Bridal makeup",
      text: "Bridal and party styling packages.",
      image: "/mockup/im-card_bridal.jpg",
      label: "Bridal",
    },
    {
      name: "Salon care",
      text: "Hair spa, skincare, and grooming services.",
      image: "/mockup/im-occ_beauty.jpg",
      label: "Care",
    },
  ],
  "tech-hub-mobile": [
    {
      name: "Mobiles",
      text: "Latest phones, accessories, and exchange support.",
      image: "/mockup/im-mobile.jpg",
      label: "Mobile",
    },
    {
      name: "Accessories",
      text: "Chargers, cables, cases, and screen guards.",
      image: "/mockup/im-electronics.jpg",
      label: "Accessory",
    },
    {
      name: "Quick repairs",
      text: "Mobile diagnostics and repair desk support.",
      image: "/mockup/im-occ_mobiletech.jpg",
      label: "Repair",
    },
  ],
};

const fallbackByCategory: Record<string, FeaturedShopItem[]> = {
  restaurants: featuredShopItems["spice-garden"],
  tailors: featuredShopItems["royale-tailors"],
  grocery: featuredShopItems["fresh-basket"],
  beauty: featuredShopItems["maya-beauty-salon"],
  electronics: featuredShopItems["tech-hub-mobile"],
  "home-services": [
    {
      name: "Home repair visit",
      text: "Electrical, plumbing, and maintenance bookings.",
      image: "/mockup/im-occ_helper.jpg",
      label: "Repair",
    },
    {
      name: "Cleaning package",
      text: "Deep cleaning and move-in cleaning options.",
      image: "/mockup/im-occ_electrician.jpg",
      label: "Service",
    },
  ],
};

export function itemsForFeaturedBusiness(business: CatalogBusinessData): FeaturedShopItem[] {
  return (
    featuredShopItems[business.slug] ??
    fallbackByCategory[business.category.slug] ??
    [
      {
        name: business.name,
        text: business.description || business.subtitle,
        image: imageForBusiness(business),
        label: business.category.name,
      },
      {
        name: "Shop highlight",
        text: `Popular picks and services from ${business.name}.`,
        image: imageForBusiness(business),
        label: "Featured",
      },
    ]
  ).slice(0, 3);
}

export function imageForBusiness(business: CatalogBusinessData) {
  const primary =
    business.images.find((image) => image.role === "thumbnail") ??
    business.images.find((image) => image.role === "cover") ??
    business.images.find((image) => image.isPrimary) ??
    business.images[0];

  return primary?.url || "/mockup/im-restaurant.jpg";
}
