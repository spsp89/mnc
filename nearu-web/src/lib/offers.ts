export type TopOfferItem = {
  name: string;
  text: string;
  image: string;
  label: string;
};

export type TopOfferData = {
  slug: string;
  title: string;
  text: string;
  shop: string;
  code: string;
  image: string;
  gradient: string;
  category: string;
  validUntil: string;
  items: TopOfferItem[];
};

export const topOffers: TopOfferData[] = [
  {
    slug: "homefix-clean20",
    title: "20% Off",
    text: "On all home cleaning services",
    shop: "HomeFix Pro",
    code: "CLEAN20",
    image: "/mockup/im-occ_helper.jpg",
    gradient: "linear-gradient(135deg,#08713f,#0b5636)",
    category: "Home Services",
    validUntil: "This week",
    items: [
      {
        name: "Deep cleaning",
        text: "Full home cleaning for kitchens, bathrooms, and living spaces.",
        image: "/mockup/im-occ_helper.jpg",
        label: "20% off",
      },
      {
        name: "Electrical visit",
        text: "Home electrical checks and small repairs.",
        image: "/mockup/im-occ_electrician.jpg",
        label: "Service",
      },
      {
        name: "Maintenance visit",
        text: "Quick maintenance support for homes and small shops.",
        image: "/mockup/im-electrical.jpg",
        label: "Home care",
      },
    ],
  },
  {
    slug: "maya-salon-spa599",
    title: "Rs599 Offer",
    text: "Hair Spa + Haircut Combo",
    shop: "Maya Beauty Salon",
    code: "SPA599",
    image: "/mockup/im-occ_beauty.jpg",
    gradient: "linear-gradient(135deg,#12459b,#092b70)",
    category: "Beauty",
    validUntil: "Limited slots",
    items: [
      {
        name: "Hair spa",
        text: "Relaxing hair spa appointment with salon care.",
        image: "/mockup/im-occ_beauty.jpg",
        label: "Rs599",
      },
      {
        name: "Haircut combo",
        text: "Haircut bundled with grooming support.",
        image: "/mockup/im-beauty.jpg",
        label: "Combo",
      },
      {
        name: "Bridal styling",
        text: "Party and bridal styling appointments.",
        image: "/mockup/im-card_bridal.jpg",
        label: "Add-on",
      },
    ],
  },
  {
    slug: "fresh-basket-veg15",
    title: "15% Off",
    text: "On all fresh vegetables",
    shop: "Fresh Basket",
    code: "VEG15",
    image: "/mockup/im-vegetables.jpg",
    gradient: "linear-gradient(135deg,#cb790b,#8a4d04)",
    category: "Grocery",
    validUntil: "Today",
    items: [
      {
        name: "Fresh vegetables",
        text: "Daily vegetables for home kitchens.",
        image: "/mockup/im-vegetables.jpg",
        label: "15% off",
      },
      {
        name: "Grocery pack",
        text: "Monthly essentials and pantry restock items.",
        image: "/mockup/im-grocery.jpg",
        label: "Bundle",
      },
      {
        name: "Supermarket shelf",
        text: "Packaged snacks, staples, and daily goods.",
        image: "/mockup/im-supermarket.jpg",
        label: "Essentials",
      },
    ],
  },
  {
    slug: "spice-garden-pizza1",
    title: "B1G1",
    text: "Buy 1 Get 1 On Pizzas",
    shop: "Spice Garden",
    code: "PIZZA1",
    image: "/mockup/im-restaurant.jpg",
    gradient: "linear-gradient(135deg,#08713f,#064d2e)",
    category: "Restaurant",
    validUntil: "Tonight",
    items: [
      {
        name: "Pizza combo",
        text: "Buy one selected pizza and get one free.",
        image: "/mockup/im-restaurant.jpg",
        label: "B1G1",
      },
      {
        name: "Evening snacks",
        text: "Snack add-ons for dine-in and takeaway.",
        image: "/mockup/im-sweets.jpg",
        label: "Add-on",
      },
    ],
  },
  {
    slug: "quick-mart-pick21",
    title: "Festival Offer",
    text: "Up to 30% off on selected items",
    shop: "Quick Mart",
    code: "PICK21",
    image: "/mockup/im-gifts.jpg",
    gradient: "linear-gradient(135deg,#5825bb,#291986)",
    category: "Grocery",
    validUntil: "Festival week",
    items: [
      {
        name: "Gift packs",
        text: "Festival gift bundles and family packs.",
        image: "/mockup/im-gifts.jpg",
        label: "30% off",
      },
      {
        name: "Daily essentials",
        text: "Groceries and household supplies.",
        image: "/mockup/im-supermarket.jpg",
        label: "Selected",
      },
      {
        name: "Fresh produce",
        text: "Vegetables and daily kitchen items.",
        image: "/mockup/im-vegetables.jpg",
        label: "Fresh",
      },
    ],
  },
];

export function getOfferBySlug(slug: string) {
  return topOffers.find((offer) => offer.slug === slug);
}
