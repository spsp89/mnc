export type PlatformSection = {
  id: string;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  emoji: string;
  accent: string;
  highlights: string[];
  imageHint?: string;
  badge?: string;
};

export const platformSections: PlatformSection[] = [
  {
    id: "discover",
    label: "Discover · B2C",
    eyebrow: "Local shopping",
    title: "Find shops, services and offers nearby",
    description:
      "Search trusted neighbourhood businesses, surface daily offers and browse featured local discovery in one flow.",
    emoji: "B2C",
    accent: "#C9A227",
    highlights: ["Nearby search", "Daily offers", "Featured businesses"],
    imageHint: "grocery",
    badge: "Live",
  },
  {
    id: "card",
    label: "Business Card",
    eyebrow: "Digital profile",
    title: "One business card you can share anywhere",
    description:
      "Give every merchant a branded profile with gallery, contact actions, map, timings and social links.",
    emoji: "ID",
    accent: "#1C4EA1",
    highlights: ["QR-ready profile", "Gallery + map", "Call and WhatsApp"],
    imageHint: "tailor",
    badge: "Profile",
  },
  {
    id: "b2b",
    label: "B2B Network",
    eyebrow: "Source and sell",
    title: "Procurement network for member businesses",
    description:
      "Help merchants discover suppliers, compare wholesale offers and raise RFQs inside the BNC network.",
    emoji: "B2B",
    accent: "#0B2F74",
    highlights: ["Supplier discovery", "Wholesale offers", "RFQ workflow"],
    imageHint: "electronics",
    badge: "Network",
  },
  {
    id: "jobs",
    label: "Jobs",
    eyebrow: "Local hiring",
    title: "Jobs and local talent in one stream",
    description:
      "Post openings, scan mini candidate profiles and hire faster with a local mini-LinkedIn experience.",
    emoji: "JOB",
    accent: "#1F7A4A",
    highlights: ["Job posting", "Talent cards", "Local availability"],
    imageHint: "worker",
    badge: "Hiring",
  },
  {
    id: "winner",
    label: "Be A Winner",
    eyebrow: "Engagement loop",
    title: "Weekly prize draws powered by local sponsors",
    description:
      "Boost repeat visits with sponsor-backed prizes, scan-based entries and winner announcements.",
    emoji: "WIN",
    accent: "#CA3433",
    highlights: ["Weekly draws", "Sponsor spotlight", "Winner stories"],
    imageHint: "restaurant",
    badge: "Live Draw",
  },
  {
    id: "feed",
    label: "Community Feed",
    eyebrow: "Town noticeboard",
    title: "A community feed for updates near you",
    description:
      "Publish launches, events, offer drops and merchant announcements in a single local feed.",
    emoji: "FEED",
    accent: "#A75C00",
    highlights: ["Launch posts", "Offer updates", "Community stories"],
    imageHint: "beauty",
    badge: "Feed",
  },
  {
    id: "plans",
    label: "Plans",
    eyebrow: "Pricing",
    title: "Reach-based plans for shops and suppliers",
    description:
      "Scale from Starter to Ruby with wider reach, better ranking, analytics and campaign options.",
    emoji: "PLAN",
    accent: "#8A5B00",
    highlights: ["Starter to Ruby", "Reach-based pricing", "Supplier plans"],
    badge: "Pricing",
  },
  {
    id: "merchant",
    label: "Merchant Dashboard",
    eyebrow: "Merchant view",
    title: "One dashboard across B2C, B2B and jobs",
    description:
      "Track leads, manage gallery, monitor reviews, review orders and publish jobs from one place.",
    emoji: "DASH",
    accent: "#163E73",
    highlights: ["Lead insights", "Media controls", "Three business modes"],
    imageHint: "tailor",
    badge: "Dashboard",
  },
  {
    id: "admin",
    label: "Admin & Partners",
    eyebrow: "Operations",
    title: "Run admins, partners and approvals from one panel",
    description:
      "Coordinate approvals, partner roles, plan status and network-wide activity from a central panel.",
    emoji: "ADMIN",
    accent: "#5A606A",
    highlights: ["Approvals", "Partner roles", "Network controls"],
    badge: "Admin",
  },
  {
    id: "explain",
    label: "Explanations",
    eyebrow: "Founders note",
    title: "Explain the concept, growth loop and monetization",
    description:
      "Document how discovery, B2B, jobs, winner campaigns and pricing fit together in one local platform.",
    emoji: "NOTE",
    accent: "#7D2232",
    highlights: ["Concept notes", "Growth flywheel", "Monetization model"],
    badge: "Vision",
  },
];
