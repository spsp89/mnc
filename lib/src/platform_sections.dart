class PlatformSectionData {
  const PlatformSectionData({
    required this.id,
    required this.label,
    required this.eyebrow,
    required this.title,
    required this.description,
    required this.emoji,
    required this.accentHex,
    required this.highlights,
    this.imageHint,
    this.badge,
  });

  final String id;
  final String label;
  final String eyebrow;
  final String title;
  final String description;
  final String emoji;
  final String accentHex;
  final List<String> highlights;
  final String? imageHint;
  final String? badge;
}

const platformSections = [
  PlatformSectionData(
    id: 'discover',
    label: 'Discover · B2C',
    eyebrow: 'Local shopping',
    title: 'Find shops, services and offers nearby',
    description:
        'Search trusted neighbourhood businesses, surface daily offers and browse featured local discovery in one flow.',
    emoji: 'B2C',
    accentHex: '#C9A227',
    highlights: ['Nearby search', 'Daily offers', 'Featured businesses'],
    imageHint: 'grocery',
    badge: 'Live',
  ),
  PlatformSectionData(
    id: 'card',
    label: 'Business Card',
    eyebrow: 'Digital profile',
    title: 'One business card you can share anywhere',
    description:
        'Give every merchant a branded profile with gallery, contact actions, map, timings and social links.',
    emoji: 'ID',
    accentHex: '#1C4EA1',
    highlights: ['QR-ready profile', 'Gallery + map', 'Call and WhatsApp'],
    imageHint: 'tailor',
    badge: 'Profile',
  ),
  PlatformSectionData(
    id: 'b2b',
    label: 'B2B Network',
    eyebrow: 'Source and sell',
    title: 'Procurement network for member businesses',
    description:
        'Help merchants discover suppliers, compare wholesale offers and raise RFQs inside the BNC network.',
    emoji: 'B2B',
    accentHex: '#0B2F74',
    highlights: ['Supplier discovery', 'Wholesale offers', 'RFQ workflow'],
    imageHint: 'electronics',
    badge: 'Network',
  ),
  PlatformSectionData(
    id: 'jobs',
    label: 'Jobs',
    eyebrow: 'Local hiring',
    title: 'Jobs and local talent in one stream',
    description:
        'Post openings, scan mini candidate profiles and hire faster with a local mini-LinkedIn experience.',
    emoji: 'JOB',
    accentHex: '#1F7A4A',
    highlights: ['Job posting', 'Talent cards', 'Local availability'],
    imageHint: 'worker',
    badge: 'Hiring',
  ),
  PlatformSectionData(
    id: 'winner',
    label: 'Be A Winner',
    eyebrow: 'Engagement loop',
    title: 'Weekly prize draws powered by local sponsors',
    description:
        'Boost repeat visits with sponsor-backed prizes, scan-based entries and winner announcements.',
    emoji: 'WIN',
    accentHex: '#CA3433',
    highlights: ['Weekly draws', 'Sponsor spotlight', 'Winner stories'],
    imageHint: 'restaurant',
    badge: 'Live Draw',
  ),
  PlatformSectionData(
    id: 'feed',
    label: 'Community Feed',
    eyebrow: 'Town noticeboard',
    title: 'A community feed for updates near you',
    description:
        'Publish launches, events, offer drops and merchant announcements in a single local feed.',
    emoji: 'FEED',
    accentHex: '#A75C00',
    highlights: ['Launch posts', 'Offer updates', 'Community stories'],
    imageHint: 'beauty',
    badge: 'Feed',
  ),
  PlatformSectionData(
    id: 'plans',
    label: 'Plans',
    eyebrow: 'Pricing',
    title: 'Reach-based plans for shops and suppliers',
    description:
        'Scale from Starter to Ruby with wider reach, better ranking, analytics and campaign options.',
    emoji: 'PLAN',
    accentHex: '#8A5B00',
    highlights: ['Starter to Ruby', 'Reach-based pricing', 'Supplier plans'],
    badge: 'Pricing',
  ),
  PlatformSectionData(
    id: 'merchant',
    label: 'Merchant Dashboard',
    eyebrow: 'Merchant view',
    title: 'One dashboard across B2C, B2B and jobs',
    description:
        'Track leads, manage gallery, monitor reviews, review orders and publish jobs from one place.',
    emoji: 'DASH',
    accentHex: '#163E73',
    highlights: ['Lead insights', 'Media controls', 'Three business modes'],
    imageHint: 'tailor',
    badge: 'Dashboard',
  ),
  PlatformSectionData(
    id: 'admin',
    label: 'Admin & Partners',
    eyebrow: 'Operations',
    title: 'Run admins, partners and approvals from one panel',
    description:
        'Coordinate approvals, partner roles, plan status and network-wide activity from a central panel.',
    emoji: 'ADMIN',
    accentHex: '#5A606A',
    highlights: ['Approvals', 'Partner roles', 'Network controls'],
    badge: 'Admin',
  ),
  PlatformSectionData(
    id: 'explain',
    label: 'Explanations',
    eyebrow: 'Founders note',
    title: 'Explain the concept, growth loop and monetization',
    description:
        'Document how discovery, B2B, jobs, winner campaigns and pricing fit together in one local platform.',
    emoji: 'NOTE',
    accentHex: '#7D2232',
    highlights: ['Concept notes', 'Growth flywheel', 'Monetization model'],
    badge: 'Vision',
  ),
];
