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
      item("fruits", "Fresh Fruits", "Seasonal fruits and healthy snack picks.", "/mockup/im-grocery.jpg", "Seasonal", ["Fresh fruits", "Dry fruits", "Seasonal offers"]),
      item("fresh-fish", "Fresh Fish", "Fresh fish and seafood picks from local sellers.", "/mockup/im-fish.jpg", "Local", ["Daily catch", "Sea fish", "Cleaned packs", "Family portions", "Home delivery"]),
      item("fresh-meats", "Fresh Meats", "Clean chicken, mutton, and meat packs from nearby shops.", "/mockup/im-meats.jpg", "Meat", ["Chicken", "Mutton", "Beef cuts", "Fresh packs"]),
      item("monthly-essentials", "Monthly Essentials", "Rice, oil, pulses, snacks, and pantry restock bundles.", "/mockup/im-supermarket.jpg", "Bundle", ["Rice and pulses", "Cooking oil", "Snacks"]),
      item("personal-care", "Personal Care", "Daily care, hygiene, and household supplies.", "/mockup/im-pharmacy.jpg", "Care", ["Soap", "Shampoo", "Hygiene"]),
      item("gift-packs", "Gift Packs", "Festival grocery and gift bundles.", "/mockup/im-gifts.jpg", "Festival", ["Gift boxes", "Sweets", "Dry goods"]),
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
      item("fast-food", "Fast Food", "Al-Faham, shawarma, grills, and quick combo plates.", "/mockup/im-rest-al-faham.png", "Grill", ["Al-Faham", "Shawarma", "Grilled chicken", "Broast", "Wraps"]),
      item("pizza-burger", "Pizza & Burgers", "Fast food combos, pizza offers, and burger meals.", "/mockup/im-rest-pizza-burger.jpg", "Combo", ["Pizza", "Burger", "Fries"]),
      item("seafood", "Seafood", "Fish meals and seafood specials.", "/mockup/im-rest-seafood.jpg", "Special", ["Fish fry", "Meals", "Takeaway"]),
      item("family-dining", "Family Dining", "Comfortable dine-in spaces for families and groups.", "/mockup/im-rest-family-dining.jpg", "Family", ["Dine-in", "Groups", "Reservations", "Private room", "Family offers"]),
    ],
  },
  {
    categorySlug: "bakery-sweets",
    categoryName: "Bakery & Sweets",
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
      item("laptop", "Laptop", "New laptops, used laptops, exchange, and upgrade options.", "/mockup/gen-electronics-laptop.jpg", "Laptop", ["New laptops", "Used laptops", "Exchange", "Student laptops", "Business laptops"]),
      item("computers", "Computers", "Desktop computers, custom PC builds, and computer accessories.", "/mockup/gen-electronics-computers.jpg", "Computer", ["Desktop", "Custom PC", "Monitor", "CPU", "Office systems"]),
      item("electronic-appliances", "Electronic Appliances", "TV, refrigerator, AC, fans, and home appliance products.", "/mockup/gen-electronics-appliances.jpg", "Home", ["TV", "Refrigerator", "AC", "Fans", "Appliances"]),
      item("accessories-peripherals", "Accessories / Peripherals", "Modems, cables, UPS, CPU, webcam, storage, mouse, and keyboard.", "/mockup/im-electronics-accessories.jpg", "Peripheral", ["Modem", "Cables", "UPS", "CPU", "Webcam", "Storage"]),
    ],
  },
  {
    categorySlug: "mobile",
    categoryName: "Mobile",
    description: "Mobile phones, accessories, repair, exchange, EMI, and support.",
    items: [
      item("mobiles", "Mobiles", "Latest mobile phones and exchange options.", "/mockup/cat-mobile-mobiles-attractive.png", "Mobile", ["New phones", "Exchange", "Support", "Used phones", "EMI options"]),
      item("accessories", "Accessories", "Cases, chargers, cables, and screen guards.", "/mockup/cat-mobile-accessories-attractive.png", "Accessory", ["Chargers", "Cases", "Cables", "Earphones", "Screen guards"]),
      item("mobile-repair", "Mobile Repair", "Diagnostics, display repair, and quick mobile service.", "/mockup/cat-mobile-repair-attractive.png", "Repair", ["Display", "Battery", "Service", "Water damage", "Software issues"]),
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
    categorySlug: "pharmacy",
    categoryName: "Pharmacy",
    description: "Medicines, wellness products, monthly refills, and health essentials.",
    items: [
      item("medicines", "Medicines", "Common medicines, prescription refills, and daily health needs.", "/mockup/im-pharmacy.jpg", "Health", ["Medicines", "Refills", "Care"]),
      item("wellness-products", "Wellness Products", "Vitamins, supplements, and wellness essentials.", "/mockup/subcategory/sc-wellness-products.jpg", "Wellness", ["Vitamins", "Supplements", "Health"]),
      item("personal-care", "Personal Care", "Hygiene, grooming, and personal care products.", "/mockup/products/pc-real-soap.png", "Care", ["Soap", "Shampoo", "Hygiene"]),
      item("clinic-support", "Clinic Support", "Nearby clinic and doctor support options.", "/mockup/subcategory/sc-clinic-reception.jpg", "Clinic", ["Consultation", "Support", "Nearby"]),
    ],
  },
  {
    categorySlug: "gifts-stationery",
    categoryName: "Gifts & Stationery",
    description: "Gifts, stationery, school supplies, greeting cards, and celebration packs.",
    items: [
      item("stationery", "Stationery", "School, office, and print stationery.", "/mockup/im-stationery.jpg", "Office", ["Books", "Print", "Office"]),
      item("gift-boxes", "Gift Boxes", "Festival gifts, gift boxes, and celebration bundles.", "/mockup/im-gifts.jpg", "Gift", ["Boxes", "Celebration", "Festival"]),
      item("greeting-cards", "Greeting Cards", "Greeting cards and small occasion gifts.", "/mockup/products/gift-real-greeting-card.png", "Card", ["Cards", "Occasion", "Gifts"]),
      item("sweet-hampers", "Sweet Hampers", "Sweets and dry fruit hampers for gifting.", "/mockup/subcategory/sc-sweet-gift-boxes-real.jpg", "Hamper", ["Sweets", "Dry fruits", "Gift packs"]),
    ],
  },
  {
    categorySlug: "fashion",
    categoryName: "Fashion",
    description: "Men, women, kids, footwear, bags, jewellery, and occasion wear.",
    items: [
      item("men", "Men", "Men clothing, formal wear, and daily fashion picks.", "/mockup/gen-fashion-men.jpg", "Men", ["Shirts", "T-shirts", "Jeans", "Pants", "Ethnic wear", "Formal wear"]),
      item("women", "Women", "Women clothing, jewellery, beauty fashion, and occasion wear.", "/mockup/gen-fashion-women.jpg", "Women", ["Kurtis", "Sarees", "Ladies jeans", "Tops", "Leggings", "Party wear", "Bags", "Jewellery"]),
      item("footwear", "Footwear", "Men, women, and kids footwear for daily and occasion wear.", "/mockup/im-footwear.jpg", "Shoes", ["Men footwear", "Women footwear", "Kids footwear", "Sandals", "Sneakers"]),
      item("kids", "Kids", "Kids clothing, footwear, school wear, and daily essentials.", "/mockup/gen-fashion-kids.jpg", "Kids", ["Kids wear", "School wear", "Shoes", "Party wear", "Baby items"]),
    ],
  },
  {
    categorySlug: "footwear",
    categoryName: "Footwear",
    description: "Formal shoes, sandals, sneakers, heels, flats, and kids footwear.",
    items: [
      item("men-footwear", "Men Footwear", "Formal shoes, sandals, sneakers, and daily footwear for men.", "/mockup/im-footwear.jpg", "Men", ["Formal shoes", "Sandals", "Sneakers", "Daily wear", "Sports shoes"]),
      item("women-footwear", "Women Footwear", "Heels, sandals, flats, and occasion footwear for women.", "/mockup/gen-fashion-women.jpg", "Women", ["Heels", "Sandals", "Flats", "Party wear", "Daily wear"]),
      item("kids-footwear", "Kids Footwear", "School shoes, sandals, sneakers, and soft footwear for kids.", "/mockup/gen-fashion-kids.jpg", "Kids", ["School shoes", "Sandals", "Sneakers", "Soft shoes", "Sports shoes"]),
    ],
  },
  {
    categorySlug: "accessories",
    categoryName: "Accessories",
    description: "Watches, sunglasses, spectacles, chains, bracelets, and daily fashion accessories.",
    items: [
      item("watches", "Watches", "Analog, smart, sports, and daily wear watches.", "/mockup/products/accessory-real-watches.png", "Watch", ["Analog watches", "Smart watches", "Sports watches", "Leather strap"]),
      item("sunglasses", "Sunglasses", "Aviator, wayfarer, polarized, and daily sunglasses.", "/mockup/products/accessory-real-eyewear.png", "Shades", ["Aviator sunglasses", "Wayfarer sunglasses", "Polarized sunglasses", "UV sunglasses"]),
      item("spectacles", "Spectacles", "Reading glasses, computer glasses, frames, and lenses.", "/mockup/products/accessory-real-eyewear.png", "Specs", ["Reading glasses", "Computer glasses", "Optical frames", "Blue cut lenses"]),
      item("chains", "Chains", "Daily chains, pendant chains, and plated chain styles.", "/mockup/products/accessory-real-chains.png", "Chain", ["Gold plated chains", "Silver chains", "Pendant chains", "Daily wear chains"]),
      item("bracelets", "Bracelets", "Metal, leather, charm, and daily bracelets.", "/mockup/products/accessory-real-bracelets.png", "Bracelet", ["Gold bracelets", "Silver bracelets", "Leather bracelets", "Charm bracelets"]),
    ],
  },
  {
    categorySlug: "auto-accessories",
    categoryName: "Auto Accessories",
    description: "Riding helmets, bike accessories, car accessories, and safety essentials.",
    items: [
      item("riding-helmets", "Riding Helmets", "ISI helmets, full-face helmets, and riding safety gear.", "/mockup/im-electronics-accessories.jpg", "Helmet", ["Helmet", "Full face", "Half face", "Riding gear", "Safety"]),
      item("bike-accessories", "Bike Accessories", "Bike covers, mirrors, locks, lights, and daily accessories.", "/mockup/im-electronics-new-accessories.jpg", "Bike", ["Covers", "Locks", "Mirrors", "Lights", "Phone holders"]),
      item("car-accessories", "Car Accessories", "Seat covers, mats, chargers, perfumes, and car care items.", "/mockup/im-card_machine.jpg", "Car", ["Seat covers", "Mats", "Chargers", "Perfume", "Car care"]),
    ],
  },
  {
    categorySlug: "more",
    categoryName: "More",
    description: "Additional local categories and useful services around Kozhikode.",
    items: [
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

export function getCategoryItemGroup(categorySlug: string) {
  return categoryItemGroups.find((group) => group.categorySlug === categorySlug) ?? null;
}

export function getCategoryItem(categorySlug: string, itemSlug: string) {
  return getCategoryItems(categorySlug).find((item) => item.slug === itemSlug) ?? null;
}

export type CategoryProductData = {
  name: string;
  image: string;
  badge: string;
  code: string;
};

export function getCategoryItemProducts(
  categoryName: string,
  item: CategoryItemPageData,
): CategoryProductData[] {
  const productNames = productsForSubcategory(categoryName, item.name, item.highlights);
  return productNames.map((name) => ({
    name,
    image: productImageFor(name, categoryName, item.image),
    badge: discountForProduct(name, categoryName),
    code: codeForProduct(name, item.badge),
  }));
}

export function getSubcategoryProducts(
  categoryName: string,
  subcategoryName: string,
  fallbackImage = "/mockup/im-supermarket.jpg",
): CategoryProductData[] {
  return productsForSubcategory(categoryName, subcategoryName, []).map((name) => ({
    name,
    image: productImageFor(name, categoryName, fallbackImage),
    badge: discountForProduct(name, categoryName),
    code: codeForProduct(name, "Today"),
  }));
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

function productsForSubcategory(categoryName: string, subcategory: string, fallbackTags: string[]) {
  const key = normalize(`${categoryName} ${subcategory}`);
  const subKey = normalize(subcategory);

  const exact: Record<string, string[]> = {
    freshvegetables: ["Tomato", "Potato", "Onion", "Carrot", "Spinach", "Coriander", "Mint leaves", "Sweet Potato", "Beetroot", "Ginger", "Garlic", "Cucumber", "Capsicum", "Lady Finger", "Green Beans", "Cauliflower", "Broccoli", "Cabbage", "Pumpkin", "Mushrooms"],
    freshfruits: ["Nendran Bananas", "Red Apples", "Fresh Oranges", "Ripe Mangoes", "Pineapple", "Papaya", "Watermelon", "Black Grapes", "Guava", "Jackfruit"],
    freshfish: ["Daily Catch", "Sea Fish", "Cleaned Packs", "Family Portions", "Home Delivery"],
    freshmeats: ["Chicken", "Mutton", "Beef Cuts", "Fresh Packs"],
    monthlyessentials: ["Rice", "Dals & Pulses", "Oils", "Flour & Atta", "Sugar & Jaggery", "Tea & Coffee", "Spices & Masala", "Snacks", "Noodles & Pasta", "Biscuits & Cookies", "Salt", "Cleaning Essentials"],
    personalcare: ["Soap", "Shampoo", "Toothpaste", "Sanitizer", "Face Wash", "Detergent", "Tissue", "Baby Care", "Body Lotion", "Hair Oil", "Deodorant"],
    giftpacks: ["Gift Boxes", "Sweet Hampers", "Festival Sweets", "Dry Fruit Box", "Chocolate Pack", "Toy Gift", "Greeting Cards", "Stationery Gift"],
    keralameals: ["Kerala Meals Combo", "Mini Meals", "Parcel Meals", "Special Sadya Meals", "Chapati Meals Combo", "Veg Kerala Meals", "Veg Mini Meals", "Veg Sadya Meals", "Curd Rice Meals", "Ghee Rice Veg Meals"],
    biryani: ["Malabar Dum Biryani", "Thalassery Chicken Biryani", "Kozhikode Chicken Biryani", "Chicken Biryani"],
    eveningsnacks: ["Chicken Cutlet", "Banana Fry", "Samosa Plate", "Uzhunnu Vada"],
    fastfood: ["Al-Faham Quarter", "Al-Faham Half", "Chicken Shawarma", "Grilled Chicken Plate"],
    pizzaburgers: ["Chicken Burger", "Veg Burger", "Cheese Burger", "Cheese Pizza", "Chicken Pizza", "Veg Pizza"],
    seafood: ["Fish Fry Meals", "Prawns Roast", "Seafood Platter", "Karimeen Fry", "Squid Roast", "Fish Curry Meals"],
    familydining: ["Family Meals Combo", "Family Biryani Pack", "Dine-in Dinner Combo", "Private Room Meals", "Family Grill Platter", "Kids Meal Combo"],
    laptop: ["UltraBook Pro 14", "StudentBook Air 13", "BusinessBook 15", "GamingBook RTX 16", "CreatorBook OLED 14", "BudgetBook 15"],
    computers: ["Office Desktop", "Custom Gaming PC", "All-in-One PC", "Mini PC", "27 Inch Monitor", "Workstation PC"],
    electronicappliances: ["Smart TV", "Double Door Refrigerator", "Split AC", "Front Load Washing Machine", "Ceiling Fan", "Microwave Oven"],
    accessoriesperipherals: ["WiFi Modem", "Data Cables", "UPS Backup", "CPU Processor", "HD Webcam", "Storage Device", "Wireless Mouse", "Mechanical Keyboard"],
    mobiles: ["New phones", "Used phones", "Exchange", "EMI options", "Support"],
    mobilerepair: ["Display Repair", "Battery Service", "Water Damage Repair", "Software Issues", "Charging Port Repair"],
    men: ["Classic Cotton Shirt", "Urban Slim Fit Shirt", "Linen Casual Shirt", "Premium Cotton Shirt", "Slim Fit Jeans", "Office Formal Pants", "Cotton Kurta Set"],
    women: ["Cotton Kurti", "Printed Kurti", "Silk Saree", "Kerala Saree", "Ladies Slim Fit Jeans", "Ladies Top Casual", "Cotton Leggings", "Party Dress", "Hand Bag", "Daily Jewellery"],
    footwear: ["Formal Shoes", "Sports Shoes", "Daily Sandals", "Casual Sneakers", "Heels", "Flats", "School Shoes"],
    kids: ["Kids T-shirt Set", "Kids Dress", "Kids Shorts Set", "Kids Ethnic Wear", "School Uniform Set", "Baby Dress Set"],
    watches: ["Classic Analog Watch", "Gold Analog Watch", "Minimal Analog Watch", "Smart Watch", "Sports Watch", "Leather Strap Watch"],
    sunglasses: ["Aviator Sunglasses", "Wayfarer Sunglasses", "Polarized Sunglasses", "UV Protection Sunglasses"],
    spectacles: ["Reading Glasses", "Computer Glasses", "Optical Frames", "Blue Cut Lenses"],
    chains: ["Gold Plated Chain", "Silver Chain", "Pendant Chain", "Daily Wear Chain"],
    bracelets: ["Gold Bracelet", "Silver Bracelet", "Leather Bracelet", "Charm Bracelet"],
  };

  const direct = exact[subKey];
  if (direct) return direct;

  if (key.includes("rice")) return ["Matta Rice", "Jaya Rice", "Sona Masoori Rice", "Basmati Rice", "Raw Rice", "Idli Rice", "Ponni Rice", "Jeera Rice"];
  if (key.includes("dal") || key.includes("pulse")) return ["Toor Dal", "Chana Dal", "Moong Dal", "Urad Dal", "Masoor Dal", "Green Gram", "Black Chana", "Rajma"];
  if (key.includes("oil")) return ["Cooking Oil", "Sunflower Oil", "Coconut Oil", "Groundnut Oil", "Mustard Oil", "Gingelly Oil", "Rice Bran Oil", "Olive Oil"];
  if (key.includes("flour") || key.includes("atta")) return ["Whole Wheat Atta", "Chakki Fresh Atta", "Maida", "Rava", "Besan", "Rice Flour", "Appam Podi", "Puttu Podi"];
  if (key.includes("spice") || key.includes("masala")) return ["Turmeric Powder", "Chilli Powder", "Coriander Powder", "Black Pepper", "Garam Masala", "Chicken Masala", "Sambar Powder", "Cumin Seeds", "Mustard Seeds", "Cardamom"];
  if (key.includes("soap")) return ["Herbal Neem Soap", "Sandal Soap", "Aloe Vera Soap", "Glycerin Soap"];
  if (key.includes("shampoo")) return ["Anti Dandruff Shampoo", "Coconut Milk Shampoo", "Herbal Shampoo", "Kids Shampoo"];
  if (key.includes("toothpaste")) return ["Herbal Toothpaste", "Fresh Mint Toothpaste", "Sensitive Toothpaste", "Kids Toothpaste"];
  if (key.includes("sanitizer")) return ["Hand Sanitizer Gel", "Pocket Sanitizer", "Sanitizer Spray", "Aloe Sanitizer"];
  if (key.includes("shirt")) return ["Classic Cotton Shirt", "Urban Slim Fit Shirt", "Linen Casual Shirt", "Premium Cotton Shirt"];
  if (key.includes("saree")) return ["Silk Saree", "Cotton Saree", "Kerala Saree", "Designer Saree"];
  if (key.includes("kurti")) return ["Cotton Kurti", "Printed Kurti", "Rayon Kurti", "Festive Kurti"];
  if (key.includes("shoe") || key.includes("sandal") || key.includes("sneaker")) return ["Formal Shoes", "Sports Shoes", "Daily Sandals", "Casual Sneakers"];

  return fallbackTags.length ? fallbackTags : [subcategory, "Best option", "Popular choice", "Nearby available"];
}

function productImageFor(name: string, categoryName: string, fallbackImage: string) {
  const key = normalize(name);
  const imageByKey: Record<string, string> = {
    mattarice: "/mockup/products/rice-real-matta.png",
    jayarice: "/mockup/products/rice-real-jaya.png",
    sonamasooririce: "/mockup/products/rice-real-sona-masoori.png",
    basmatirice: "/mockup/products/rice-real-basmati.png",
    rawrice: "/mockup/products/rice-real-raw.png",
    idlirice: "/mockup/products/rice-real-idli.png",
    ponnirice: "/mockup/products/rice-real-ponni.png",
    jeerarice: "/mockup/products/rice-real-jeera.png",
    tomato: "/mockup/products/veg-tomato.jpg",
    potato: "/mockup/products/veg-potato.jpg",
    onion: "/mockup/products/veg-onion.jpg",
    carrot: "/mockup/products/veg-carrot.jpg",
    spinach: "/mockup/products/veg-spinach.jpg",
    coriander: "/mockup/products/veg-coriander.jpg",
    mintleaves: "/mockup/products/veg-mint.jpg",
    beetroot: "/mockup/products/veg-beetroot.jpg",
    ginger: "/mockup/products/veg-ginger.png",
    garlic: "/mockup/products/veg-garlic.png",
    cucumber: "/mockup/products/veg-cucumber.jpg",
    capsicum: "/mockup/products/veg-capsicum.jpg",
    ladyfinger: "/mockup/products/veg-okra.jpg",
    greenbeans: "/mockup/products/veg-green-beans.jpg",
    cauliflower: "/mockup/products/veg-cauliflower.jpg",
    broccoli: "/mockup/products/veg-broccoli.jpg",
    cabbage: "/mockup/products/veg-cabbage.jpg",
    pumpkin: "/mockup/products/veg-pumpkin.jpg",
    mushrooms: "/mockup/products/veg-mushroom.png",
    toordal: "/mockup/products/dal-real-toor.png",
    chanadal: "/mockup/products/dal-real-chana.png",
    moongdal: "/mockup/products/dal-real-moong.png",
    uraddal: "/mockup/products/dal-real-urad.png",
    masoordin: "/mockup/products/dal-real-masoor.png",
    masoormal: "/mockup/products/dal-real-masoor.png",
    masoordal: "/mockup/products/dal-real-masoor.png",
    cookingoil: "/mockup/products/oil-real-cooking.png",
    sunfloweroil: "/mockup/products/oil-real-sunflower.png",
    coconutoil: "/mockup/products/oil-real-coconut.png",
    groundnutoil: "/mockup/products/oil-real-groundnut.png",
    soap: "/mockup/products/pc-real-soap.png",
    shampoo: "/mockup/products/pc-real-shampoo.png",
    toothpaste: "/mockup/products/pc-real-toothpaste.png",
    sanitizer: "/mockup/products/pc-real-sanitizer.png",
    giftboxes: "/mockup/products/gift-real-box.png",
    sweethampers: "/mockup/products/gift-real-sweet-hamper.png",
    festivalsweets: "/mockup/products/gift-real-festival-sweets.png",
    dryfruitbox: "/mockup/products/gift-real-dry-fruit-box.png",
    keralamealscombo: "/mockup/subcategory/gen-kerala-meals-combo.png",
    minimeals: "/mockup/subcategory/gen-mini-meals.png",
    parcelmeals: "/mockup/subcategory/gen-parcel-meals.png",
    specialsadyameals: "/mockup/subcategory/gen-special-sadya-meals.png",
    vegkeralameals: "/mockup/subcategory/gen-veg-kerala-meals.png",
    chickenburger: "/mockup/products/pizza-burger-real-chicken-burger.png",
    vegburger: "/mockup/products/pizza-burger-real-veg-burger.png",
    cheeseburger: "/mockup/products/pizza-burger-real-cheese-burger.png",
    cheesepizza: "/mockup/products/pizza-burger-real-cheese-pizza.png",
    chickenpizza: "/mockup/products/pizza-burger-real-chicken-pizza.png",
    vegpizza: "/mockup/products/pizza-burger-real-veg-pizza.png",
    ultrabookpro14: "/mockup/products/electronics-real-ultrabook-pro-14.png",
    studentbookair13: "/mockup/products/electronics-real-studentbook-air-13.png",
    businessbook15: "/mockup/products/electronics-real-businessbook-15.png",
    gamingbookrtx16: "/mockup/products/electronics-real-gamingbook-rtx-16.png",
    smarttv: "/mockup/products/electronics-real-smart-tv.png",
    doubledoorrefrigerator: "/mockup/products/electronics-real-refrigerator.png",
    splitac: "/mockup/products/electronics-real-split-ac.png",
    classicanalogwatch: "/mockup/products/accessory-real-analog-watch.png",
    smartwatch: "/mockup/products/accessory-real-smart-watch.png",
    sportswatch: "/mockup/products/accessory-real-sports-watch.png",
  };

  if (imageByKey[key]) return imageByKey[key];
  if (categoryName.toLowerCase().includes("fish")) return "/mockup/subcategory/sc-fish-daily-catch-real.jpg";
  if (categoryName.toLowerCase().includes("restaurant")) return "/mockup/im-rest-kerala-meals.jpg";
  return fallbackImage;
}

function discountForProduct(name: string, categoryName: string) {
  const key = normalize(`${categoryName} ${name}`);
  if (key.includes("fresh") || key.includes("daily")) return "Fresh";
  if (key.includes("combo") || key.includes("family")) return "Combo";
  if (key.includes("service") || key.includes("repair")) return "Service";
  const discounts = ["10% OFF", "SAVE 8", "12% OFF", "Today"];
  return discounts[normalize(name).length % discounts.length];
}

function codeForProduct(name: string, fallback: string) {
  const letters = name.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase();
  return letters || fallback.toUpperCase();
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}
