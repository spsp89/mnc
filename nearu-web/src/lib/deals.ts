export type DealItem = {
  name: string;
  text: string;
  image: string;
  price?: string;
};

export type SpotlightDealData = {
  slug: string;
  badge: string;
  badgeColor: string;
  title: string;
  text: string;
  shop: string;
  image: string;
  gradient: string;
  category: string;
  validUntil: string;
  items: DealItem[];
};

export const spotlightDeals: SpotlightDealData[] = [
  {
    slug: "weekend-bakery-special",
    badge: "20% OFF",
    badgeColor: "#25a451",
    title: "Weekend Special",
    text: "Get 20% off on fresh bakery items for the weekend.",
    shop: "Sweet Bakery",
    image: "/mockup/im-bakery.jpg",
    gradient: "linear-gradient(135deg,#edfbea,#ffffff 58%,#e9f8ea)",
    category: "Bakery",
    validUntil: "This weekend",
    items: [
      {
        name: "Fresh cream cake",
        text: "Soft sponge cake with fresh cream topping.",
        image: "/mockup/im-bakery.jpg",
        price: "20% off",
      },
      {
        name: "Assorted sweets",
        text: "Mixed sweets for family packs and gifting.",
        image: "/mockup/im-sweets.jpg",
        price: "From Rs 149",
      },
      {
        name: "Snack box",
        text: "Evening bakery snacks packed fresh.",
        image: "/mockup/im-gifts.jpg",
        price: "Combo offer",
      },
    ],
  },
  {
    slug: "city-care-health-checkup",
    badge: "Rs599",
    badgeColor: "#2565c7",
    title: "Limited Time Offer",
    text: "Full body health checkup at just Rs599.",
    shop: "City Care Lab",
    image: "/mockup/im-pharmacy.jpg",
    gradient: "linear-gradient(135deg,#eef5ff,#ffffff 58%,#e7f0ff)",
    category: "Health",
    validUntil: "Limited slots",
    items: [
      {
        name: "Basic health check",
        text: "Essential blood and wellness screening.",
        image: "/mockup/im-pharmacy.jpg",
        price: "Rs599",
      },
      {
        name: "Family appointment",
        text: "Book multiple checkups in one visit.",
        image: "/mockup/im-occ_reception.jpg",
        price: "Priority slots",
      },
    ],
  },
  {
    slug: "royale-tailors-fashion-fiesta",
    badge: "15% OFF",
    badgeColor: "#f3a51a",
    title: "Fashion Fiesta",
    text: "Flat 15% off on selected men's wear and tailoring services.",
    shop: "Royale Tailors",
    image: "/mockup/im-card_suit.jpg",
    gradient: "linear-gradient(135deg,#fff2d8,#ffffff 58%,#fff0ce)",
    category: "Tailors",
    validUntil: "Festival week",
    items: [
      {
        name: "Formal shirt stitching",
        text: "Custom fit formal shirts with quick delivery.",
        image: "/mockup/im-tailor.jpg",
        price: "15% off",
      },
      {
        name: "Suit alteration",
        text: "Alterations for suits, blazers and trousers.",
        image: "/mockup/im-card_suit.jpg",
        price: "Save more",
      },
      {
        name: "Fabric selection",
        text: "Choose from premium fabric collections.",
        image: "/mockup/im-card_fabric.jpg",
        price: "Bundle offer",
      },
    ],
  },
  {
    slug: "alukky-hotel-burger-fries",
    badge: "B1G1",
    badgeColor: "#7242b8",
    title: "Buy 1 Get 1",
    text: "Buy one and get one free on selected burgers and fries.",
    shop: "ALUKKY Hotel",
    image: "/mockup/im-restaurant.jpg",
    gradient: "linear-gradient(135deg,#f4eaff,#ffffff 58%,#eadcff)",
    category: "Restaurant",
    validUntil: "Today only",
    items: [
      {
        name: "Burger combo",
        text: "Selected burger combo with free second item.",
        image: "/mockup/im-restaurant.jpg",
        price: "B1G1",
      },
      {
        name: "Fries pack",
        text: "Crispy fries add-on for dine-in and takeaway.",
        image: "/mockup/im-fish.jpg",
        price: "Combo",
      },
    ],
  },
];

export function getDealBySlug(slug: string) {
  return spotlightDeals.find((deal) => deal.slug === slug);
}
