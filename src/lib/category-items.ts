export type CategoryItemPageData = {
  slug: string;
  name: string;
  text: string;
  image: string;
  badge: string;
  highlights: string[];
};

export type CategoryItemGroup = {
  categorySlug: string;
  categoryName: string;
  description: string;
  items: CategoryItemPageData[];
};

export const categoryItemGroups: CategoryItemGroup[] = [
  {
    categorySlug: "grocery",
    categoryName: "Grocery",
    description: "Daily essentials, fresh produce, packaged goods, and local supermarket picks.",
    items: [
      item("vegetables", "Fresh Vegetables", "Daily vegetables for home kitchens and small shops.", "/mockup/im-vegetables.jpg", "Fresh", ["Leafy greens", "Daily stock", "Home packs"]),
      item("fruits", "Fruits", "Seasonal fruits and healthy snack picks.", "/mockup/im-grocery.jpg", "Seasonal", ["Bananas", "Apples", "Family packs"]),
      item("monthly-essentials", "Monthly Essentials", "Rice, oil, pulses, snacks, and pantry restock bundles.", "/mockup/im-supermarket.jpg", "Bundle", ["Rice and pulses", "Cooking oil", "Snacks"]),
      item("personal-care", "Personal Care", "Daily care, hygiene, and household supplies.", "/mockup/im-pharmacy.jpg", "Care", ["Soap", "Shampoo", "Hygiene"]),
      item("gift-packs", "Gift Packs", "Festival grocery and gift bundles.", "/mockup/im-gifts.jpg", "Festival", ["Gift boxes", "Sweets", "Dry goods"]),
      item("fresh-fish", "Fresh Fish", "Fresh fish and seafood picks from local sellers.", "/mockup/im-fish.jpg", "Local", ["Daily catch", "Cleaned packs", "Family portions"]),
    ],
  },
  {
    categorySlug: "restaurants",
    categoryName: "Restaurants",
    description: "Meals, snacks, family dining, and takeaway options near you.",
    items: [
      item("kerala-meals", "Kerala Meals", "Traditional lunch meals with curries and sides.", "/mockup/im-rest-kerala-meals.jpg", "Lunch", ["Meals", "Curries", "Rice"]),
      item("biryani", "Biryani", "Popular biryani packs for lunch, dinner, and family orders.", "/mockup/im-rest-biryani.jpg", "Popular", ["Chicken", "Beef", "Family pack"]),
      item("evening-snacks", "Evening Snacks", "Tea-time snacks, sweets, and quick bites.", "/mockup/im-rest-snacks.jpg", "Snacks", ["Tea snacks", "Sweets", "Takeaway"]),
      item("pizza-burger", "Pizza & Burgers", "Fast food combos, pizza offers, and burger meals.", "/mockup/im-rest-pizza-burger.jpg", "Combo", ["Pizza", "Burger", "Fries"]),
      item("seafood", "Seafood", "Fish meals and seafood specials.", "/mockup/im-rest-seafood.jpg", "Special", ["Fish fry", "Meals", "Takeaway"]),
      item("family-dining", "Family Dining", "Comfortable dine-in spaces for families and groups.", "/mockup/im-rest-family-dining.jpg", "Family", ["Dine-in", "Groups", "Reservations"]),
    ],
  },
  {
    categorySlug: "bakery",
    categoryName: "Bakery",
    description: "Cakes, sweets, snacks, and fresh bakery goods.",
    items: [
      item("cakes", "Cakes", "Birthday, fresh cream, and custom celebration cakes.", "/mockup/im-bakery.jpg", "Fresh", ["Birthday cakes", "Cream cakes", "Custom"]),
      item("sweets", "Sweets", "Local sweets, gift sweets, and assorted boxes.", "/mockup/im-bakery-sweets.jpg", "Sweet", ["Assorted", "Gift boxes", "Fresh"]),
      item("snack-boxes", "Snack Boxes", "Bakery snack boxes for evening and events.", "/mockup/im-bakery-snack-boxes.jpg", "Combo", ["Puffs", "Cutlets", "Tea snacks"]),
      item("bread-buns", "Bread & Buns", "Daily bread, buns, and breakfast bakery items.", "/mockup/im-bakery-bread-buns.jpg", "Daily", ["Bread", "Buns", "Breakfast"]),
      item("party-orders", "Party Orders", "Bulk bakery orders for events and celebrations.", "/mockup/im-bakery-party-orders.jpg", "Events", ["Bulk", "Custom", "Delivery"]),
    ],
  },
  {
    categorySlug: "tailors",
    categoryName: "Tailors",
    description: "Custom stitching, alterations, fabrics, uniforms, and occasion wear.",
    items: [
      item("formal-shirts", "Formal Shirts", "Custom formal shirts with fit and fabric options.", "/mockup/im-tailor-formal-shirts.jpg", "Custom", ["Office wear", "Measurements", "Fast delivery"]),
      item("suit-alteration", "Suit Alteration", "Alterations for suits, blazers, and trousers.", "/mockup/im-card_suit.jpg", "Alteration", ["Suits", "Blazers", "Trousers"]),
      item("fabric-selection", "Fabric Selection", "Premium fabrics for business and occasion wear.", "/mockup/im-card_fabric.jpg", "Fabric", ["Cotton", "Linen", "Premium"]),
      item("uniforms", "Uniforms", "School, office, and staff uniform stitching.", "/mockup/im-occ_tailor.jpg", "Bulk", ["School", "Office", "Staff"]),
      item("bridal-blouse", "Bridal Blouse", "Occasion blouse stitching and bridal fitting.", "/mockup/im-card_bridal.jpg", "Bridal", ["Blouse", "Embroidery", "Fitting"]),
    ],
  },
  {
    categorySlug: "beauty",
    categoryName: "Beauty",
    description: "Salon care, grooming, bridal styling, skincare, and spa services.",
    items: [
      item("haircut-styling", "Haircut & Styling", "Haircuts, styling, and grooming appointments.", "/mockup/im-beauty-haircut.png", "Style", ["Haircut", "Styling", "Grooming"]),
      item("hair-spa", "Hair Spa", "Hair spa, treatment, and care packages.", "/mockup/im-beauty-spa.png", "Spa", ["Treatment", "Care", "Relax"]),
      item("bridal-makeup", "Bridal Makeup", "Bridal and party makeup packages.", "/mockup/im-beauty-bridal.png", "Bridal", ["Makeup", "Styling", "Packages"]),
      item("facials", "Facials", "Skincare, cleanup, and facial services.", "/mockup/im-beauty-facial.png", "Skin", ["Cleanup", "Glow", "Care"]),
      item("party-styling", "Party Styling", "Event styling for parties and celebrations.", "/mockup/im-beauty-party.png", "Event", ["Hair", "Makeup", "Booking"]),
    ],
  },
  {
    categorySlug: "electronics",
    categoryName: "Electronics",
    description: "Mobiles, accessories, repairs, gadgets, and electronics support.",
    items: [
      item("mobiles", "Mobiles", "Latest mobile phones and exchange options.", "/mockup/im-electronics-new-mobiles.jpg", "Mobile", ["New phones", "Exchange", "Support"]),
      item("accessories", "Accessories", "Cases, chargers, cables, and screen guards.", "/mockup/im-electronics-new-accessories.jpg", "Accessory", ["Chargers", "Cases", "Cables"]),
      item("mobile-repair", "Mobile Repair", "Diagnostics, display repair, and quick mobile service.", "/mockup/im-electronics-new-mobile-repair.jpg", "Repair", ["Display", "Battery", "Service"]),
      item("electrical-items", "Electrical Items", "Switches, lights, and home electrical products.", "/mockup/im-electronics-new-electrical-items.jpg", "Electrical", ["Lights", "Switches", "Wiring"]),
      item("computer-service", "Computer Service", "Laptop, desktop, and computer support.", "/mockup/im-electronics-new-computer-service.jpg", "Service", ["Laptop", "Desktop", "Repair"]),
      item("gadgets", "Gadgets", "Smart gadgets, speakers, watches, and small electronics.", "/mockup/im-electronics-new-gadgets.jpg", "Gadget", ["Audio", "Smartwatch", "Devices"]),
    ],
  },
  {
    categorySlug: "home-services",
    categoryName: "Home Services",
    description: "Home repair, cleaning, electrical, plumbing, and maintenance visits.",
    items: [
      item("electrical-work", "Electrical Work", "Home electrical checks, fixes, and installations.", "/mockup/im-occ_electrician.jpg", "Electrical", ["Wiring", "Lights", "Repairs"]),
      item("plumbing", "Plumbing", "Pipe repair, tap replacement, and bathroom fixes.", "/mockup/im-home-plumbing.jpg", "Plumbing", ["Pipes", "Taps", "Leaks"]),
      item("deep-cleaning", "Deep Cleaning", "Home deep cleaning and move-in cleaning packages.", "/mockup/im-home-deep-cleaning.jpg", "Cleaning", ["Kitchen", "Bathroom", "Move-in"]),
      item("appliance-repair", "Appliance Repair", "Basic appliance repair and service visits.", "/mockup/im-home-appliance-repair.jpg", "Repair", ["Fans", "Mixers", "Small appliances"]),
      item("painting", "Painting", "Home painting and wall touch-up services.", "/mockup/im-home-painting.jpg", "Home", ["Walls", "Touch-up", "Rooms"]),
    ],
  },
  {
    categorySlug: "more",
    categoryName: "More",
    description: "Additional local categories and useful services around Kozhikode.",
    items: [
      item("pharmacy", "Pharmacy", "Medicines, wellness products, and health essentials.", "/mockup/im-pharmacy.jpg", "Health", ["Medicines", "Wellness", "Care"]),
      item("jewellery", "Jewellery", "Jewellery shops, gifts, and occasion wear.", "/mockup/im-jewellery.jpg", "Jewellery", ["Gold", "Gifts", "Occasion"]),
      item("furniture", "Furniture", "Home and office furniture picks.", "/mockup/im-furniture.jpg", "Home", ["Chairs", "Tables", "Storage"]),
      item("footwear", "Footwear", "Shoes, sandals, and daily footwear.", "/mockup/im-footwear.jpg", "Fashion", ["Shoes", "Sandals", "Daily wear"]),
      item("stationery", "Stationery", "School, office, and print stationery.", "/mockup/im-stationery.jpg", "Office", ["Books", "Print", "Office"]),
      item("hardware", "Hardware", "Hardware tools, fittings, and home repair materials.", "/mockup/im-hardware.jpg", "Tools", ["Tools", "Fittings", "Repair"]),
    ],
  },
];

export function getCategoryItems(categorySlug: string) {
  return categoryItemGroups.find((group) => group.categorySlug === categorySlug)?.items ?? [];
}

export function getCategoryItem(categorySlug: string, itemSlug: string) {
  return getCategoryItems(categorySlug).find((item) => item.slug === itemSlug) ?? null;
}

function item(
  slug: string,
  name: string,
  text: string,
  image: string,
  badge: string,
  highlights: string[],
): CategoryItemPageData {
  return { slug, name, text, image, badge, highlights };
}
