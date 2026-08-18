import { createCipheriv, createHash, createHmac, randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "argon2";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";

const DEMO_PREFIX = "demo-2026-08";
const DAY = 24 * 60 * 60 * 1_000;
const now = new Date();
const dateFromNow = (days: number, minutes = 0) =>
  new Date(now.getTime() + days * DAY + minutes * 60_000);
const demoId = (kind: string, key: string | number) =>
  `${DEMO_PREFIX}-${kind}-${String(key).replace(/[^a-z0-9-]/gi, "-").toLowerCase()}`;
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const categories = [
  { slug: "grocery", name: "Grocery", ml: "പലചരക്ക്", children: ["Supermarkets", "Organic & Fresh"] },
  { slug: "restaurants", name: "Restaurants", ml: "ഭക്ഷണശാലകൾ", children: ["Kerala Cuisine", "Cafes & Quick Bites"] },
  { slug: "hotels-stays", name: "Hotels & stays", ml: "ഹോട്ടലുകളും താമസവും", children: ["Hotels", "Homestays & Resorts"] },
  { slug: "bakery-sweets", name: "Bakery & sweets", ml: "ബേക്കറിയും മധുരപലഹാരങ്ങളും", children: ["Bakeries", "Sweets & Desserts"] },
  { slug: "home-services", name: "Home services", ml: "ഹോം സർവീസുകൾ", children: ["Repairs & Maintenance", "Cleaning & Pest Control"] },
  { slug: "doctors-clinics", name: "Doctors & clinics", ml: "ഡോക്ടർമാരും ക്ലിനിക്കുകളും", children: ["General Clinics", "Dental & Diagnostics"] },
  { slug: "event-services", name: "Event services", ml: "ഇവന്റ് സർവീസുകൾ", children: ["Wedding Services", "Catering & Photography"] },
  { slug: "electronics", name: "Electronics", ml: "ഇലക്ട്രോണിക്സ്", children: ["Mobiles & Computers", "Home Appliances"] },
  { slug: "beauty-wellness", name: "Beauty & wellness", ml: "സൗന്ദര്യവും ആരോഗ്യവും", children: ["Salons & Spas", "Ayurveda & Wellness"] },
  { slug: "automobile", name: "Automobile", ml: "ഓട്ടോമൊബൈൽ", children: ["Vehicle Service", "Parts & Accessories"] },
  { slug: "education", name: "Education", ml: "വിദ്യാഭ്യാസം", children: ["Tutoring & Coaching", "Skills & Languages"] },
  { slug: "fashion", name: "Fashion", ml: "ഫാഷൻ", children: ["Clothing", "Footwear & Accessories"] },
  { slug: "real-estate", name: "Real estate", ml: "റിയൽ എസ്റ്റേറ്റ്", children: ["Residential", "Commercial & Rentals"] },
  { slug: "sports-fitness", name: "Sports & fitness", ml: "കായികവും ഫിറ്റ്നസും", children: ["Gyms & Training", "Sports Equipment"] },
  { slug: "professional-services", name: "Professional services", ml: "പ്രൊഫഷണൽ സർവീസുകൾ", children: ["Legal & Accounting", "Digital & Business Services"] },
  { slug: "insurance", name: "Insurance", ml: "ഇൻഷുറൻസ്", children: ["Personal Insurance", "Business & Vehicle Insurance"] },
] as const;

const imageUrls = [
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1507501336603-6e31db2be093?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1400&q=80",
] as const;

const businessDefinitions = [
  {
    slug: "green-basket-demo-mart",
    name: "Green Basket Demo Mart",
    category: "grocery",
    locality: "Panampilly Nagar",
    city: "Kochi",
    district: "Ernakulam",
    postalCode: "682036",
    lat: 9.9607,
    lng: 76.2941,
    products: ["Kerala Essentials Basket", "Organic Vegetable Box", "Breakfast Pantry Pack"],
    services: ["Same-day Grocery Delivery", "Monthly Pantry Subscription"],
  },
  {
    slug: "pepper-harbour-demo-kitchen",
    name: "Pepper Harbour Demo Kitchen",
    category: "restaurants",
    locality: "Fort Kochi",
    city: "Kochi",
    district: "Ernakulam",
    postalCode: "682001",
    lat: 9.9658,
    lng: 76.2421,
    products: ["Kerala Sadya Box", "Malabar Biriyani Pack", "Family Dinner Combo"],
    services: ["Table Reservation", "Corporate Meal Catering"],
  },
  {
    slug: "backwater-breeze-demo-stay",
    name: "Backwater Breeze Demo Stay",
    category: "hotels-stays",
    locality: "Punnamada",
    city: "Alappuzha",
    district: "Alappuzha",
    postalCode: "688006",
    lat: 9.5169,
    lng: 76.3376,
    products: ["Travel Essentials Kit", "Local Souvenir Hamper", "Room Celebration Pack"],
    services: ["Deluxe Room Stay", "Backwater Experience Package"],
  },
  {
    slug: "cardamom-crumb-demo-bakery",
    name: "Cardamom Crumb Demo Bakery",
    category: "bakery-sweets",
    locality: "Vellayambalam",
    city: "Thiruvananthapuram",
    district: "Thiruvananthapuram",
    postalCode: "695010",
    lat: 8.5102,
    lng: 76.9639,
    products: ["Fresh Cream Celebration Cake", "Kerala Snack Gift Box", "Artisan Bread Basket"],
    services: ["Custom Cake Design", "Dessert Table Setup"],
  },
  {
    slug: "fixora-demo-home-care",
    name: "Fixora Demo Home Care",
    category: "home-services",
    locality: "Kakkanad",
    city: "Kochi",
    district: "Ernakulam",
    postalCode: "682030",
    lat: 10.0159,
    lng: 76.3419,
    products: ["Home Maintenance Starter Kit", "Eco Cleaning Supply Pack", "Emergency Repair Kit"],
    services: ["Deep Home Cleaning", "Electrical & Plumbing Visit"],
  },
  {
    slug: "carebridge-demo-clinic",
    name: "CareBridge Demo Clinic",
    category: "doctors-clinics",
    locality: "Pattom",
    city: "Thiruvananthapuram",
    district: "Thiruvananthapuram",
    postalCode: "695004",
    lat: 8.5209,
    lng: 76.9417,
    products: ["Wellness Screening Kit", "First Aid Essentials", "Home Monitoring Bundle"],
    services: ["General Physician Consultation", "Preventive Health Check"],
  },
  {
    slug: "marigold-moments-demo-events",
    name: "Marigold Moments Demo Events",
    category: "event-services",
    locality: "Punkunnam",
    city: "Thrissur",
    district: "Thrissur",
    postalCode: "680002",
    lat: 10.5342,
    lng: 76.1992,
    products: ["Welcome Decor Set", "Return Gift Collection", "Celebration Lighting Pack"],
    services: ["Wedding Planning", "Birthday Event Production"],
  },
  {
    slug: "circuit-corner-demo-electronics",
    name: "Circuit Corner Demo Electronics",
    category: "electronics",
    locality: "Palayam",
    city: "Kozhikode",
    district: "Kozhikode",
    postalCode: "673001",
    lat: 11.2588,
    lng: 75.7804,
    products: ["Demo Smart Phone X1", "Wireless Audio Bundle", "Work-from-home Tech Kit"],
    services: ["Laptop Repair & Diagnosis", "Smart Home Installation"],
  },
  {
    slug: "lotus-glow-demo-studio",
    name: "Lotus Glow Demo Studio",
    category: "beauty-wellness",
    locality: "Kadavanthra",
    city: "Kochi",
    district: "Ernakulam",
    postalCode: "682020",
    lat: 9.9681,
    lng: 76.2999,
    products: ["Herbal Skin Care Set", "Salon Hair Care Bundle", "Wellness Gift Hamper"],
    services: ["Signature Salon Session", "Ayurvedic Relaxation Therapy"],
  },
  {
    slug: "roadready-demo-auto-hub",
    name: "RoadReady Demo Auto Hub",
    category: "automobile",
    locality: "Vyttila",
    city: "Kochi",
    district: "Ernakulam",
    postalCode: "682019",
    lat: 9.9676,
    lng: 76.3183,
    products: ["Car Care Essentials", "Two-wheeler Safety Kit", "Interior Cleaning Bundle"],
    services: ["Periodic Car Service", "Roadside Inspection Visit"],
  },
  {
    slug: "brightpath-demo-academy",
    name: "BrightPath Demo Academy",
    category: "education",
    locality: "Kowdiar",
    city: "Thiruvananthapuram",
    district: "Thiruvananthapuram",
    postalCode: "695003",
    lat: 8.5269,
    lng: 76.957,
    products: ["Exam Preparation Workbook", "STEM Activity Box", "Language Learning Pack"],
    services: ["Entrance Exam Coaching", "Spoken English Course"],
  },
  {
    slug: "loom-and-line-demo-fashion",
    name: "Loom & Line Demo Fashion",
    category: "fashion",
    locality: "Sultan Bathery Road",
    city: "Kozhikode",
    district: "Kozhikode",
    postalCode: "673001",
    lat: 11.2517,
    lng: 75.7762,
    products: ["Handloom Festive Kurta", "Everyday Cotton Saree", "Artisan Accessory Set"],
    services: ["Personal Styling Appointment", "Custom Alteration Service"],
  },
  {
    slug: "keystone-demo-realty",
    name: "KeyStone Demo Realty",
    category: "real-estate",
    locality: "Kumarapuram",
    city: "Thiruvananthapuram",
    district: "Thiruvananthapuram",
    postalCode: "695011",
    lat: 8.5149,
    lng: 76.9295,
    products: ["Apartment Buyer Guide", "Rental Move-in Pack", "Property Document Folder"],
    services: ["Residential Property Consultation", "Rental Property Management"],
  },
  {
    slug: "pulsepoint-demo-fitness",
    name: "PulsePoint Demo Fitness",
    category: "sports-fitness",
    locality: "Kaloor",
    city: "Kochi",
    district: "Ernakulam",
    postalCode: "682017",
    lat: 9.9974,
    lng: 76.3019,
    products: ["Home Workout Starter Set", "Yoga & Mobility Kit", "Athlete Hydration Bundle"],
    services: ["Personal Fitness Training", "Group Yoga Membership"],
  },
  {
    slug: "bnc-demo-services-0807",
    name: "BNC Demo Services",
    category: "professional-services",
    locality: "Kottayam Town",
    city: "Kottayam",
    district: "Kottayam",
    postalCode: "686001",
    lat: 9.5916,
    lng: 76.5222,
    products: ["Business Launch Toolkit", "Digital Presence Starter Pack", "Accounts Template Bundle"],
    services: ["Business Registration Guidance", "Digital Marketing Consultation"],
  },
  {
    slug: "securepath-demo-insurance",
    name: "SecurePath Demo Insurance",
    category: "insurance",
    locality: "Palarivattom",
    city: "Kochi",
    district: "Ernakulam",
    postalCode: "682025",
    lat: 10.0051,
    lng: 76.3064,
    products: ["Family Insurance Guide", "Motor Policy Document Kit", "Business Protection Planner"],
    services: ["Health & Life Insurance Consultation", "Motor & Business Policy Assistance"],
  },
] as const;

const workflowBusinesses = [
  ["draft-workspace", "Demo Draft Business", "DRAFT"],
  ["pending-workspace", "Demo Pending Verification Business", "PENDING_VERIFICATION"],
  ["suspended-workspace", "Demo Suspended Business", "SUSPENDED"],
  ["rejected-workspace", "Demo Rejected Business", "REJECTED"],
  ["closed-workspace", "Demo Closed Business", "CLOSED"],
] as const;

type IdDelegate = {
  upsert(args: {
    where: { id: string };
    create: Record<string, unknown>;
    update: Record<string, unknown>;
  }): Promise<Record<string, unknown>>;
};

async function main() {
  const missingProductCategories = categories
    .filter((category) => !businessDefinitions.some(
      (business) => business.category === category.slug && business.products.length > 0,
    ))
    .map((category) => category.slug);
  if (missingProductCategories.length) {
    throw new Error(`Demo catalogue is missing products for: ${missingProductCategories.join(", ")}`);
  }
  if (process.argv.includes("--dry-run")) {
    process.stdout.write(
      JSON.stringify(
        {
          label: DEMO_PREFIX,
          categories: categories.length * 3 + 1,
          activeBusinesses: businessDefinitions.length,
          workflowBusinesses: workflowBusinesses.length,
          productCategories: categories.length,
          products: businessDefinitions.length * 3,
          services: businessDefinitions.length * 2,
          note: "Dry run only. No database connection was opened.",
        },
        null,
        2,
      ) + "\n",
    );
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;
  const encryptionSecret = process.env.ENQUIRY_DATA_KEY;
  if (!databaseUrl) throw new Error("DATABASE_URL is required.");
  if (!encryptionSecret) throw new Error("ENQUIRY_DATA_KEY is required.");
  if (!process.argv.includes("--confirm-live-demo")) {
    throw new Error(
      "This writes labelled demo records. Review the target and rerun with --confirm-live-demo.",
    );
  }

  const target = new URL(databaseUrl);
  process.stdout.write(
    `Seeding ${DEMO_PREFIX} into ${target.hostname}/${target.pathname.replace(/^\//, "")}.\n`,
  );

  const prisma = new PrismaClient({ adapter: new PrismaPg(databaseUrl) });
  const delegates = prisma as unknown as Record<string, IdDelegate>;
  const upsertId = async (model: string, data: Record<string, unknown>) => {
    const { id, ...update } = data;
    delete update.createdAt;
    if (typeof id !== "string") throw new Error(`${model} demo record is missing an id.`);
    return delegates[model].upsert({ where: { id }, create: data, update });
  };
  const encrypt = (value: string) => {
    const key = createHash("sha256").update(encryptionSecret).digest();
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
  };

  try {
    const passwordHashes = {
      customer: await hash("BNC!Customer2026#"),
      business: await hash("BNC!Business2026#"),
      admin: await hash("BNC!Admin2026#"),
      staff: await hash("BNC!DemoTester2026#"),
    };
    const userDefinitions = [
      {
        key: "customer",
        email: "bnc.customer.demo.0807@example.com",
        phone: "+919876543210",
        role: "CUSTOMER",
        passwordHash: passwordHashes.customer,
        displayName: "Anjali Demo Customer",
        city: "Kochi",
      },
      {
        key: "customer-two",
        email: "bnc.customer2.demo.0807@example.com",
        phone: "+919876543211",
        role: "CUSTOMER",
        passwordHash: passwordHashes.staff,
        displayName: "Rahul Demo Customer",
        city: "Thiruvananthapuram",
      },
      {
        key: "business",
        email: "bnc.business.demo.0807@example.com",
        phone: "+919876543212",
        role: "BUSINESS_OWNER",
        passwordHash: passwordHashes.business,
        displayName: "Meera Demo Owner",
        city: "Kottayam",
      },
      {
        key: "team",
        email: "bnc.team.demo.0807@example.com",
        phone: "+919876543213",
        role: "BUSINESS_OWNER",
        passwordHash: passwordHashes.staff,
        displayName: "Nikhil Demo Team Member",
        city: "Kochi",
      },
      {
        key: "admin",
        email: "bnc.admin.demo.0807@example.com",
        phone: "+919876543214",
        role: "SUPER_ADMIN",
        passwordHash: passwordHashes.admin,
        displayName: "BNC Demo Administrator",
        city: "Kochi",
      },
      {
        key: "moderator",
        email: "bnc.moderator.demo.0807@example.com",
        phone: "+919876543215",
        role: "MODERATOR",
        passwordHash: passwordHashes.staff,
        displayName: "BNC Demo Moderator",
        city: "Kozhikode",
      },
      {
        key: "support",
        email: "bnc.support.demo.0807@example.com",
        phone: "+919876543216",
        role: "SUPPORT",
        passwordHash: passwordHashes.staff,
        displayName: "BNC Demo Support",
        city: "Thrissur",
      },
      {
        key: "verification",
        email: "bnc.verification.demo.0807@example.com",
        phone: "+919876543217",
        role: "VERIFICATION",
        passwordHash: passwordHashes.staff,
        displayName: "BNC Demo Verification",
        city: "Alappuzha",
      },
      {
        key: "finance",
        email: "bnc.finance.demo.0807@example.com",
        phone: "+919876543218",
        role: "FINANCE",
        passwordHash: passwordHashes.staff,
        displayName: "BNC Demo Finance",
        city: "Kottayam",
      },
    ] as const;

    const users = new Map<string, { id: string; email: string | null }>();
    for (const definition of userDefinitions) {
      const user = await prisma.user.upsert({
        where: { email: definition.email },
        create: {
          id: demoId("user", definition.key),
          email: definition.email,
          phone: definition.phone,
          passwordHash: definition.passwordHash,
          role: definition.role,
          status: "ACTIVE",
          emailVerifiedAt: dateFromNow(-120),
          phoneVerifiedAt: dateFromNow(-120),
          preferredLanguage: definition.key === "customer-two" ? "ml" : "en",
          lastLoginAt: dateFromNow(-1),
        },
        update: {
          phone: definition.phone,
          passwordHash: definition.passwordHash,
          role: definition.role,
          status: "ACTIVE",
          emailVerifiedAt: dateFromNow(-120),
          phoneVerifiedAt: dateFromNow(-120),
          deletedAt: null,
        },
        select: { id: true, email: true },
      });
      users.set(definition.key, user);
      await prisma.customerProfile.upsert({
        where: { userId: user.id },
        create: {
          id: demoId("profile", definition.key),
          userId: user.id,
          displayName: definition.displayName,
          avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(definition.displayName)}`,
          defaultCity: definition.city,
          defaultState: "Kerala",
        },
        update: {
          displayName: definition.displayName,
          avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(definition.displayName)}`,
          defaultCity: definition.city,
          defaultState: "Kerala",
        },
      });
    }

    const userId = (key: string) => {
      const user = users.get(key);
      if (!user) throw new Error(`Missing seeded user ${key}.`);
      return user.id;
    };

    for (const key of ["admin", "moderator", "support", "verification", "finance"] as const) {
      const definition = userDefinitions.find((candidate) => candidate.key === key)!;
      await prisma.globalRoleAssignment.upsert({
        where: { userId_role: { userId: userId(key), role: definition.role } },
        create: {
          id: demoId("global-role", key),
          userId: userId(key),
          role: definition.role,
          assignedById: key === "admin" ? null : userId("admin"),
          reason: "Explicit live demo workspace testing assignment",
          active: true,
        },
        update: {
          assignedById: key === "admin" ? null : userId("admin"),
          reason: "Explicit live demo workspace testing assignment",
          active: true,
          revokedAt: null,
        },
      });
    }
    process.stdout.write("✓ users, profiles, and operational roles\n");

    const owner = await prisma.businessOwner.upsert({
      where: { userId: userId("business") },
      create: {
        id: demoId("owner", "primary"),
        userId: userId("business"),
        legalName: "BNC Demo Ventures",
        panNumber: "ABCDE1234F",
        gstNumber: "32ABCDE1234F1ZD",
      },
      update: {
        legalName: "BNC Demo Ventures",
        panNumber: "ABCDE1234F",
        gstNumber: "32ABCDE1234F1ZD",
      },
    });

    const categoryBySlug = new Map<string, { id: string; slug: string }>();
    for (const [index, definition] of categories.entries()) {
      const root = await prisma.category.upsert({
        where: { slug: definition.slug },
        create: {
          id: demoId("category", definition.slug),
          name: definition.name,
          nameMalayalam: definition.ml,
          slug: definition.slug,
          description: `Demo marketplace listings for ${definition.name.toLowerCase()}.`,
          icon: definition.slug,
          level: 0,
          sortOrder: index + 1,
          isActive: true,
        },
        update: {
          name: definition.name,
          nameMalayalam: definition.ml,
          description: `Demo marketplace listings for ${definition.name.toLowerCase()}.`,
          icon: definition.slug,
          level: 0,
          sortOrder: index + 1,
          isActive: true,
          parentId: null,
        },
        select: { id: true, slug: true },
      });
      categoryBySlug.set(root.slug, root);
      for (const [childIndex, childName] of definition.children.entries()) {
        const childSlug = `${definition.slug}-${slugify(childName)}`;
        const child = await prisma.category.upsert({
          where: { slug: childSlug },
          create: {
            id: demoId("category", childSlug),
            name: childName,
            slug: childSlug,
            description: `Demo subcategory for ${childName.toLowerCase()}.`,
            icon: definition.slug,
            level: 1,
            sortOrder: childIndex + 1,
            isActive: true,
            parentId: root.id,
          },
          update: {
            name: childName,
            description: `Demo subcategory for ${childName.toLowerCase()}.`,
            icon: definition.slug,
            level: 1,
            sortOrder: childIndex + 1,
            isActive: true,
            parentId: root.id,
          },
          select: { id: true, slug: true },
        });
        categoryBySlug.set(child.slug, child);
      }
    }
    await prisma.category.upsert({
      where: { slug: "archived-demo-category" },
      create: {
        id: demoId("category", "archived"),
        name: "Archived demo category",
        slug: "archived-demo-category",
        description: "Inactive demo category for negative-path testing.",
        level: 0,
        sortOrder: 999,
        isActive: false,
      },
      update: { isActive: false },
    });
    process.stdout.write(`✓ ${categories.length * 3 + 1} categories and subcategories\n`);

    const plans = new Map<string, { id: string }>();
    const planDefinitions = [
      {
        slug: "bronze", name: "Bronze", priority: 1, starLevel: 1,
        monthlyPrice: 499, annualPrice: 4_999, leadQuota: 20, productLimit: 3,
        mediaLimit: 0, categoryLimit: 1, teamMemberLimit: 1,
        listingReach: "NEARBY_5KM", offerReach: "NEARBY_5KM",
        descriptionEnabled: false, socialLinksEnabled: false, bookingEnabled: false,
        deliveryEnabled: false, automaticLeadAlerts: false,
        sponsoredPlacement: false, advancedAnalytics: false,
        features: ["Banner", "Profile photo", "1 category", "3 products", "Location map", "Business address", "BNC business listing", "Google search-ready profile", "Shareable business card"],
      },
      {
        slug: "silver", name: "Silver", priority: 2, starLevel: 2,
        monthlyPrice: 999, annualPrice: 9_999, leadQuota: 50, productLimit: 10,
        mediaLimit: 5, categoryLimit: 3, teamMemberLimit: 2,
        listingReach: "CONSTITUENCY", offerReach: "NEARBY_5KM",
        descriptionEnabled: true, socialLinksEnabled: true, bookingEnabled: false,
        deliveryEnabled: false, automaticLeadAlerts: false,
        sponsoredPlacement: false, advancedAnalytics: false,
        features: ["Banner", "Profile photo", "5 gallery photos", "3 categories", "10 products", "Location map", "Business address", "Business description", "BNC business listing", "Google search-ready profile", "Shareable business card", "Constituency priority listing", "Social media links"],
      },
      {
        slug: "gold", name: "Gold", priority: 3, starLevel: 3,
        monthlyPrice: 2_999, annualPrice: 29_999, leadQuota: 100, productLimit: 30,
        mediaLimit: 15, categoryLimit: 6, teamMemberLimit: 3,
        listingReach: "CONSTITUENCY", offerReach: "NEARBY_5KM",
        descriptionEnabled: true, socialLinksEnabled: true, bookingEnabled: false,
        deliveryEnabled: false, automaticLeadAlerts: false,
        sponsoredPlacement: true, advancedAnalytics: true,
        features: ["Banner", "Profile photo", "15 gallery photos", "6 categories", "30 products", "Location map", "Business address", "Business description", "BNC business listing", "Google search-ready profile", "Shareable business card", "Constituency priority listing", "Social media links"],
      },
      {
        slug: "platinum", name: "Platinum", priority: 4, starLevel: 4,
        monthlyPrice: 4_999, annualPrice: 49_999, leadQuota: 200, productLimit: 50,
        mediaLimit: 25, categoryLimit: 10, teamMemberLimit: 5,
        listingReach: "CONSTITUENCY", offerReach: "NEARBY_5KM",
        descriptionEnabled: true, socialLinksEnabled: true, bookingEnabled: true,
        deliveryEnabled: true, automaticLeadAlerts: false,
        sponsoredPlacement: true, advancedAnalytics: true,
        features: ["Banner", "Profile photo", "25 gallery photos", "10 categories", "50 products", "Location map", "Business address", "Business description", "BNC business listing", "Google search-ready profile", "Shareable business card", "Constituency priority listing", "Social media links", "Booking system", "Delivery integration"],
      },
      {
        slug: "diamond", name: "Diamond", priority: 5, starLevel: 5,
        monthlyPrice: 9_999, annualPrice: 99_999, leadQuota: 500, productLimit: 100,
        mediaLimit: 50, categoryLimit: 15, teamMemberLimit: 10,
        listingReach: "DISTRICT", offerReach: "DISTRICT",
        descriptionEnabled: true, socialLinksEnabled: true, bookingEnabled: true,
        deliveryEnabled: true, automaticLeadAlerts: true,
        sponsoredPlacement: true, advancedAnalytics: true,
        features: ["Banner", "Profile photo", "50 gallery photos", "15 categories", "100 products", "Location map", "Business address", "Business description", "BNC business listing", "Google search-ready profile", "Shareable business card", "District priority listing", "Social media links", "Automatic lead alerts with opt-out", "Booking system", "Delivery integration"],
      },
      {
        slug: "ruby", name: "Ruby", priority: 6, starLevel: 6,
        monthlyPrice: 14_999, annualPrice: 149_999, leadQuota: null, productLimit: 150,
        mediaLimit: 75, categoryLimit: 20, teamMemberLimit: 15,
        listingReach: "STATE", offerReach: "STATE",
        descriptionEnabled: true, socialLinksEnabled: true, bookingEnabled: true,
        deliveryEnabled: true, automaticLeadAlerts: true,
        sponsoredPlacement: true, advancedAnalytics: true,
        features: ["Banner", "Profile photo", "75 gallery photos", "20 categories", "150 products", "Location map", "Business address", "Business description", "BNC business listing", "Google search-ready profile", "Shareable business card", "State priority listing", "Social media links", "Automatic lead alerts with opt-out", "Booking system", "Delivery integration"],
      },
    ] as const;
    for (const definition of planDefinitions) {
      const { slug, name, priority, starLevel, monthlyPrice, annualPrice, leadQuota,
        productLimit, mediaLimit, categoryLimit, teamMemberLimit, listingReach,
        offerReach, descriptionEnabled, socialLinksEnabled, bookingEnabled,
        deliveryEnabled, automaticLeadAlerts, sponsoredPlacement,
        advancedAnalytics, features } = definition;
      const plan = await prisma.subscriptionPlan.upsert({
        where: { slug },
        create: {
          id: demoId("plan", slug),
          slug,
          name,
          priority,
          starLevel,
          listingReach,
          offerReach,
          monthlyPrice,
          annualPrice,
          leadQuota,
          productLimit,
          mediaLimit,
          categoryLimit,
          locationLimit: 1,
          teamMemberLimit,
          descriptionEnabled,
          socialLinksEnabled,
          bookingEnabled,
          deliveryEnabled,
          automaticLeadAlerts,
          sponsoredPlacement,
          advancedAnalytics,
          features,
          isActive: true,
        },
        update: {
          name,
          priority,
          starLevel,
          listingReach,
          offerReach,
          monthlyPrice,
          annualPrice,
          leadQuota,
          productLimit,
          mediaLimit,
          categoryLimit,
          locationLimit: 1,
          teamMemberLimit,
          descriptionEnabled,
          socialLinksEnabled,
          bookingEnabled,
          deliveryEnabled,
          automaticLeadAlerts,
          sponsoredPlacement,
          advancedAnalytics,
          features,
          isActive: true,
        },
        select: { id: true },
      });
      plans.set(slug, plan);
    }

    const businesses = new Map<string, { id: string; categoryId: string }>();
    for (const [index, definition] of businessDefinitions.entries()) {
      const rootCategory = categoryBySlug.get(definition.category)!;
      const childSlug = `${definition.category}-${slugify(categories[index].children[0])}`;
      const childCategory = categoryBySlug.get(childSlug)!;
      const description = `${definition.name} is a fictional, clearly labelled demo listing used to test BNC catalogue, enquiry, order, review, analytics, and moderation workflows.`;
      const assignedPlan = planDefinitions[index % planDefinitions.length];
      const business = await prisma.business.upsert({
        where: { slug: definition.slug },
        create: {
          id: demoId("business", definition.slug),
          ownerId: owner.id,
          name: definition.name,
          slug: definition.slug,
          legalName: `${definition.name} Demo Private Limited`,
          description,
          shortDescription: `Test ${categories[index].name.toLowerCase()} listing in ${definition.city}.`,
          logoUrl: `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(definition.name)}`,
          coverImageUrl: imageUrls[index],
          phoneEncrypted: encrypt(`+91990000${String(1000 + index).slice(-4)}`),
          publicPhone: `+91 99000 ${String(1000 + index).padStart(5, "0")}`,
          whatsappEncrypted: encrypt(`+91990000${String(1000 + index).slice(-4)}`),
          email: `hello+${definition.slug}@example.com`,
          websiteUrl: `https://example.com/demo/${definition.slug}`,
          status: "ACTIVE",
          verified: index % 3 !== 1,
          premium: index % 4 === 0,
          profileCompleteness: 100,
          averageRating: 0,
          reviewCount: 0,
          responseRate: 78 + (index % 5) * 5,
          medianResponseMinutes: 8 + index * 3,
          yearsInBusiness: 2 + (index % 12),
          priceRange: (index % 4) + 1,
          attributes: {
            demo: true,
            languages: ["English", "Malayalam"],
            accessibility: index % 2 === 0,
            acceptsOnlineOrders: true,
          },
          searchDocument: `${definition.name} ${definition.category} ${definition.locality} ${definition.city} ${description}`,
          lastActiveAt: dateFromNow(0, -index * 8),
          publishedAt: dateFromNow(-90 + index),
        },
        update: {
          ownerId: owner.id,
          name: definition.name,
          legalName: `${definition.name} Demo Private Limited`,
          description,
          shortDescription: `Test ${categories[index].name.toLowerCase()} listing in ${definition.city}.`,
          logoUrl: `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(definition.name)}`,
          coverImageUrl: imageUrls[index],
          phoneEncrypted: encrypt(`+91990000${String(1000 + index).slice(-4)}`),
          publicPhone: `+91 99000 ${String(1000 + index).padStart(5, "0")}`,
          whatsappEncrypted: encrypt(`+91990000${String(1000 + index).slice(-4)}`),
          email: `hello+${definition.slug}@example.com`,
          websiteUrl: `https://example.com/demo/${definition.slug}`,
          status: "ACTIVE",
          verified: index % 3 !== 1,
          premium: index % 4 === 0,
          profileCompleteness: 100,
          responseRate: 78 + (index % 5) * 5,
          medianResponseMinutes: 8 + index * 3,
          yearsInBusiness: 2 + (index % 12),
          priceRange: (index % 4) + 1,
          attributes: {
            demo: true,
            languages: ["English", "Malayalam"],
            accessibility: index % 2 === 0,
            acceptsOnlineOrders: true,
          },
          searchDocument: `${definition.name} ${definition.category} ${definition.locality} ${definition.city} ${description}`,
          lastActiveAt: dateFromNow(0, -index * 8),
          publishedAt: dateFromNow(-90 + index),
          deletedAt: null,
        },
        select: { id: true },
      });
      businesses.set(definition.slug, { id: business.id, categoryId: rootCategory.id });
      if (assignedPlan.categoryLimit > 1) {
        await prisma.businessCategory.upsert({
          where: { businessId_categoryId: { businessId: business.id, categoryId: rootCategory.id } },
          create: { businessId: business.id, categoryId: rootCategory.id, isPrimary: true },
          update: { isPrimary: true },
        });
      } else {
        await prisma.businessCategory.deleteMany({
          where: { businessId: business.id, categoryId: rootCategory.id },
        });
      }
      await prisma.businessCategory.upsert({
        where: { businessId_categoryId: { businessId: business.id, categoryId: childCategory.id } },
        create: { businessId: business.id, categoryId: childCategory.id, isPrimary: assignedPlan.categoryLimit === 1 },
        update: { isPrimary: assignedPlan.categoryLimit === 1 },
      });
      await upsertId("businessLocation", {
        id: demoId("location", `${definition.slug}-primary`),
        businessId: business.id,
        label: "Main branch",
        addressLine1: `${100 + index}, Demo Market Road`,
        addressLine2: "Near BNC Test Landmark",
        locality: definition.locality,
        city: definition.city,
        constituency: definition.city,
        district: definition.district,
        state: "Kerala",
        postalCode: definition.postalCode,
        latitude: definition.lat,
        longitude: definition.lng,
        serviceRadiusKm: 8 + (index % 4) * 4,
        isPrimary: true,
        isActive: true,
      });
      if (index < 3) {
        await upsertId("businessLocation", {
          id: demoId("location", `${definition.slug}-branch`),
          businessId: business.id,
          label: "Demo branch",
          addressLine1: `${220 + index}, Sample Junction`,
          locality: definition.locality,
          city: definition.city,
          constituency: definition.city,
          district: definition.district,
          state: "Kerala",
          postalCode: definition.postalCode,
          latitude: definition.lat + 0.012,
          longitude: definition.lng + 0.009,
          serviceRadiusKm: 5,
          isPrimary: false,
          isActive: index !== 2,
        });
      }
      for (let day = 0; day < 7; day += 1) {
        await prisma.workingHour.upsert({
          where: { businessId_dayOfWeek: { businessId: business.id, dayOfWeek: day } },
          create: {
            id: demoId("hours", `${definition.slug}-${day}`),
            businessId: business.id,
            dayOfWeek: day,
            opensAt: day === 0 ? null : "09:00",
            closesAt: day === 0 ? null : index === 1 ? "23:00" : "19:30",
            closed: day === 0,
            splitHours: day === 3 ? [{ opensAt: "09:00", closesAt: "13:00" }, { opensAt: "15:00", closesAt: "19:30" }] : undefined,
          },
          update: {
            opensAt: day === 0 ? null : "09:00",
            closesAt: day === 0 ? null : index === 1 ? "23:00" : "19:30",
            closed: day === 0,
            splitHours: day === 3 ? [{ opensAt: "09:00", closesAt: "13:00" }, { opensAt: "15:00", closesAt: "19:30" }] : undefined,
          },
        });
      }
      for (let mediaIndex = 0; mediaIndex < 2; mediaIndex += 1) {
        await upsertId("businessMedia", {
          id: demoId("business-media", `${definition.slug}-${mediaIndex}`),
          businessId: business.id,
          objectKey: `demo/businesses/${definition.slug}/${mediaIndex}.jpg`,
          publicUrl: imageUrls[(index + mediaIndex) % imageUrls.length],
          mediaType: mediaIndex === 0 ? "cover" : "gallery",
          altText: `${definition.name} demo ${mediaIndex === 0 ? "cover" : "gallery"} image`,
          sortOrder: mediaIndex,
          scanStatus: "approved",
        });
      }
      await prisma.businessMember.upsert({
        where: { businessId_userId: { businessId: business.id, userId: userId("business") } },
        create: {
          id: demoId("member", `${definition.slug}-owner`),
          businessId: business.id,
          userId: userId("business"),
          role: "OWNER",
          permissions: ["*"],
          active: true,
        },
        update: { role: "OWNER", permissions: ["*"], active: true },
      });
      if (index < 4) {
        await prisma.businessMember.upsert({
          where: { businessId_userId: { businessId: business.id, userId: userId("team") } },
          create: {
            id: demoId("member", `${definition.slug}-team`),
            businessId: business.id,
            userId: userId("team"),
            role: index % 2 === 0 ? "MANAGER" : "CATALOGUE_EDITOR",
            permissions: ["business:read", "catalogue:write", "orders:write", "enquiries:write"],
            active: true,
          },
          update: {
            role: index % 2 === 0 ? "MANAGER" : "CATALOGUE_EDITOR",
            permissions: ["business:read", "catalogue:write", "orders:write", "enquiries:write"],
            active: true,
          },
        });
      }
    }

    const workflowRoot = categoryBySlug.get("professional-services")!;
    for (const [index, definition] of workflowBusinesses.entries()) {
      const [slug, name, status] = definition;
      const business = await prisma.business.upsert({
        where: { slug },
        create: {
          id: demoId("business", slug),
          ownerId: owner.id,
          name,
          slug,
          description: `${name} is an intentionally non-active demo record for admin workflow testing.`,
          shortDescription: `Demo ${status.toLowerCase().replace(/_/g, " ")} state.`,
          status,
          verified: false,
          premium: false,
          profileCompleteness: 35 + index * 10,
          averageRating: 0,
          reviewCount: 0,
          responseRate: 0,
          attributes: { demo: true, workflowState: status },
          searchDocument: `${name} demo workflow ${status}`,
        },
        update: {
          ownerId: owner.id,
          name,
          description: `${name} is an intentionally non-active demo record for admin workflow testing.`,
          shortDescription: `Demo ${status.toLowerCase().replace(/_/g, " ")} state.`,
          status,
          verified: false,
          premium: false,
          profileCompleteness: 35 + index * 10,
          attributes: { demo: true, workflowState: status },
          searchDocument: `${name} demo workflow ${status}`,
          deletedAt: null,
        },
        select: { id: true },
      });
      await prisma.businessCategory.upsert({
        where: { businessId_categoryId: { businessId: business.id, categoryId: workflowRoot.id } },
        create: { businessId: business.id, categoryId: workflowRoot.id, isPrimary: true },
        update: { isPrimary: true },
      });
      await upsertId("businessLocation", {
        id: demoId("location", slug),
        businessId: business.id,
        label: "Workflow test location",
        addressLine1: `${500 + index}, Admin Test Avenue`,
        locality: "Kakkanad",
        city: "Kochi",
        district: "Ernakulam",
        state: "Kerala",
        postalCode: "682030",
        latitude: 10.0159 + index * 0.002,
        longitude: 76.3419 + index * 0.002,
        serviceRadiusKm: 5,
        isPrimary: true,
        isActive: true,
      });
    }
    await prisma.$executeRawUnsafe(`
      UPDATE "BusinessLocation"
      SET "locationPoint" = ST_SetSRID(
        ST_MakePoint("longitude"::double precision, "latitude"::double precision),
        4326
      )::geography
      WHERE "id" LIKE '${DEMO_PREFIX.replace(/'/g, "''")}%'
        AND "latitude" IS NOT NULL
        AND "longitude" IS NOT NULL
    `);
    process.stdout.write("✓ 15 active businesses, 5 workflow businesses, locations, hours, media, and team access\n");

    const subscriptionStatuses = [
      "ACTIVE",
      "TRIAL",
      "PENDING_PAYMENT",
      "PAST_DUE",
      "GRACE_PERIOD",
      "PAUSED",
      "CANCELLED",
      "EXPIRED",
    ] as const;
    for (const [index, definition] of businessDefinitions.entries()) {
      const business = businesses.get(definition.slug)!;
      const planSlug = planDefinitions[index % planDefinitions.length].slug;
      // Keep one visibly active example for every 0–6 star plan, then use the
      // remaining businesses to cover every subscription lifecycle state.
      const status = index < planDefinitions.length
        ? (["ACTIVE", "TRIAL", "ACTIVE", "ACTIVE", "GRACE_PERIOD", "ACTIVE", "ACTIVE"] as const)[index]
        : subscriptionStatuses[(index - planDefinitions.length) % subscriptionStatuses.length];
      const plan = plans.get(planSlug)!;
      await upsertId("businessSubscription", {
        id: demoId("subscription", definition.slug),
        businessId: business.id,
        planId: plan.id,
        status,
        billingCycle: index % 2 === 0 ? "monthly" : "annual",
        startsAt: dateFromNow(-60),
        currentPeriodStart: dateFromNow(-10),
        currentPeriodEnd: status === "EXPIRED" ? dateFromNow(-2) : dateFromNow(20 + index),
        graceEndsAt: status === "GRACE_PERIOD" ? dateFromNow(5) : null,
        cancelledAt: status === "CANCELLED" ? dateFromNow(-3) : null,
        leadCreditsUsed: index * 3,
        providerSubscriptionId: `demo_sub_${String(index + 1).padStart(3, "0")}`,
      });
    }
    process.stdout.write("✓ subscription plans and every subscription state\n");

    const products = new Map<string, { id: string; businessId: string; name: string; price: number; variantId: string }>();
    const productWorkflowStatuses = ["DRAFT", "SUBMITTED", "REJECTED", "ARCHIVED", "PUBLISHED"] as const;
    const stockStatuses = ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "MADE_TO_ORDER"] as const;
    for (const [businessIndex, definition] of businessDefinitions.entries()) {
      const business = businesses.get(definition.slug)!;
      const childSlug = `${definition.category}-${slugify(categories[businessIndex].children[0])}`;
      const itemCategory = categoryBySlug.get(childSlug)!;
      for (const [productIndex, productName] of definition.products.entries()) {
        const slug = slugify(productName);
        const price = 249 + businessIndex * 225 + productIndex * 175;
        const status =
          productIndex < 2
            ? "PUBLISHED"
            : productWorkflowStatuses[businessIndex % productWorkflowStatuses.length];
        const product = await prisma.product.upsert({
          where: { businessId_slug: { businessId: business.id, slug } },
          create: {
            id: demoId("product", `${definition.slug}-${slug}`),
            businessId: business.id,
            categoryId: itemCategory.id,
            name: productName,
            slug,
            brand: `${definition.name.split(" ")[0]} Demo`,
            description: `${productName} is fictional catalogue data for testing pricing, stock, media, variants, offers, enquiries, orders, and moderation.`,
            price,
            discountPrice: productIndex === 0 ? Math.round(price * 0.88) : null,
            stockStatus: stockStatuses[(businessIndex + productIndex) % stockStatuses.length],
            minimumOrderQty: productIndex + 1,
            deliveryOptions: ["pickup", "local_delivery", "courier"],
            specifications: {
              demo: true,
              material: productIndex % 2 === 0 ? "Standard" : "Premium",
              origin: "Kerala",
              colour: ["Natural", "Blue", "Green"][productIndex],
            },
            warranty: productIndex === 1 ? "12-month demo warranty" : null,
            returnInformation: "7-day demo return window; no real purchase is fulfilled.",
            status,
            submittedAt: status === "DRAFT" ? null : dateFromNow(-12),
            publishedAt: status === "PUBLISHED" ? dateFromNow(-10) : null,
            moderationReason: status === "REJECTED" ? "Demo rejection: incomplete specification." : null,
            isActive: status !== "ARCHIVED",
          },
          update: {
            categoryId: itemCategory.id,
            name: productName,
            brand: `${definition.name.split(" ")[0]} Demo`,
            description: `${productName} is fictional catalogue data for testing pricing, stock, media, variants, offers, enquiries, orders, and moderation.`,
            price,
            discountPrice: productIndex === 0 ? Math.round(price * 0.88) : null,
            stockStatus: stockStatuses[(businessIndex + productIndex) % stockStatuses.length],
            minimumOrderQty: productIndex + 1,
            deliveryOptions: ["pickup", "local_delivery", "courier"],
            specifications: {
              demo: true,
              material: productIndex % 2 === 0 ? "Standard" : "Premium",
              origin: "Kerala",
              colour: ["Natural", "Blue", "Green"][productIndex],
            },
            warranty: productIndex === 1 ? "12-month demo warranty" : null,
            returnInformation: "7-day demo return window; no real purchase is fulfilled.",
            status,
            submittedAt: status === "DRAFT" ? null : dateFromNow(-12),
            publishedAt: status === "PUBLISHED" ? dateFromNow(-10) : null,
            moderationReason: status === "REJECTED" ? "Demo rejection: incomplete specification." : null,
            isActive: status !== "ARCHIVED",
            deletedAt: null,
          },
          select: { id: true },
        });
        let firstVariantId = "";
        for (let variantIndex = 0; variantIndex < 2; variantIndex += 1) {
          const sku = `DEMO-${String(businessIndex + 1).padStart(2, "0")}-${String(productIndex + 1).padStart(2, "0")}-${variantIndex + 1}`;
          const variant = await prisma.productVariant.upsert({
            where: { sku },
            create: {
              id: demoId("variant", sku),
              productId: product.id,
              name: variantIndex === 0 ? "Standard" : "Premium",
              sku,
              price: price + variantIndex * 125,
              stock: variantIndex === 0 ? 24 + businessIndex : businessIndex % 3,
              attributes: { size: variantIndex === 0 ? "Standard" : "Large", demo: true },
              isActive: true,
            },
            update: {
              productId: product.id,
              name: variantIndex === 0 ? "Standard" : "Premium",
              price: price + variantIndex * 125,
              stock: variantIndex === 0 ? 24 + businessIndex : businessIndex % 3,
              attributes: { size: variantIndex === 0 ? "Standard" : "Large", demo: true },
              isActive: true,
            },
            select: { id: true },
          });
          if (variantIndex === 0) firstVariantId = variant.id;
        }
        const objectKey = `demo/products/${definition.slug}/${slug}.jpg`;
        await prisma.productMedia.upsert({
          where: { productId_objectKey: { productId: product.id, objectKey } },
          create: {
            id: demoId("product-media", `${definition.slug}-${slug}`),
            productId: product.id,
            objectKey,
            publicUrl: imageUrls[(businessIndex + productIndex) % imageUrls.length],
            mediaType: "image",
            altText: `${productName} demo product image`,
            sortOrder: 0,
            scanStatus: status === "PUBLISHED" ? "approved" : "pending",
          },
          update: {
            publicUrl: imageUrls[(businessIndex + productIndex) % imageUrls.length],
            mediaType: "image",
            altText: `${productName} demo product image`,
            sortOrder: 0,
            scanStatus: status === "PUBLISHED" ? "approved" : "pending",
          },
        });
        products.set(`${definition.slug}:${productIndex}`, {
          id: product.id,
          businessId: business.id,
          name: productName,
          price,
          variantId: firstVariantId,
        });
      }
    }

    const services = new Map<string, { id: string; businessId: string; name: string }>();
    const pricingTypes = ["FIXED", "STARTING_AT", "HOURLY", "DAILY", "PER_UNIT", "QUOTE"] as const;
    for (const [businessIndex, definition] of businessDefinitions.entries()) {
      const business = businesses.get(definition.slug)!;
      const childSlug = `${definition.category}-${slugify(categories[businessIndex].children[1])}`;
      const itemCategory = categoryBySlug.get(childSlug)!;
      for (const [serviceIndex, serviceName] of definition.services.entries()) {
        const slug = slugify(serviceName);
        const service = await prisma.service.upsert({
          where: { businessId_slug: { businessId: business.id, slug } },
          create: {
            id: demoId("service", `${definition.slug}-${slug}`),
            businessId: business.id,
            categoryId: itemCategory.id,
            name: serviceName,
            slug,
            description: `${serviceName} is fictional service data for testing discovery, availability, booking questions, offers, and enquiries.`,
            startingPrice: 399 + businessIndex * 300 + serviceIndex * 450,
            pricingType: pricingTypes[(businessIndex + serviceIndex) % pricingTypes.length],
            durationMinutes: 30 + (businessIndex % 5) * 30,
            homeService: (businessIndex + serviceIndex) % 2 === 0,
            availability: {
              days: ["MON", "TUE", "WED", "THU", "FRI", "SAT"],
              slots: ["09:00", "11:30", "15:00", "17:30"],
            },
            serviceAreas: [definition.city, definition.district],
            bookingQuestions: [
              { key: "preferred_time", label: "Preferred time", type: "text", required: true },
              { key: "notes", label: "Anything we should know?", type: "textarea", required: false },
            ],
            isActive: serviceIndex === 0 || businessIndex % 5 !== 0,
          },
          update: {
            categoryId: itemCategory.id,
            name: serviceName,
            description: `${serviceName} is fictional service data for testing discovery, availability, booking questions, offers, and enquiries.`,
            startingPrice: 399 + businessIndex * 300 + serviceIndex * 450,
            pricingType: pricingTypes[(businessIndex + serviceIndex) % pricingTypes.length],
            durationMinutes: 30 + (businessIndex % 5) * 30,
            homeService: (businessIndex + serviceIndex) % 2 === 0,
            availability: {
              days: ["MON", "TUE", "WED", "THU", "FRI", "SAT"],
              slots: ["09:00", "11:30", "15:00", "17:30"],
            },
            serviceAreas: [definition.city, definition.district],
            bookingQuestions: [
              { key: "preferred_time", label: "Preferred time", type: "text", required: true },
              { key: "notes", label: "Anything we should know?", type: "textarea", required: false },
            ],
            isActive: serviceIndex === 0 || businessIndex % 5 !== 0,
            deletedAt: null,
          },
          select: { id: true },
        });
        const objectKey = `demo/services/${definition.slug}/${slug}.jpg`;
        await prisma.serviceMedia.upsert({
          where: { serviceId_objectKey: { serviceId: service.id, objectKey } },
          create: {
            id: demoId("service-media", `${definition.slug}-${slug}`),
            serviceId: service.id,
            objectKey,
            publicUrl: imageUrls[(businessIndex + serviceIndex + 2) % imageUrls.length],
            mediaType: "image",
            altText: `${serviceName} demo service image`,
            sortOrder: 0,
            scanStatus: "approved",
          },
          update: {
            publicUrl: imageUrls[(businessIndex + serviceIndex + 2) % imageUrls.length],
            mediaType: "image",
            altText: `${serviceName} demo service image`,
            sortOrder: 0,
            scanStatus: "approved",
          },
        });
        services.set(`${definition.slug}:${serviceIndex}`, {
          id: service.id,
          businessId: business.id,
          name: serviceName,
        });
      }
    }
    process.stdout.write("✓ 45 products, 90 variants, 30 services, and approved media\n");

    const jobDefinitions = [
      {
        businessSlug: "circuit-corner-demo-electronics",
        slug: "mobile-and-laptop-service-technician",
        title: "Mobile & Laptop Service Technician",
        employmentType: "FULL_TIME",
        workplaceType: "ON_SITE",
        skills: ["Device diagnosis", "Laptop repair", "Customer service"],
        salaryMin: 22_000,
        salaryMax: 32_000,
      },
      {
        businessSlug: "lotus-glow-demo-studio",
        slug: "beauty-therapist",
        title: "Beauty Therapist",
        employmentType: "PART_TIME",
        workplaceType: "ON_SITE",
        skills: ["Salon services", "Client care", "Hygiene standards"],
        salaryMin: 15_000,
        salaryMax: 24_000,
      },
      {
        businessSlug: "bnc-demo-services-0807",
        slug: "digital-marketing-intern",
        title: "Digital Marketing Intern",
        employmentType: "INTERNSHIP",
        workplaceType: "HYBRID",
        skills: ["Social media", "Content writing", "Local business research"],
        salaryMin: 8_000,
        salaryMax: 12_000,
      },
    ] as const;
    for (const [index, definition] of jobDefinitions.entries()) {
      const businessDefinition = businessDefinitions.find(
        (item) => item.slug === definition.businessSlug,
      )!;
      const business = businesses.get(definition.businessSlug)!;
      await prisma.job.upsert({
        where: {
          businessId_slug: {
            businessId: business.id,
            slug: definition.slug,
          },
        },
        create: {
          id: demoId("job", definition.slug),
          businessId: business.id,
          title: definition.title,
          slug: definition.slug,
          description: `${definition.title} is a fictional vacancy for testing the complete BNC job discovery and application workflow. Applicants should use only demo information.`,
          employmentType: definition.employmentType,
          workplaceType: definition.workplaceType,
          skills: [...definition.skills],
          salaryMin: definition.salaryMin,
          salaryMax: definition.salaryMax,
          city: businessDefinition.city,
          district: businessDefinition.district,
          state: "Kerala",
          contactEmail: `jobs+${definition.businessSlug}@example.com`,
          status: "PUBLISHED",
          closesAt: dateFromNow(30 + index * 7),
          publishedAt: dateFromNow(-5 + index),
        },
        update: {
          title: definition.title,
          description: `${definition.title} is a fictional vacancy for testing the complete BNC job discovery and application workflow. Applicants should use only demo information.`,
          employmentType: definition.employmentType,
          workplaceType: definition.workplaceType,
          skills: [...definition.skills],
          salaryMin: definition.salaryMin,
          salaryMax: definition.salaryMax,
          city: businessDefinition.city,
          district: businessDefinition.district,
          state: "Kerala",
          contactEmail: `jobs+${definition.businessSlug}@example.com`,
          status: "PUBLISHED",
          closesAt: dateFromNow(30 + index * 7),
          publishedAt: dateFromNow(-5 + index),
          deletedAt: null,
        },
      });
    }
    await upsertId("jobApplication", {
      id: demoId("job-application", 1),
      jobId: demoId("job", jobDefinitions[0].slug),
      applicantId: userId("customer"),
      name: "Anjali Demo Customer",
      email: "bnc.customer.demo.0807@example.com",
      phone: "+919876543210",
      coverNote:
        "Fictional application created to test employer review and customer application tracking.",
      status: "SHORTLISTED",
      createdAt: dateFromNow(-2),
    });

    const bookingDefinitions = [
      {
        businessSlug: "carebridge-demo-clinic",
        serviceIndex: 0,
        providerName: "Dr. Demo Nair",
        startsAt: dateFromNow(3, 120),
        durationMinutes: 30,
        status: "CONFIRMED",
      },
      {
        businessSlug: "lotus-glow-demo-studio",
        serviceIndex: 0,
        providerName: "Demo Salon Team",
        startsAt: dateFromNow(7, 240),
        durationMinutes: 90,
        status: "REQUESTED",
      },
    ] as const;
    for (const [index, definition] of bookingDefinitions.entries()) {
      const business = businesses.get(definition.businessSlug)!;
      const service = services.get(
        `${definition.businessSlug}:${definition.serviceIndex}`,
      )!;
      const providerId = demoId("booking-provider", index + 1);
      await prisma.bookingProvider.upsert({
        where: { id: providerId },
        create: {
          id: providerId,
          businessId: business.id,
          name: definition.providerName,
          title: index === 0 ? "General physician" : "Senior beauty professional",
        },
        update: {
          businessId: business.id,
          name: definition.providerName,
          title: index === 0 ? "General physician" : "Senior beauty professional",
          isActive: true,
        },
      });
      await prisma.bookingProviderService.upsert({
        where: { providerId_serviceId: { providerId, serviceId: service.id } },
        create: { providerId, serviceId: service.id },
        update: {},
      });
      for (let weekday = 0; weekday < 7; weekday += 1) {
        await upsertId("bookingSchedule", {
          id: demoId("booking-schedule", `${index + 1}-${weekday}`),
          businessId: business.id,
          providerId,
          serviceId: service.id,
          weekday,
          startsMinute: index === 0 ? 540 : 600,
          endsMinute: index === 0 ? 1020 : 1140,
          slotIntervalMinutes: index === 0 ? 30 : 45,
          isActive: true,
        });
      }
      await upsertId("booking", {
        id: demoId("booking", index + 1),
        businessId: business.id,
        serviceId: service.id,
        providerId,
        customerId: userId("customer"),
        providerName: definition.providerName,
        startsAt: definition.startsAt,
        durationMinutes: definition.durationMinutes,
        status: definition.status,
        customerNote:
          "Fictional appointment used for testing the BNC booking workflow.",
        confirmedAt:
          definition.status === "CONFIRMED" ? dateFromNow(-1) : null,
        createdAt: dateFromNow(-2 + index),
      });
    }

    await upsertId("businessReferral", {
      id: demoId("referral", 1),
      businessId: businesses.get("bnc-demo-services-0807")!.id,
      createdById: userId("business"),
      contactName: "Demo Referral Contact",
      referredBusiness: "Sample Kerala Traders",
      phoneEncrypted: encrypt("+919900001234"),
      email: "referral.demo@example.com",
      notes:
        "Fictional referral for testing the business lead and reference console.",
      estimatedValue: 25_000,
      status: "CONTACTED",
      createdAt: dateFromNow(-3),
    });
    process.stdout.write("✓ jobs, applications, appointments, and referral workflows\n");

    const offerTypes = ["PERCENTAGE", "FLAT", "FESTIVAL", "LIMITED_TIME", "COUPON", "COMBO", "NEW_CUSTOMER"] as const;
    for (const [index, definition] of businessDefinitions.entries()) {
      const business = businesses.get(definition.slug)!;
      const product = products.get(`${definition.slug}:0`)!;
      const service = services.get(`${definition.slug}:0`)!;
      const offerType = offerTypes[index % offerTypes.length];
      const discountValue =
        offerType === "PERCENTAGE" ? 10 + (index % 5) * 5 : 250;
      const expired = index === 12;
      const future = index === 13;
      const offerId = demoId("offer", definition.slug);
      await upsertId("offer", {
        id: offerId,
        businessId: business.id,
        title:
          offerType === "PERCENTAGE"
            ? `${discountValue}% Demo Welcome Offer`
            : `₹${discountValue} Demo Welcome Offer`,
        description: "Fictional promotion for testing offer discovery, coupons, validity windows, and redemption counters.",
        type: offerType,
        discountValue,
        couponCode: `BNCDEMO${String(index + 1).padStart(2, "0")}`,
        minimumSpend: 500 + index * 100,
        startsAt: expired ? dateFromNow(-30) : future ? dateFromNow(5) : dateFromNow(-5),
        endsAt: expired ? dateFromNow(-2) : future ? dateFromNow(35) : dateFromNow(25 + index),
        maxRedemptions: 100 + index * 10,
        redemptionCount: index * 3,
        isFeatured: index % 4 === 0,
        isActive: index !== 14,
      });
      await prisma.offerProduct.upsert({
        where: { offerId_productId: { offerId, productId: product.id } },
        create: { offerId, productId: product.id },
        update: {},
      });
      await prisma.offerService.upsert({
        where: { offerId_serviceId: { offerId, serviceId: service.id } },
        create: { offerId, serviceId: service.id },
        update: {},
      });
    }
    process.stdout.write("✓ all offer types plus current, scheduled, expired, and inactive examples\n");

    const leadStatuses = ["NEW", "MATCHING", "DELIVERED", "VIEWED", "ACCEPTED", "CONTACTED", "CONVERTED", "EXPIRED", "REJECTED", "SPAM"] as const;
    const assignmentStatuses = ["QUEUED", "DELIVERED", "VIEWED", "ACCEPTED", "DECLINED", "EXPIRED"] as const;
    const leads = new Map<number, { id: string; categoryId: string }>();
    for (let index = 0; index < leadStatuses.length; index += 1) {
      const definition = businessDefinitions[index];
      const category = categoryBySlug.get(definition.category)!;
      const leadId = demoId("lead", index + 1);
      await upsertId("lead", {
        id: leadId,
        customerId: index % 4 === 3 ? null : userId(index % 2 === 0 ? "customer" : "customer-two"),
        categoryId: category.id,
        source: ["web", "mobile_app", "business_profile", "search"][index % 4],
        requirement: `Demo requirement ${index + 1}: looking for ${definition.services[0].toLowerCase()} near ${definition.locality}.`,
        productQuery: definition.products[0],
        approximateLocation: {
          locality: definition.locality,
          city: definition.city,
          district: definition.district,
          state: "Kerala",
        },
        latitude: definition.lat,
        longitude: definition.lng,
        radiusKm: 5 + (index % 4) * 5,
        urgency: ["today", "this_week", "flexible"][index % 3],
        contactEncrypted: encrypt(JSON.stringify({ phone: `+91981111${String(1000 + index).slice(-4)}`, email: `lead${index + 1}@example.com` })),
        consentScope: { phone: true, email: index % 2 === 0, whatsapp: index % 3 === 0 },
        status: leadStatuses[index],
        expiresAt: leadStatuses[index] === "EXPIRED" ? dateFromNow(-1) : dateFromNow(14),
        duplicateKey: sha256(`demo-lead-${index + 1}`),
        createdAt: dateFromNow(-20 + index),
      });
      leads.set(index, { id: leadId, categoryId: category.id });
      for (let matchIndex = 0; matchIndex < 2; matchIndex += 1) {
        const matchedBusiness = businesses.get(businessDefinitions[(index + matchIndex) % businessDefinitions.length].slug)!;
        await prisma.leadAssignment.upsert({
          where: { leadId_businessId: { leadId, businessId: matchedBusiness.id } },
          create: {
            id: demoId("lead-assignment", `${index}-${matchIndex}`),
            leadId,
            businessId: matchedBusiness.id,
            subscriptionId: demoId("subscription", businessDefinitions[(index + matchIndex) % businessDefinitions.length].slug),
            status: assignmentStatuses[(index + matchIndex) % assignmentStatuses.length],
            matchScore: 96 - index * 2 - matchIndex * 5,
            distanceKm: 1.2 + index * 0.8 + matchIndex * 2,
            creditCost: 1 + (index % 3),
            deliveredAt: dateFromNow(-10 + index),
            viewedAt: index % 3 === 0 ? dateFromNow(-9 + index) : null,
            acceptedAt: index % 4 === 0 ? dateFromNow(-8 + index) : null,
            expiresAt: dateFromNow(7),
          },
          update: {
            subscriptionId: demoId("subscription", businessDefinitions[(index + matchIndex) % businessDefinitions.length].slug),
            status: assignmentStatuses[(index + matchIndex) % assignmentStatuses.length],
            matchScore: 96 - index * 2 - matchIndex * 5,
            distanceKm: 1.2 + index * 0.8 + matchIndex * 2,
            creditCost: 1 + (index % 3),
            deliveredAt: dateFromNow(-10 + index),
            viewedAt: index % 3 === 0 ? dateFromNow(-9 + index) : null,
            acceptedAt: index % 4 === 0 ? dateFromNow(-8 + index) : null,
            expiresAt: dateFromNow(7),
          },
        });
      }
    }

    const enquiryStatuses = ["SUBMITTED", "MATCHING", "RESPONDED", "CLOSED", "EXPIRED", "SPAM"] as const;
    const enquiries = new Map<number, { id: string; businessId: string; customerId: string }>();
    for (let index = 0; index < 12; index += 1) {
      const definition = businessDefinitions[index % businessDefinitions.length];
      const business = businesses.get(definition.slug)!;
      const customerId = userId(index % 2 === 0 ? "customer" : "customer-two");
      const linkedLead = index < 6 ? leads.get(index) : undefined;
      const enquiryId = demoId("enquiry", index + 1);
      await upsertId("enquiry", {
        id: enquiryId,
        customerId,
        businessId: index % 3 === 1 ? null : business.id,
        categoryId: categoryBySlug.get(definition.category)!.id,
        leadId: linkedLead?.id ?? null,
        requirement: `Demo enquiry ${index + 1} for ${index % 2 === 0 ? definition.products[0] : definition.services[0]}. Please share availability and a test quotation.`,
        location: {
          locality: definition.locality,
          city: definition.city,
          district: definition.district,
          state: "Kerala",
          postalCode: definition.postalCode,
        },
        preferredDate: dateFromNow(3 + index),
        urgency: ["urgent", "normal", "flexible"][index % 3],
        customerName: index % 2 === 0 ? "Anjali Demo Customer" : "Rahul Demo Customer",
        contactEncrypted: encrypt(JSON.stringify({ phone: `+91982222${String(1000 + index).slice(-4)}`, email: `enquiry${index + 1}@example.com` })),
        contactPreference: ["PHONE", "WHATSAPP", "EMAIL"][index % 3],
        consentGrantedAt: dateFromNow(-18 + index),
        status: enquiryStatuses[index % enquiryStatuses.length],
        expiresAt: index % enquiryStatuses.length === 4 ? dateFromNow(-1) : dateFromNow(30),
        createdAt: dateFromNow(-18 + index),
      });
      enquiries.set(index, { id: enquiryId, businessId: business.id, customerId });
      const product = products.get(`${definition.slug}:0`)!;
      const service = services.get(`${definition.slug}:0`)!;
      await upsertId("enquiryItem", {
        id: demoId("enquiry-item", `${index}-product`),
        enquiryId,
        productId: index % 2 === 0 ? product.id : null,
        serviceId: index % 2 === 1 ? service.id : null,
        quantity: index % 2 === 0 ? (index % 3) + 1 : null,
        details: { demo: true, preferredVariant: index % 2 === 0 ? "Standard" : null },
      });
    }

    const conversationStatuses = ["OPEN", "ARCHIVED", "BLOCKED", "CLOSED"] as const;
    const messageTypes = ["SYSTEM", "TEXT", "IMAGE", "DOCUMENT"] as const;
    for (let index = 0; index < 12; index += 1) {
      const enquiry = enquiries.get(index)!;
      const conversationId = demoId("conversation", index + 1);
      await upsertId("conversation", {
        id: conversationId,
        businessId: enquiry.businessId,
        enquiryId: enquiry.id,
        status: conversationStatuses[index % conversationStatuses.length],
        createdAt: dateFromNow(-15 + index),
      });
      for (const memberId of [enquiry.customerId, userId("business")]) {
        await prisma.conversationMember.upsert({
          where: { conversationId_userId: { conversationId, userId: memberId } },
          create: {
            conversationId,
            userId: memberId,
            lastReadAt: index % 3 === 0 ? dateFromNow(-1) : null,
            muted: index % 5 === 0 && memberId === enquiry.customerId,
          },
          update: {
            lastReadAt: index % 3 === 0 ? dateFromNow(-1) : null,
            muted: index % 5 === 0 && memberId === enquiry.customerId,
          },
        });
      }
      for (let messageIndex = 0; messageIndex < 4; messageIndex += 1) {
        const type = messageTypes[messageIndex];
        await upsertId("message", {
          id: demoId("message", `${index}-${messageIndex}`),
          conversationId,
          senderId: messageIndex % 2 === 0 ? userId("business") : enquiry.customerId,
          type,
          body:
            type === "SYSTEM"
              ? "Demo conversation started from an enquiry."
              : type === "TEXT"
                ? "This is a demo reply confirming availability. No real order will be fulfilled."
                : type === "IMAGE"
                  ? "Demo image attachment"
                  : "Demo quotation document",
          attachmentKey:
            type === "IMAGE"
              ? `demo/messages/${index}/sample.jpg`
              : type === "DOCUMENT"
                ? `demo/messages/${index}/quotation.pdf`
                : null,
          deliveredAt: dateFromNow(-4, messageIndex * 15),
          readAt: messageIndex < 2 ? dateFromNow(-3) : null,
          createdAt: dateFromNow(-5, messageIndex * 15),
          deletedAt: index === 11 && messageIndex === 3 ? dateFromNow(-1) : null,
        });
      }
    }
    process.stdout.write("✓ every lead, assignment, enquiry, conversation, and message state/type\n");

    const reviewStatuses = ["PENDING", "PUBLISHED", "FLAGGED", "REMOVED"] as const;
    const publishedReviews: Array<{ id: string; businessId: string }> = [];
    for (const [index, definition] of businessDefinitions.entries()) {
      const business = businesses.get(definition.slug)!;
      const reviewId = demoId("review", `${definition.slug}-published`);
      const verificationEnquiry =
        index < 12 && index % 2 === 0 && index % 3 !== 1
          ? enquiries.get(index)
          : undefined;
      await upsertId("review", {
        id: reviewId,
        businessId: business.id,
        customerId: userId(index % 2 === 0 ? "customer" : "customer-two"),
        enquiryId: verificationEnquiry?.id ?? null,
        overallRating: 3 + (index % 3),
        serviceQuality: 4 + (index % 2),
        valueForMoney: 3 + (index % 3),
        responseTime: 3 + (index % 2),
        staffBehaviour: 4 + (index % 2),
        body: `Published demo review ${index + 1}: helpful service, clear communication, and a realistic test experience. This is not a real customer claim.`,
        recommended: index % 4 !== 0,
        verifiedInteraction: Boolean(verificationEnquiry),
        status: "PUBLISHED",
        helpfulCount: index % 6,
        createdAt: dateFromNow(-45 + index * 2),
        deletedAt: null,
      });
      publishedReviews.push({ id: reviewId, businessId: business.id });
      if (index < 8) {
        await upsertId("reviewReply", {
          id: demoId("review-reply", index),
          reviewId,
          businessId: business.id,
          body: "Thank you for using this demo listing. This reply exists to test the business review-response panel.",
          createdAt: dateFromNow(-20 + index),
        });
      }
    }
    for (let index = 0; index < reviewStatuses.length; index += 1) {
      const business = businesses.get(businessDefinitions[index].slug)!;
      const reviewId = demoId("review", `workflow-${index}`);
      await upsertId("review", {
        id: reviewId,
        businessId: business.id,
        customerId: userId(index % 2 === 0 ? "customer-two" : "customer"),
        enquiryId: null,
        overallRating: index + 1,
        serviceQuality: index + 1,
        valueForMoney: Math.min(index + 2, 5),
        responseTime: index + 1,
        staffBehaviour: Math.min(index + 2, 5),
        body: `Demo review in ${reviewStatuses[index].toLowerCase()} moderation state for workflow and filtering tests.`,
        recommended: index > 1,
        verifiedInteraction: false,
        status: reviewStatuses[index],
        helpfulCount: index,
        moderationReason: index === 2 ? "Demo flag: language requires review." : index === 3 ? "Demo removal: policy test." : null,
        createdAt: dateFromNow(-8 + index),
        deletedAt: null,
      });
      if (index === 1) {
        await prisma.reviewMedia.upsert({
          where: { reviewId_objectKey: { reviewId, objectKey: "demo/reviews/sample.jpg" } },
          create: {
            id: demoId("review-media", index),
            reviewId,
            objectKey: "demo/reviews/sample.jpg",
            publicUrl: imageUrls[0],
            mediaType: "image",
            altText: "Demo review attachment",
            sortOrder: 0,
            scanStatus: "clean",
          },
          update: { publicUrl: imageUrls[0], scanStatus: "clean" },
        });
        await upsertId("reviewEditHistory", {
          id: demoId("review-history", index),
          reviewId,
          body: "Earlier demo review text before editing.",
          overallRating: 3,
          serviceQuality: 3,
          valueForMoney: 3,
          responseTime: 3,
          staffBehaviour: 3,
          recommended: true,
          createdAt: dateFromNow(-9),
        });
      }
    }
    await prisma.reviewHelpfulVote.upsert({
      where: {
        reviewId_userId: {
          reviewId: publishedReviews[0].id,
          userId: userId("customer-two"),
        },
      },
      create: { reviewId: publishedReviews[0].id, userId: userId("customer-two") },
      update: {},
    });
    await prisma.reviewReport.upsert({
      where: {
        reviewId_reporterId: {
          reviewId: demoId("review", "workflow-2"),
          reporterId: userId("customer"),
        },
      },
      create: {
        id: demoId("review-report", "open"),
        reviewId: demoId("review", "workflow-2"),
        reporterId: userId("customer"),
        reason: "INAPPROPRIATE_CONTENT",
        details: "Demo report for moderation queue testing.",
        status: "OPEN",
      },
      update: {
        reason: "INAPPROPRIATE_CONTENT",
        details: "Demo report for moderation queue testing.",
        status: "OPEN",
        resolvedAt: null,
      },
    });
    for (const definition of businessDefinitions) {
      const business = businesses.get(definition.slug)!;
      const aggregate = await prisma.review.aggregate({
        where: { businessId: business.id, status: "PUBLISHED", deletedAt: null },
        _avg: { overallRating: true },
        _count: { id: true },
      });
      await prisma.business.update({
        where: { id: business.id },
        data: {
          averageRating: aggregate._avg.overallRating ?? 0,
          reviewCount: aggregate._count.id,
        },
      });
    }
    process.stdout.write("✓ published reviews on every listing plus moderation, reply, media, vote, report, and edit-history data\n");

    const firstCustomer = userId("customer");
    for (let index = 0; index < 5; index += 1) {
      const business = businesses.get(businessDefinitions[index].slug)!;
      await prisma.savedBusiness.upsert({
        where: { userId_businessId: { userId: firstCustomer, businessId: business.id } },
        create: { userId: firstCustomer, businessId: business.id },
        update: {},
      });
      await prisma.recentlyViewedBusiness.upsert({
        where: { userId_businessId: { userId: firstCustomer, businessId: business.id } },
        create: { userId: firstCustomer, businessId: business.id, viewedAt: dateFromNow(-index) },
        update: { viewedAt: dateFromNow(-index) },
      });
      const product = products.get(`${businessDefinitions[index].slug}:0`)!;
      await prisma.savedProduct.upsert({
        where: { userId_productId: { userId: firstCustomer, productId: product.id } },
        create: { userId: firstCustomer, productId: product.id },
        update: {},
      });
    }
    const blockedBusiness = businesses.get(businessDefinitions[14].slug)!;
    await prisma.blockedBusiness.upsert({
      where: { userId_businessId: { userId: firstCustomer, businessId: blockedBusiness.id } },
      create: { userId: firstCustomer, businessId: blockedBusiness.id, reason: "Demo negative-path test" },
      update: { reason: "Demo negative-path test" },
    });
    for (const [index, label] of ["Home", "Office"].entries()) {
      await upsertId("savedAddress", {
        id: demoId("address", index),
        userId: firstCustomer,
        label,
        recipient: "Anjali Demo Customer",
        phone: `+91987654321${index}`,
        addressLine1: `${42 + index}, Demo Residency`,
        addressLine2: index === 0 ? "Near Sample Park" : "BNC Test Tower",
        locality: index === 0 ? "Kadavanthra" : "Kakkanad",
        city: "Kochi",
        state: "Kerala",
        postalCode: index === 0 ? "682020" : "682030",
        latitude: 9.97 + index * 0.04,
        longitude: 76.3 + index * 0.04,
        isDefault: index === 0,
      });
    }
    for (let index = 0; index < 8; index += 1) {
      await upsertId("searchHistory", {
        id: demoId("search", index),
        userId: index === 7 ? null : firstCustomer,
        sessionId: `demo-search-session-${Math.floor(index / 3)}`,
        query: [
          "home cleaning Kochi",
          "birthday cake",
          "laptop repair",
          "family restaurant",
          "personal trainer",
          "apartment rental",
          "doctor near me",
          "business registration",
        ][index],
        language: index === 6 ? "ml" : "en",
        location: { city: businessDefinitions[index].city, state: "Kerala" },
        filters: { verified: index % 2 === 0, radiusKm: 5 + index * 2 },
        resultCount: 3 + index,
        clickedId: index < 5 ? businesses.get(businessDefinitions[index].slug)!.id : null,
        createdAt: dateFromNow(-7 + index),
      });
    }
    process.stdout.write("✓ saved listings/items, addresses, recent/blocked listings, and search history\n");

    const orderStatuses = [
      "PENDING",
      "CONFIRMED",
      "PREPARING",
      "READY_FOR_PICKUP",
      "DISPATCHED",
      "DELIVERED",
      "CANCELLED",
      "RETURN_REQUESTED",
      "RETURNED",
      "REFUNDED",
    ] as const;
    const paymentStatuses = ["CREATED", "AUTHORIZED", "CAPTURED", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"] as const;
    const orders = new Map<number, { id: string; paymentId: string; total: number }>();
    for (let index = 0; index < orderStatuses.length; index += 1) {
      const definition = businessDefinitions[index];
      const business = businesses.get(definition.slug)!;
      const product = products.get(`${definition.slug}:0`)!;
      const quantity = (index % 3) + 1;
      const subtotal = product.price * quantity;
      const discount = index % 2 === 0 ? 50 : 0;
      const tax = Math.round(subtotal * 0.05);
      const deliveryFee = index % 3 === 0 ? 0 : 49;
      const total = subtotal - discount + tax + deliveryFee;
      const orderNumber = `BNC-DEMO-${String(index + 1).padStart(4, "0")}`;
      const status = orderStatuses[index];
      const order = await prisma.order.upsert({
        where: { orderNumber },
        create: {
          id: demoId("order", index + 1),
          orderNumber,
          customerId: userId(index % 2 === 0 ? "customer" : "customer-two"),
          businessId: business.id,
          status,
          fulfilmentType: index % 3 === 0 ? "PICKUP" : "DELIVERY",
          deliveryAddress: index % 3 === 0 ? Prisma.JsonNull : {
            recipient: "Demo Customer",
            addressLine1: "42, Demo Residency",
            locality: "Kadavanthra",
            city: "Kochi",
            state: "Kerala",
            postalCode: "682020",
          },
          subtotal,
          discount,
          tax,
          deliveryFee,
          total,
          notes: "Demo order only; do not fulfil or collect real payment.",
          confirmedAt: index >= 1 && index !== 6 ? dateFromNow(-9 + index) : null,
          deliveredAt: index === 5 ? dateFromNow(-1) : null,
          cancelledAt: index === 6 ? dateFromNow(-1) : null,
          createdAt: dateFromNow(-12 + index),
        },
        update: {
          customerId: userId(index % 2 === 0 ? "customer" : "customer-two"),
          businessId: business.id,
          status,
          fulfilmentType: index % 3 === 0 ? "PICKUP" : "DELIVERY",
          deliveryAddress: index % 3 === 0 ? Prisma.JsonNull : {
            recipient: "Demo Customer",
            addressLine1: "42, Demo Residency",
            locality: "Kadavanthra",
            city: "Kochi",
            state: "Kerala",
            postalCode: "682020",
          },
          subtotal,
          discount,
          tax,
          deliveryFee,
          total,
          notes: "Demo order only; do not fulfil or collect real payment.",
          confirmedAt: index >= 1 && index !== 6 ? dateFromNow(-9 + index) : null,
          deliveredAt: index === 5 ? dateFromNow(-1) : null,
          cancelledAt: index === 6 ? dateFromNow(-1) : null,
        },
        select: { id: true },
      });
      await upsertId("orderItem", {
        id: demoId("order-item", index + 1),
        orderId: order.id,
        productId: product.id,
        variantId: product.variantId,
        nameSnapshot: product.name,
        skuSnapshot: `DEMO-${String(index + 1).padStart(2, "0")}-01-1`,
        quantity,
        unitPrice: product.price,
        total: subtotal,
      });
      const paymentStatus = paymentStatuses[index % paymentStatuses.length];
      const paymentId = demoId("payment", index + 1);
      await prisma.payment.upsert({
        where: { idempotencyKey: `demo-payment-${index + 1}` },
        create: {
          id: paymentId,
          orderId: order.id,
          provider: "DEMO_RAZORPAY",
          providerPaymentId: `pay_demo_${String(index + 1).padStart(4, "0")}`,
          idempotencyKey: `demo-payment-${index + 1}`,
          amount: total,
          currency: "INR",
          status: paymentStatus,
          capturedAt: ["CAPTURED", "REFUNDED", "PARTIALLY_REFUNDED"].includes(paymentStatus) ? dateFromNow(-2) : null,
          failedAt: paymentStatus === "FAILED" ? dateFromNow(-2) : null,
          metadata: { demo: true, orderNumber },
        },
        update: {
          orderId: order.id,
          provider: "DEMO_RAZORPAY",
          providerPaymentId: `pay_demo_${String(index + 1).padStart(4, "0")}`,
          amount: total,
          currency: "INR",
          status: paymentStatus,
          capturedAt: ["CAPTURED", "REFUNDED", "PARTIALLY_REFUNDED"].includes(paymentStatus) ? dateFromNow(-2) : null,
          failedAt: paymentStatus === "FAILED" ? dateFromNow(-2) : null,
          metadata: { demo: true, orderNumber },
        },
      });
      orders.set(index, { id: order.id, paymentId, total });
    }
    const refundStatuses = ["REQUESTED", "APPROVED", "PROCESSING", "COMPLETED", "REJECTED"] as const;
    for (let index = 0; index < refundStatuses.length; index += 1) {
      const order = orders.get(index + 5)!;
      await upsertId("refund", {
        id: demoId("refund", index + 1),
        orderId: order.id,
        paymentId: order.paymentId,
        amount: Math.round(order.total * 0.5),
        reason: `Demo refund ${index + 1} for workflow testing`,
        status: refundStatuses[index],
        providerRefundId: `rfnd_demo_${String(index + 1).padStart(4, "0")}`,
        requestedAt: dateFromNow(-5 + index),
        completedAt: refundStatuses[index] === "COMPLETED" ? dateFromNow(-1) : null,
      });
    }
    for (let index = 0; index < 6; index += 1) {
      const business = businesses.get(businessDefinitions[index].slug)!;
      const status = ["PENDING", "PROCESSING", "SETTLED", "FAILED"][index % 4];
      await upsertId("settlement", {
        id: demoId("settlement", index + 1),
        businessId: business.id,
        periodStart: dateFromNow(-30),
        periodEnd: dateFromNow(-1),
        grossAmount: 10_000 + index * 1_250,
        commissionAmount: 500 + index * 50,
        taxAmount: 90 + index * 9,
        netAmount: 9_410 + index * 1_191,
        status,
        providerSettlementId: `setl_demo_${String(index + 1).padStart(3, "0")}`,
        settledAt: status === "SETTLED" ? dateFromNow(-1) : null,
      });
    }
    const inTransitOrder = orders.get(4)!;
    const inTransitDefinition = businessDefinitions[4];
    const inTransitBusiness = businesses.get(inTransitDefinition.slug)!;
    await prisma.deliveryShipment.upsert({
      where: { orderId: inTransitOrder.id },
      create: {
        id: demoId("delivery-shipment", 1),
        orderId: inTransitOrder.id,
        businessId: inTransitBusiness.id,
        customerId: userId("customer"),
        provider: "MANUAL",
        providerRef: `manual-${inTransitOrder.id}`,
        status: "IN_TRANSIT",
        quotedAmount: 49,
        currency: "INR",
        driverName: "Demo Delivery Partner",
        driverPhone: "+919900001111",
        vehicleNumber: "KL-07-DEMO",
        providerData: { demo: true, mode: "manual" },
        requestedAt: dateFromNow(-2),
        lastSyncedAt: dateFromNow(-1),
      },
      update: {
        businessId: inTransitBusiness.id,
        customerId: userId("customer"),
        provider: "MANUAL",
        status: "IN_TRANSIT",
        quotedAmount: 49,
        driverName: "Demo Delivery Partner",
        driverPhone: "+919900001111",
        vehicleNumber: "KL-07-DEMO",
        providerData: { demo: true, mode: "manual" },
        lastSyncedAt: dateFromNow(-1),
      },
    });
    process.stdout.write("✓ every order, payment, refund state plus settlement workflows\n");

    const verificationStatuses = ["PENDING", "IN_REVIEW", "MORE_INFORMATION", "APPROVED", "REJECTED", "EXPIRED"] as const;
    for (let index = 0; index < verificationStatuses.length; index += 1) {
      const business = businesses.get(businessDefinitions[index].slug)!;
      await upsertId("verificationRequest", {
        id: demoId("verification", index + 1),
        businessId: business.id,
        requestedById: userId("business"),
        reviewerId: index === 0 ? null : userId("verification"),
        status: verificationStatuses[index],
        documentType: ["GST_CERTIFICATE", "SHOP_LICENSE", "PAN_CARD"][index % 3],
        documentKey: `demo/verification/${businessDefinitions[index].slug}/document.pdf`,
        documentHash: sha256(`demo-verification-document-${index}`),
        notes: index === 2 ? "Please upload a clearer demo document." : "Demo verification workflow record.",
        rejectionReason: index === 4 ? "Demo rejection: document mismatch." : null,
        reviewedAt: index > 0 ? dateFromNow(-5 + index) : null,
        createdAt: dateFromNow(-12 + index),
      });
    }

    const adStatuses = ["DRAFT", "SCHEDULED", "ACTIVE", "PAUSED", "COMPLETED", "REJECTED"] as const;
    for (let index = 0; index < adStatuses.length; index += 1) {
      const definition = businessDefinitions[index];
      const business = businesses.get(definition.slug)!;
      await upsertId("advertisement", {
        id: demoId("advertisement", index + 1),
        businessId: business.id,
        title: `${definition.name} demo campaign`,
        placement: ["HOME_HERO", "SEARCH_SPONSORED", "CATEGORY_BANNER"][index % 3],
        target: { category: definition.category, cities: [definition.city], demo: true },
        creativeKey: `demo/ads/${definition.slug}.jpg`,
        destination: `/business/${definition.slug}`,
        budget: 2_500 + index * 1_000,
        spent: adStatuses[index] === "ACTIVE" || adStatuses[index] === "COMPLETED" ? 900 + index * 175 : 0,
        status: adStatuses[index],
        startsAt: adStatuses[index] === "SCHEDULED" ? dateFromNow(5) : dateFromNow(-10),
        endsAt: adStatuses[index] === "COMPLETED" ? dateFromNow(-1) : dateFromNow(20),
        impressions: index * 1_250,
        clicks: index * 73,
      });
    }

    const ticketStatuses = ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "RESOLVED", "CLOSED"] as const;
    for (let index = 0; index < ticketStatuses.length; index += 1) {
      await prisma.supportTicket.upsert({
        where: { ticketNumber: `BNC-DEMO-TKT-${String(index + 1).padStart(3, "0")}` },
        create: {
          id: demoId("support-ticket", index + 1),
          ticketNumber: `BNC-DEMO-TKT-${String(index + 1).padStart(3, "0")}`,
          userId: userId(index % 2 === 0 ? "customer" : "business"),
          assignedToId: index === 0 ? null : userId("support"),
          subject: ["Unable to update address", "Product awaiting review", "Payment test failed", "Need invoice copy", "Close demo ticket"][index],
          category: ["ACCOUNT", "CATALOGUE", "PAYMENT", "ORDER", "OTHER"][index],
          priority: ["LOW", "MEDIUM", "HIGH", "URGENT", "LOW"][index],
          status: ticketStatuses[index],
          description: `Demo support ticket ${index + 1} for queue, assignment, priority, and resolution testing.`,
          metadata: { demo: true, browser: "test-suite" },
          resolvedAt: index >= 3 ? dateFromNow(-1) : null,
        },
        update: {
          userId: userId(index % 2 === 0 ? "customer" : "business"),
          assignedToId: index === 0 ? null : userId("support"),
          status: ticketStatuses[index],
          priority: ["LOW", "MEDIUM", "HIGH", "URGENT", "LOW"][index],
          metadata: { demo: true, browser: "test-suite" },
          resolvedAt: index >= 3 ? dateFromNow(-1) : null,
        },
      });
    }
    process.stdout.write("✓ every verification state, advertising state, and support-ticket state\n");

    const analyticsEventTypes = [
      "SEARCH_IMPRESSION",
      "PROFILE_VIEW",
      "CALL_CLICK",
      "WHATSAPP_CLICK",
      "DIRECTIONS_CLICK",
      "SAVE_BUSINESS",
      "ENQUIRY_START",
      "ENQUIRY_SUBMITTED",
    ] as const;
    for (let index = 0; index < analyticsEventTypes.length * 3; index += 1) {
      const definition = businessDefinitions[index % businessDefinitions.length];
      const business = businesses.get(definition.slug)!;
      await upsertId("analyticsEvent", {
        id: demoId("analytics", index + 1),
        eventType: analyticsEventTypes[index % analyticsEventTypes.length],
        sessionId: `demo-analytics-session-${Math.floor(index / 4) + 1}`,
        userId: index % 5 === 0 ? null : userId(index % 2 === 0 ? "customer" : "customer-two"),
        businessId: business.id,
        categoryId: categoryBySlug.get(definition.category)!.id,
        city: definition.city,
        locality: definition.locality,
        source: ["home", "search", "category", "business_profile"][index % 4],
        metadata: { demo: true, device: ["desktop", "mobile", "tablet"][index % 3] },
        occurredAt: dateFromNow(-21 + index),
      });
    }

    const notificationTypes = [
      "NEW_LEAD",
      "NEW_ENQUIRY",
      "CUSTOMER_RESPONSE",
      "REVIEW_RECEIVED",
      "REVIEW_REPLY",
      "ORDER_UPDATE",
      "SUBSCRIPTION_RENEWAL",
      "PAYMENT_CONFIRMATION",
      "OFFER_EXPIRY",
      "VERIFICATION_UPDATE",
      "SUPPORT_UPDATE",
    ] as const;
    const notificationChannels = ["IN_APP", "BROWSER_PUSH", "MOBILE_PUSH", "EMAIL", "SMS", "WHATSAPP"] as const;
    for (let index = 0; index < notificationTypes.length; index += 1) {
      const recipient = index < 5 ? userId("business") : userId("customer");
      await upsertId("notification", {
        id: demoId("notification", index + 1),
        userId: recipient,
        type: notificationTypes[index],
        channel: notificationChannels[index % notificationChannels.length],
        title: `Demo ${notificationTypes[index].toLowerCase().replace(/_/g, " ")}`,
        body: "This is a fictional notification for read/unread, delivery, and failure-state testing.",
        data: { demo: true, route: index % 2 === 0 ? "/account" : "/business/dashboard" },
        readAt: index % 3 === 0 ? dateFromNow(-1) : null,
        sentAt: index === 10 ? null : dateFromNow(-2),
        failedAt: index === 10 ? dateFromNow(-2) : null,
        failure: index === 10 ? "Demo provider rejection" : null,
        createdAt: dateFromNow(-5 + index / 10),
      });
    }
    for (const preferenceUser of [userId("customer"), userId("business")]) {
      for (const [index, type] of notificationTypes.entries()) {
        await prisma.notificationPreference.upsert({
          where: { userId_type: { userId: preferenceUser, type } },
          create: {
            userId: preferenceUser,
            type,
            inApp: true,
            push: index % 2 === 0,
            email: index % 3 === 0,
            sms: index === 5,
            whatsapp: index === 0 || index === 1,
          },
          update: {
            inApp: true,
            push: index % 2 === 0,
            email: index % 3 === 0,
            sms: index === 5,
            whatsapp: index === 0 || index === 1,
          },
        });
      }
    }

    const webhookStatuses = ["RECEIVED", "PROCESSING", "PROCESSED", "IGNORED", "FAILED"] as const;
    for (let index = 0; index < webhookStatuses.length; index += 1) {
      await prisma.webhookEvent.upsert({
        where: { provider_eventId: { provider: "DEMO_RAZORPAY", eventId: `evt_demo_${index + 1}` } },
        create: {
          id: demoId("webhook", index + 1),
          provider: "DEMO_RAZORPAY",
          eventId: `evt_demo_${index + 1}`,
          eventType: ["payment.captured", "payment.failed", "refund.processed"][index % 3],
          payloadHash: sha256(`demo-webhook-${index + 1}`),
          payload: { demo: true, eventIndex: index + 1 },
          status: webhookStatuses[index],
          attempts: index,
          error: webhookStatuses[index] === "FAILED" ? "Demo signature validation failure" : null,
          processedAt: webhookStatuses[index] === "PROCESSED" ? dateFromNow(-1) : null,
        },
        update: {
          eventType: ["payment.captured", "payment.failed", "refund.processed"][index % 3],
          payloadHash: sha256(`demo-webhook-${index + 1}`),
          payload: { demo: true, eventIndex: index + 1 },
          status: webhookStatuses[index],
          attempts: index,
          error: webhookStatuses[index] === "FAILED" ? "Demo signature validation failure" : null,
          processedAt: webhookStatuses[index] === "PROCESSED" ? dateFromNow(-1) : null,
        },
      });
    }
    process.stdout.write("✓ all analytics events, notification types/channels/preferences, and webhook states\n");

    const translationStatuses = ["AUTOMATIC", "REVIEWED", "MANUALLY_CORRECTED"] as const;
    for (let index = 0; index < translationStatuses.length; index += 1) {
      const definition = businessDefinitions[index];
      const business = businesses.get(definition.slug)!;
      await prisma.translation.upsert({
        where: {
          entityType_entityId_field_targetLanguage: {
            entityType: "Business",
            entityId: business.id,
            field: "description",
            targetLanguage: "ml",
          },
        },
        create: {
          id: demoId("translation", index + 1),
          entityType: "Business",
          entityId: business.id,
          field: "description",
          sourceLanguage: "en",
          targetLanguage: "ml",
          originalText: `${definition.name} demo description`,
          translatedText: `${definition.name} ഡെമോ വിവരണം`,
          provider: index === 0 ? "DEMO_AUTOMATIC" : "DEMO_EDITOR",
          status: translationStatuses[index],
          correctedAt: index === 2 ? dateFromNow(-1) : null,
          correctedById: index === 2 ? userId("moderator") : null,
        },
        update: {
          originalText: `${definition.name} demo description`,
          translatedText: `${definition.name} ഡെമോ വിവരണം`,
          provider: index === 0 ? "DEMO_AUTOMATIC" : "DEMO_EDITOR",
          status: translationStatuses[index],
          correctedAt: index === 2 ? dateFromNow(-1) : null,
          correctedById: index === 2 ? userId("moderator") : null,
        },
      });
    }

    for (const [index, consent] of ["MARKETING", "ENQUIRY_CONTACT", "ANALYTICS"].entries()) {
      await upsertId("consent", {
        id: demoId("consent", index + 1),
        userId: firstCustomer,
        type: consent,
        scope: { demo: true, channels: index === 0 ? ["email", "push"] : ["in_app"] },
        granted: index !== 0,
        source: "DEMO_SEED",
        ipAddress: "203.0.113.10",
        grantedAt: dateFromNow(-30 + index),
        withdrawnAt: index === 0 ? dateFromNow(-5) : null,
      });
    }
    for (let index = 0; index < 2; index += 1) {
      await upsertId("refreshSession", {
        id: demoId("refresh-session", index + 1),
        userId: firstCustomer,
        tokenHash: sha256(`non-login-demo-refresh-token-${index + 1}`),
        deviceName: index === 0 ? "Demo mobile browser" : "Demo expired tablet",
        ipAddress: "203.0.113.10",
        userAgent: "BNC-Demo-Seed/1.0",
        expiresAt: index === 0 ? dateFromNow(14) : dateFromNow(-2),
        revokedAt: index === 0 ? null : dateFromNow(-3),
        lastUsedAt: dateFromNow(-1 - index),
      });
    }

    for (let version = 1; version <= 2; version += 1) {
      await prisma.rankingConfiguration.upsert({
        where: { version },
        create: {
          id: demoId("ranking", version),
          name: version === 1 ? "Demo baseline ranking" : "Demo balanced marketplace ranking",
          version,
          weights:
            version === 1
              ? { relevance: 0.4, distance: 0.2, rating: 0.2, responseRate: 0.1, completeness: 0.1 }
              : { relevance: 0.35, distance: 0.2, rating: 0.2, responseRate: 0.1, completeness: 0.1, sponsored: 0.05 },
          active: version === 2,
          createdById: userId("admin"),
          reason: "Demo ranking configuration for admin test coverage",
          activatedAt: version === 2 ? dateFromNow(-10) : null,
        },
        update: {
          name: version === 1 ? "Demo baseline ranking" : "Demo balanced marketplace ranking",
          weights:
            version === 1
              ? { relevance: 0.4, distance: 0.2, rating: 0.2, responseRate: 0.1, completeness: 0.1 }
              : { relevance: 0.35, distance: 0.2, rating: 0.2, responseRate: 0.1, completeness: 0.1, sponsored: 0.05 },
          active: version === 2,
          createdById: userId("admin"),
          reason: "Demo ranking configuration for admin test coverage",
          activatedAt: version === 2 ? dateFromNow(-10) : null,
        },
      });
    }

    const chapterDefinitions = [
      { slug: "kochi-founders", name: "Kochi Founders Chapter", city: "Kochi", district: "Ernakulam", description: "A private B2B chapter for eligible BNC businesses in and around Kochi." },
      { slug: "kozhikode-growth", name: "Kozhikode Growth Chapter", city: "Kozhikode", district: "Kozhikode", description: "Local business referrals, collaboration and chapter discussions for North Kerala members." },
      { slug: "thrissur-trade", name: "Thrissur Trade Chapter", city: "Thrissur", district: "Thrissur", description: "A trusted chapter for trade, services and professional collaboration." },
    ];
    for (const chapter of chapterDefinitions) {
      await prisma.clubChapter.upsert({
        where: { slug: chapter.slug },
        create: { id: demoId("club-chapter", chapter.slug), ...chapter },
        update: { ...chapter, isActive: true },
      });
    }
    const eligibleClubBusiness = await prisma.business.findFirst({
      where: {
        OR: [{ id: { startsWith: DEMO_PREFIX } }, { slug: "bnc-demo-services-0807" }],
        subscriptions: {
          some: {
            status: { in: ["TRIAL", "ACTIVE", "GRACE_PERIOD"] },
            currentPeriodEnd: { gte: now },
            plan: { starLevel: { gte: 4 } },
          },
        },
      },
      select: { id: true, owner: { select: { userId: true } } },
    });
    if (eligibleClubBusiness) {
      const membership = await prisma.clubMembership.upsert({
        where: {
          chapterId_businessId: {
            chapterId: demoId("club-chapter", "kochi-founders"),
            businessId: eligibleClubBusiness.id,
          },
        },
        create: {
          id: demoId("club-membership", 1),
          chapterId: demoId("club-chapter", "kochi-founders"),
          businessId: eligibleClubBusiness.id,
          userId: eligibleClubBusiness.owner.userId,
        },
        update: { status: "ACTIVE", userId: eligibleClubBusiness.owner.userId },
      });
      await upsertId("clubMessage", {
        id: demoId("club-message", 1),
        chapterId: demoId("club-chapter", "kochi-founders"),
        senderId: eligibleClubBusiness.owner.userId,
        body:
          "Welcome to the fictional Kochi chapter chat. Use this thread to test member-only B2B discussions.",
        createdAt: dateFromNow(-1),
      });
      await upsertId("clubEvent", {
        id: demoId("club-event", 1),
        chapterId: demoId("club-chapter", "kochi-founders"),
        createdById: eligibleClubBusiness.owner.userId,
        title: "Kochi Demo Referral Meetup",
        description:
          "A fictional member meetup for testing Business Club events, capacity and RSVP workflows.",
        venue: "BNC Demo Chapter Hall, Kochi",
        startsAt: dateFromNow(10, 120),
        endsAt: dateFromNow(10, 240),
        capacity: 40,
        status: "PUBLISHED",
      });
      await prisma.clubEventRegistration.upsert({
        where: {
          eventId_membershipId: {
            eventId: demoId("club-event", 1),
            membershipId: membership.id,
          },
        },
        create: {
          id: demoId("club-event-registration", 1),
          eventId: demoId("club-event", 1),
          membershipId: membership.id,
        },
        update: { status: "ATTENDING" },
      });
      await upsertId("clubReferral", {
        id: demoId("club-referral", 1),
        chapterId: demoId("club-chapter", "kochi-founders"),
        membershipId: membership.id,
        createdById: eligibleClubBusiness.owner.userId,
        contactName: "Kochi Demo Buyer",
        referredBusiness: "Demo Hospitality Procurement",
        phone: "+919900002222",
        email: "club.referral.demo@example.com",
        notes:
          "Fictional chapter referral for testing introduction and conversion tracking.",
        status: "CONTACTED",
        createdAt: dateFromNow(-2),
      });
    }

    await prisma.weeklyDraw.upsert({
      where: { id: demoId("weekly-draw", "open") },
      create: {
        id: demoId("weekly-draw", "open"),
        title: "BNC Friday Local Shopping Reward",
        prizeDescription: "₹2,500 local shopping voucher",
        weekStartsAt: dateFromNow(-2),
        weekEndsAt: dateFromNow(5),
        status: "OPEN",
      },
      update: {
        title: "BNC Friday Local Shopping Reward",
        prizeDescription: "₹2,500 local shopping voucher",
        status: "OPEN",
      },
    });
    const priorWinningOrder = await prisma.order.findFirst({
      where: { orderNumber: { startsWith: "BNC-DEMO-" }, status: "DELIVERED" },
      orderBy: { createdAt: "asc" },
      select: { id: true, customerId: true },
    });
    if (priorWinningOrder) {
      const candidateSnapshot = [{
        orderId: priorWinningOrder.id,
        orderNumber: "BNC-DEMO-0006",
        userId: priorWinningOrder.customerId,
        source: "COMPLETED_ORDER",
        activityOrdinal: 0,
      }];
      const candidateHash = sha256(JSON.stringify(candidateSnapshot));
      const selectionSeed = sha256(`${DEMO_PREFIX}-weekly-draw-seed`);
      const selectionHash = createHmac("sha256", selectionSeed)
        .update(`${demoId("weekly-draw", "published")}:${candidateHash}:1`)
        .digest("hex");
      await prisma.weeklyDraw.upsert({
        where: { id: demoId("weekly-draw", "published") },
        create: {
          id: demoId("weekly-draw", "published"),
          title: "BNC Weekly Customer Reward",
          prizeDescription: "₹1,000 local dining voucher",
          weekStartsAt: dateFromNow(-14),
          weekEndsAt: dateFromNow(-7),
          status: "PUBLISHED",
          winnerOrderId: priorWinningOrder.id,
          winnerUserId: priorWinningOrder.customerId,
          selectedAt: dateFromNow(-6),
          publishedAt: dateFromNow(-6),
          eligibilitySnapshot: candidateSnapshot,
          candidateHash,
          selectionSeed,
          selectionHash,
          selectionIndex: 0,
          candidateCount: 1,
          usageEventCount: 0,
          selectionAlgorithm: "HMAC_SHA256_V1",
        },
        update: {
          title: "BNC Weekly Customer Reward",
          prizeDescription: "₹1,000 local dining voucher",
          status: "PUBLISHED",
          winnerOrderId: priorWinningOrder.id,
          winnerUserId: priorWinningOrder.customerId,
          selectedAt: dateFromNow(-6),
          publishedAt: dateFromNow(-6),
          eligibilitySnapshot: candidateSnapshot,
          candidateHash,
          selectionSeed,
          selectionHash,
          selectionIndex: 0,
          candidateCount: 1,
          usageEventCount: 0,
          selectionAlgorithm: "HMAC_SHA256_V1",
        },
      });
    }
    process.stdout.write("✓ Business Club chapters and weekly draw records\n");

    let previousHash: string | null = null;
    for (let index = 0; index < 4; index += 1) {
      const entryHash = sha256(`${DEMO_PREFIX}-audit-${index + 1}`);
      await prisma.auditLog.upsert({
        where: { entryHash },
        create: {
          id: demoId("audit", index + 1),
          actorId: userId(index === 0 ? "admin" : index === 1 ? "moderator" : "business"),
          action: ["DEMO_SEED_STARTED", "PRODUCT_MODERATED", "BUSINESS_PROFILE_UPDATED", "DEMO_SEED_VERIFIED"][index],
          entityType: ["SeedRun", "Product", "Business", "SeedRun"][index],
          entityId: index === 1 ? products.get(`${businessDefinitions[0].slug}:0`)!.id : index === 2 ? businesses.get(businessDefinitions[0].slug)!.id : DEMO_PREFIX,
          reason: "Explicit live demo production-testing dataset",
          before: index === 0 ? undefined : { demo: true, state: "before" },
          after: { demo: true, state: "after", seed: DEMO_PREFIX },
          ipAddress: "203.0.113.10",
          userAgent: "BNC-Demo-Seed/1.0",
          requestId: `demo-seed-request-${index + 1}`,
          previousHash,
          entryHash,
          createdAt: dateFromNow(-4 + index),
        },
        update: {
          reason: "Explicit live demo production-testing dataset",
          before: index === 0 ? undefined : { demo: true, state: "before" },
          after: { demo: true, state: "after", seed: DEMO_PREFIX },
          previousHash,
        },
      });
      previousHash = entryHash;
    }
    process.stdout.write("✓ translations, consent, inert session records, ranking configurations, and audit trail\n");

    const modelCounts = await Promise.all([
      prisma.user.count({ where: { email: { contains: ".demo.0807@" } } }),
      prisma.category.count({ where: { id: { startsWith: DEMO_PREFIX } } }),
      prisma.business.count({ where: { OR: [{ id: { startsWith: DEMO_PREFIX } }, { slug: "bnc-demo-services-0807" }] } }),
      prisma.product.count({ where: { business: { OR: [{ id: { startsWith: DEMO_PREFIX } }, { slug: "bnc-demo-services-0807" }] } } }),
      prisma.service.count({ where: { business: { OR: [{ id: { startsWith: DEMO_PREFIX } }, { slug: "bnc-demo-services-0807" }] } } }),
      prisma.offer.count({ where: { id: { startsWith: DEMO_PREFIX } } }),
      prisma.lead.count({ where: { id: { startsWith: DEMO_PREFIX } } }),
      prisma.enquiry.count({ where: { id: { startsWith: DEMO_PREFIX } } }),
      prisma.review.count({ where: { id: { startsWith: DEMO_PREFIX } } }),
      prisma.order.count({ where: { orderNumber: { startsWith: "BNC-DEMO-" } } }),
      prisma.notification.count({ where: { id: { startsWith: DEMO_PREFIX } } }),
      prisma.analyticsEvent.count({ where: { id: { startsWith: DEMO_PREFIX } } }),
      prisma.job.count({ where: { id: { startsWith: DEMO_PREFIX } } }),
      prisma.booking.count({ where: { id: { startsWith: DEMO_PREFIX } } }),
      prisma.businessReferral.count({ where: { id: { startsWith: DEMO_PREFIX } } }),
    ]);
    const summary = {
      users: modelCounts[0],
      categories: modelCounts[1],
      businesses: modelCounts[2],
      products: modelCounts[3],
      services: modelCounts[4],
      offers: modelCounts[5],
      leads: modelCounts[6],
      enquiries: modelCounts[7],
      reviews: modelCounts[8],
      orders: modelCounts[9],
      notifications: modelCounts[10],
      analyticsEvents: modelCounts[11],
      jobs: modelCounts[12],
      bookings: modelCounts[13],
      referrals: modelCounts[14],
    };
    process.stdout.write(`DEMO_SEED_SUMMARY=${JSON.stringify(summary)}\n`);
    process.stdout.write("Live demo dataset is ready and can be safely rerun.\n");
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.stack ?? error.message : "Live demo seed failed."}\n`,
  );
  process.exitCode = 1;
});
