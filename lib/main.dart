import 'dart:async';

import 'package:flutter/material.dart';

import 'src/catalog_models.dart';
import 'src/catalog_seed.dart';
import 'src/catalog_service.dart';
import 'src/platform_sections.dart';

const brandNavy = Color(0xFF0B2F74);
const brandNavyDeep = Color(0xFF041C55);
const brandNavyBright = Color(0xFF1C4EA1);
const brandGold = Color(0xFFF4B227);
const brandGoldDeep = Color(0xFFC78908);
const brandCanvas = Color(0xFFF8F6EF);
const brandSurface = Color(0xFFFFFCF7);
const brandSoft = Color(0xFFF2F5FB);
const brandLine = Color(0xFFE4E8F1);
const brandMuted = Color(0xFF6B7E9D);
const brandHeroText = Color(0xFFDEE7FF);

void main() {
  runApp(const NearuApp());
}

class NearuApp extends StatelessWidget {
  const NearuApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'BNC',
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: brandCanvas,
        colorScheme: ColorScheme.fromSeed(
          seedColor: brandGold,
          brightness: Brightness.light,
        ),
        fontFamily: 'Segoe UI',
      ),
      home: const BncLaunchFlow(),
    );
  }
}

class BncLaunchFlow extends StatefulWidget {
  const BncLaunchFlow({super.key});

  @override
  State<BncLaunchFlow> createState() => _BncLaunchFlowState();
}

class _BncLaunchFlowState extends State<BncLaunchFlow> {
  bool _showHome = false;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer(const Duration(milliseconds: 1800), () {
      if (!mounted) {
        return;
      }

      setState(() {
        _showHome = true;
      });
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 420),
      child: _showHome
          ? const NearuHomePage()
          : const BncSplashScreen(key: ValueKey('bnc-splash')),
    );
  }
}

class BncSplashScreen extends StatelessWidget {
  const BncSplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [brandNavyDeep, brandNavy, brandNavyBright],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 28),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 182,
                    height: 182,
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.96),
                      borderRadius: BorderRadius.circular(42),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x3301184A),
                          blurRadius: 34,
                          offset: Offset(0, 18),
                        ),
                      ],
                    ),
                    child: Image.asset(
                      'assets/branding/bnc-logo.png',
                      fit: BoxFit.contain,
                    ),
                  ),
                  const SizedBox(height: 28),
                  const Text(
                    'BNC',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 32,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Launching your premium local marketplace',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.84),
                      fontSize: 15,
                      height: 1.45,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 28),
                  const SizedBox(
                    width: 28,
                    height: 28,
                    child: CircularProgressIndicator(
                      strokeWidth: 3,
                      valueColor: AlwaysStoppedAnimation<Color>(brandGold),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class NearuHomePage extends StatefulWidget {
  const NearuHomePage({super.key});

  @override
  State<NearuHomePage> createState() => _NearuHomePageState();
}

class _NearuHomePageState extends State<NearuHomePage> {
  final CatalogService _catalogService = CatalogService();

  CatalogData _catalog = fallbackCatalog;
  bool _usingFallback = false;

  @override
  void initState() {
    super.initState();
    _refreshCatalog();
  }

  Future<void> _refreshCatalog() async {
    try {
      final catalog = await _catalogService.fetchCatalog();
      if (!mounted) {
        return;
      }

      setState(() {
        _catalog = catalog;
        _usingFallback = false;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }

      setState(() {
        _catalog = fallbackCatalog;
        _usingFallback = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final usePreviewShell = constraints.maxWidth > 500;

        Widget screen = _MobileHomeScreen(
          catalog: _catalog,
          usingFallback: _usingFallback,
          onRefresh: _refreshCatalog,
          showPreviewChrome: usePreviewShell,
        );

        if (usePreviewShell) {
          screen = Center(
            child: Container(
              width: 430,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.black,
                borderRadius: BorderRadius.circular(44),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x29000000),
                    blurRadius: 34,
                    offset: Offset(0, 20),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(36),
                child: screen,
              ),
            ),
          );
        }

        return Scaffold(
          backgroundColor: usePreviewShell ? brandSoft : brandCanvas,
          body: SafeArea(top: !usePreviewShell, bottom: false, child: screen),
        );
      },
    );
  }
}

class _MobileHomeScreen extends StatelessWidget {
  const _MobileHomeScreen({
    required this.catalog,
    required this.usingFallback,
    required this.onRefresh,
    required this.showPreviewChrome,
  });

  final CatalogData catalog;
  final bool usingFallback;
  final Future<void> Function() onRefresh;
  final bool showPreviewChrome;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: brandSurface,
      body: Stack(
        children: [
          RefreshIndicator(
            color: brandNavy,
            onRefresh: onRefresh,
            child: CustomScrollView(
              physics: const BouncingScrollPhysics(
                parent: AlwaysScrollableScrollPhysics(),
              ),
              slivers: [
                SliverToBoxAdapter(
                  child: _BncMarketplaceHome(
                    catalog: catalog,
                    usingFallback: usingFallback,
                    onRefresh: onRefresh,
                    showPreviewChrome: showPreviewChrome,
                  ),
                ),
              ],
            ),
          ),
          const Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: _BottomNavigationBar(),
          ),
        ],
      ),
    );
  }
}

class _BncCategorySpec {
  const _BncCategorySpec(this.label, this.icon, this.color, this.tint);

  final String label;
  final IconData icon;
  final Color color;
  final Color tint;
}

class _BncDealSpec {
  const _BncDealSpec({
    required this.badge,
    required this.badgeColor,
    required this.title,
    required this.text,
    required this.shop,
    required this.asset,
    required this.colors,
  });

  final String badge;
  final Color badgeColor;
  final String title;
  final String text;
  final String shop;
  final String asset;
  final List<Color> colors;
}

class _BncShopSpec {
  const _BncShopSpec({
    required this.name,
    required this.category,
    required this.rating,
    required this.reviews,
    required this.distance,
    required this.asset,
    required this.badge,
    required this.badgeColor,
  });

  final String name;
  final String category;
  final String rating;
  final String reviews;
  final String distance;
  final String asset;
  final String badge;
  final Color badgeColor;
}

class _BncOfferSpec {
  const _BncOfferSpec({
    required this.title,
    required this.text,
    required this.shop,
    required this.code,
    required this.asset,
    required this.colors,
  });

  final String title;
  final String text;
  final String shop;
  final String code;
  final String asset;
  final List<Color> colors;
}

class _BncRankedSpec {
  const _BncRankedSpec({
    required this.rank,
    required this.name,
    required this.category,
    required this.rating,
    required this.reviews,
    required this.distance,
    required this.asset,
  });

  final int rank;
  final String name;
  final String category;
  final String rating;
  final String reviews;
  final String distance;
  final String asset;
}

class _BncEcosystemSpec {
  const _BncEcosystemSpec(this.title, this.text, this.icon);

  final String title;
  final String text;
  final IconData icon;
}

const _mockupPath = 'nearu-web/public/mockup';

const _bncCategories = [
  _BncCategorySpec(
    'Grocery',
    Icons.shopping_cart_outlined,
    Color(0xFFF2A715),
    Color(0xFFFFF6DF),
  ),
  _BncCategorySpec(
    'Restaurant',
    Icons.restaurant_menu_rounded,
    brandNavy,
    Color(0xFFF3F6FB),
  ),
  _BncCategorySpec(
    'Bakery',
    Icons.cake_outlined,
    Color(0xFFF2A715),
    Color(0xFFFFF6DF),
  ),
  _BncCategorySpec(
    'Textiles',
    Icons.shopping_bag_outlined,
    brandNavy,
    Color(0xFFF3F6FB),
  ),
  _BncCategorySpec(
    'Beauty',
    Icons.brush_outlined,
    Color(0xFFD34C90),
    Color(0xFFFFF0F7),
  ),
  _BncCategorySpec(
    'Mobile',
    Icons.phone_android_outlined,
    Color(0xFF254FB3),
    Color(0xFFF1F4FF),
  ),
  _BncCategorySpec(
    'Electronics',
    Icons.desktop_windows_outlined,
    brandNavy,
    Color(0xFFF3F6FB),
  ),
  _BncCategorySpec(
    'Home Services',
    Icons.home_repair_service_outlined,
    brandNavy,
    Color(0xFFF3F6FB),
  ),
  _BncCategorySpec(
    'More',
    Icons.grid_view_rounded,
    brandNavy,
    Color(0xFFF7F4EE),
  ),
];

const _bncDeals = [
  _BncDealSpec(
    badge: '20% OFF',
    badgeColor: Color(0xFF25A451),
    title: 'Weekend Special',
    text: 'Get 20% off on all bakery items',
    shop: 'Sweet Bakery',
    asset: '$_mockupPath/im-bakery.jpg',
    colors: [Color(0xFFEDFBEA), Colors.white, Color(0xFFE9F8EA)],
  ),
  _BncDealSpec(
    badge: 'Rs599',
    badgeColor: Color(0xFF2565C7),
    title: 'Limited Time Offer',
    text: 'Full body health checkup at just Rs599',
    shop: 'City Care Lab',
    asset: '$_mockupPath/im-pharmacy.jpg',
    colors: [Color(0xFFEEF5FF), Colors.white, Color(0xFFE7F0FF)],
  ),
  _BncDealSpec(
    badge: '15% OFF',
    badgeColor: Color(0xFFF3A51A),
    title: 'Fashion Fiesta',
    text: 'Flat 15% off on all men wear',
    shop: 'Royale Tailors',
    asset: '$_mockupPath/im-card_suit.jpg',
    colors: [Color(0xFFFFF2D8), Colors.white, Color(0xFFFFF0CE)],
  ),
  _BncDealSpec(
    badge: 'B1G1',
    badgeColor: Color(0xFF7242B8),
    title: 'Buy 1 Get 1',
    text: 'On selected burgers and fries',
    shop: 'ALUKKY Hotel',
    asset: '$_mockupPath/im-restaurant.jpg',
    colors: [Color(0xFFF4EAFF), Colors.white, Color(0xFFEADCFF)],
  ),
];

const _featuredBncShops = [
  _BncShopSpec(
    name: 'Rajeevan Tailors',
    category: 'Tailor / Clothing',
    rating: '4.6',
    reviews: '126',
    distance: '1.2 km',
    asset: '$_mockupPath/im-tailor.jpg',
    badge: 'Star Shop',
    badgeColor: Color(0xFF2469D6),
  ),
  _BncShopSpec(
    name: 'ALUKKY Hotel',
    category: 'Restaurant',
    rating: '4.7',
    reviews: '89',
    distance: '1.5 km',
    asset: '$_mockupPath/im-restaurant.jpg',
    badge: 'Popular',
    badgeColor: Color(0xFFF4A51C),
  ),
  _BncShopSpec(
    name: 'Sweet Bakery',
    category: 'Bakery',
    rating: '4.5',
    reviews: '162',
    distance: '2.1 km',
    asset: '$_mockupPath/im-bakery.jpg',
    badge: 'Top Rated',
    badgeColor: Color(0xFFD94842),
  ),
  _BncShopSpec(
    name: 'Star Jewelers',
    category: 'Jewelry',
    rating: '4.6',
    reviews: '98',
    distance: '2.4 km',
    asset: '$_mockupPath/im-jewellery.jpg',
    badge: 'Star Shop',
    badgeColor: Color(0xFF2469D6),
  ),
  _BncShopSpec(
    name: 'Hanga Mobiles',
    category: 'Mobile Store',
    rating: '4.4',
    reviews: '113',
    distance: '2.6 km',
    asset: '$_mockupPath/im-mobile.jpg',
    badge: 'Popular',
    badgeColor: Color(0xFFF4A51C),
  ),
];

const _allBncShops = [
  ..._featuredBncShops,
  _BncShopSpec(
    name: 'Thache Electronics',
    category: 'Electronics',
    rating: '4.3',
    reviews: '77',
    distance: '2.8 km',
    asset: '$_mockupPath/im-electronics.jpg',
    badge: 'Offer',
    badgeColor: Color(0xFFD94842),
  ),
  _BncShopSpec(
    name: 'Fresh Basket',
    category: 'Grocery',
    rating: '4.6',
    reviews: '152',
    distance: '3.0 km',
    asset: '$_mockupPath/im-vegetables.jpg',
    badge: 'New',
    badgeColor: Color(0xFF25A451),
  ),
  _BncShopSpec(
    name: 'Spice Garden',
    category: 'Restaurant / Cafe',
    rating: '4.6',
    reviews: '126',
    distance: '3.2 km',
    asset: '$_mockupPath/im-restaurant.jpg',
    badge: 'Offer',
    badgeColor: Color(0xFFD94842),
  ),
  _BncShopSpec(
    name: 'Maya Beauty Salon',
    category: 'Beauty Salon',
    rating: '4.7',
    reviews: '76',
    distance: '3.4 km',
    asset: '$_mockupPath/im-beauty.jpg',
    badge: 'Popular',
    badgeColor: Color(0xFFF4A51C),
  ),
  _BncShopSpec(
    name: 'Quick Mart',
    category: 'Grocery Store',
    rating: '4.6',
    reviews: '98',
    distance: '3.6 km',
    asset: '$_mockupPath/im-supermarket.jpg',
    badge: 'New',
    badgeColor: Color(0xFF25A451),
  ),
  _BncShopSpec(
    name: 'Tech Hub',
    category: 'Electronics Store',
    rating: '4.5',
    reviews: '124',
    distance: '3.8 km',
    asset: '$_mockupPath/im-electronics.jpg',
    badge: 'Top Rated',
    badgeColor: Color(0xFFD94842),
  ),
  _BncShopSpec(
    name: 'HomeFix Pro',
    category: 'Home Services',
    rating: '4.6',
    reviews: '53',
    distance: '4.0 km',
    asset: '$_mockupPath/im-electrical.jpg',
    badge: 'Offer',
    badgeColor: Color(0xFFF4A51C),
  ),
];

const _bncOffers = [
  _BncOfferSpec(
    title: '20% Off',
    text: 'On all home cleaning services',
    shop: 'HomeFix Pro',
    code: 'CLEAN20',
    asset: '$_mockupPath/im-occ_helper.jpg',
    colors: [Color(0xFF08713F), Color(0xFF0B5636)],
  ),
  _BncOfferSpec(
    title: 'Rs599 Offer',
    text: 'Hair Spa + Haircut Combo',
    shop: 'Maya Beauty Salon',
    code: 'SPA599',
    asset: '$_mockupPath/im-occ_beauty.jpg',
    colors: [Color(0xFF12459B), Color(0xFF092B70)],
  ),
  _BncOfferSpec(
    title: '15% Off',
    text: 'On all fresh vegetables',
    shop: 'Fresh Basket',
    code: 'VEG15',
    asset: '$_mockupPath/im-vegetables.jpg',
    colors: [Color(0xFFCB790B), Color(0xFF8A4D04)],
  ),
  _BncOfferSpec(
    title: 'B1G1',
    text: 'Buy 1 Get 1 on pizzas',
    shop: 'Spice Garden',
    code: 'PIZZA1',
    asset: '$_mockupPath/im-restaurant.jpg',
    colors: [Color(0xFF08713F), Color(0xFF064D2E)],
  ),
  _BncOfferSpec(
    title: 'Festival Offer',
    text: 'Up to 30% off on selected items',
    shop: 'Quick Mart',
    code: 'PICK21',
    asset: '$_mockupPath/im-gifts.jpg',
    colors: [Color(0xFF5825BB), Color(0xFF291986)],
  ),
];

const _rankedBncShops = [
  _BncRankedSpec(
    rank: 1,
    name: 'Star Stitch Center',
    category: 'Tailor / Clothing',
    rating: '4.8',
    reviews: '134',
    distance: '1.1 km',
    asset: '$_mockupPath/im-card_machine.jpg',
  ),
  _BncRankedSpec(
    rank: 2,
    name: 'Rajeevan Tailors',
    category: 'Tailor / Clothing',
    rating: '4.6',
    reviews: '126',
    distance: '1.2 km',
    asset: '$_mockupPath/im-tailor.jpg',
  ),
  _BncRankedSpec(
    rank: 3,
    name: 'Maya Tailors',
    category: 'Tailor / Clothing',
    rating: '4.5',
    reviews: '77',
    distance: '1.6 km',
    asset: '$_mockupPath/im-card_fabric.jpg',
  ),
];

const _bncEcosystem = [
  _BncEcosystemSpec(
    'Business Card',
    'Create & share your digital business card',
    Icons.badge_outlined,
  ),
  _BncEcosystemSpec(
    'B2B Network',
    'Connect & grow with businesses',
    Icons.hub_outlined,
  ),
  _BncEcosystemSpec(
    'Jobs',
    'Find jobs or hire local talent',
    Icons.business_center_outlined,
  ),
  _BncEcosystemSpec(
    'Winner',
    'Join contests & win exciting prizes',
    Icons.emoji_events_outlined,
  ),
  _BncEcosystemSpec(
    'Feed',
    'Read & share local stories & updates',
    Icons.article_outlined,
  ),
  _BncEcosystemSpec(
    'Plans',
    'Choose the best plan for your business',
    Icons.shield_outlined,
  ),
  _BncEcosystemSpec(
    'Dashboard',
    'Manage your business performance',
    Icons.analytics_outlined,
  ),
  _BncEcosystemSpec(
    'Admin',
    'Manage users, reports & system',
    Icons.settings_outlined,
  ),
  _BncEcosystemSpec(
    'Explanations',
    'Guides, help articles & resources',
    Icons.lightbulb_outline,
  ),
];

class _BncMarketplaceHome extends StatelessWidget {
  const _BncMarketplaceHome({
    required this.catalog,
    required this.usingFallback,
    required this.onRefresh,
    required this.showPreviewChrome,
  });

  final CatalogData catalog;
  final bool usingFallback;
  final Future<void> Function() onRefresh;
  final bool showPreviewChrome;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _BncHero(
          location: catalog.locationLabel,
          usingFallback: usingFallback,
          onSearch: onRefresh,
          showPreviewChrome: showPreviewChrome,
        ),
        Container(
          decoration: const BoxDecoration(color: brandSurface),
          padding: const EdgeInsets.fromLTRB(16, 18, 16, 116),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const _BncSectionTitle(title: 'Browse by category'),
              const SizedBox(height: 12),
              const _BncCategoryRail(),
              const SizedBox(height: 22),
              const _BncSectionTitle(
                title: 'Deals in spotlight',
                action: 'View all deals',
              ),
              const SizedBox(height: 12),
              const _BncDealRail(),
              const SizedBox(height: 22),
              const _BncSectionTitle(
                title: 'Featured shops',
                action: 'View all shops',
              ),
              const SizedBox(height: 12),
              const _BncFeaturedRail(),
              const SizedBox(height: 22),
              const _BncSectionTitle(title: 'Today\'s top offers'),
              const SizedBox(height: 12),
              const _BncOfferRail(),
              const SizedBox(height: 24),
              const _BncAllShopsHeader(),
              const SizedBox(height: 12),
              const _BncFilterRail(),
              const SizedBox(height: 14),
              const _BncShopGrid(),
              const SizedBox(height: 16),
              Center(
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: brandNavy,
                    side: const BorderSide(color: Color(0xFFCBD7EA)),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 18,
                      vertical: 12,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                  onPressed: () {},
                  icon: const Icon(Icons.arrow_forward, size: 18),
                  label: const Text(
                    'Explore more shops',
                    style: TextStyle(fontWeight: FontWeight.w900),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              const _BncSectionTitle(title: 'Search ranked shops'),
              const SizedBox(height: 10),
              const _BncRankingFilters(),
              const SizedBox(height: 12),
              const _BncRankedList(),
              const SizedBox(height: 24),
              const _BncSectionTitle(title: 'More from BNC ecosystem'),
              const SizedBox(height: 12),
              const _BncEcosystemGrid(),
              const SizedBox(height: 22),
              const _BncMobileFooter(),
            ],
          ),
        ),
      ],
    );
  }
}

class _BncHero extends StatelessWidget {
  const _BncHero({
    required this.location,
    required this.usingFallback,
    required this.onSearch,
    required this.showPreviewChrome,
  });

  final String location;
  final bool usingFallback;
  final Future<void> Function() onSearch;
  final bool showPreviewChrome;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [brandNavyDeep, brandNavy, brandNavyBright],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Padding(
        padding: EdgeInsets.fromLTRB(18, showPreviewChrome ? 14 : 10, 18, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.location_on, color: brandGold, size: 30),
                const SizedBox(width: 4),
                const Text(
                  'BNC',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    height: 1,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 9,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.14),
                      ),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.location_on_outlined,
                          color: Colors.white,
                          size: 15,
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            location,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        const Icon(
                          Icons.keyboard_arrow_down,
                          color: Colors.white,
                          size: 16,
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                const _BncBell(),
              ],
            ),
            const SizedBox(height: 18),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Find any shop,\nservice or deal\nnear you',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 32,
                          height: 0.98,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        usingFallback
                            ? 'Showing trusted local listings saved for offline browsing.'
                            : 'Discover trusted local shops, services and exclusive offers in Kozhikode.',
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.84),
                          fontSize: 13.5,
                          height: 1.35,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                const _BncHeroScene(),
              ],
            ),
            const SizedBox(height: 18),
            _BncSearchBox(onSearch: onSearch),
            const SizedBox(height: 14),
            const _BncHeroActions(),
          ],
        ),
      ),
    );
  }
}

class _BncBell extends StatelessWidget {
  const _BncBell();

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.08),
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
          ),
          child: const Icon(
            Icons.notifications_none,
            color: Colors.white,
            size: 23,
          ),
        ),
        Positioned(
          right: 2,
          top: 1,
          child: Container(
            width: 16,
            height: 16,
            decoration: const BoxDecoration(
              color: brandGold,
              shape: BoxShape.circle,
            ),
            child: const Center(
              child: Text(
                '1',
                style: TextStyle(
                  color: brandNavy,
                  fontSize: 9,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _BncHeroScene extends StatelessWidget {
  const _BncHeroScene();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 138,
      height: 164,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned(
            left: 10,
            right: 8,
            bottom: 8,
            child: Container(
              height: 26,
              decoration: BoxDecoration(
                color: const Color(0xFF17479C),
                borderRadius: BorderRadius.circular(999),
              ),
            ),
          ),
          Positioned(
            left: 27,
            bottom: 22,
            child: Container(
              width: 88,
              height: 62,
              decoration: const BoxDecoration(
                color: Color(0xFF1B4A99),
                borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
              ),
            ),
          ),
          Positioned(
            left: 18,
            bottom: 76,
            child: Container(
              width: 108,
              height: 30,
              decoration: const BoxDecoration(
                color: Color(0xFF13408E),
                borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
              ),
            ),
          ),
          Positioned(
            left: 19,
            bottom: 74,
            child: Row(
              children: List.generate(5, (index) {
                return Container(
                  width: 21,
                  height: 34,
                  decoration: BoxDecoration(
                    color: index.isEven ? Colors.white : brandNavyBright,
                    borderRadius: const BorderRadius.vertical(
                      bottom: Radius.circular(10),
                    ),
                  ),
                );
              }),
            ),
          ),
          Positioned(
            left: 47,
            bottom: 22,
            child: Container(
              width: 18,
              height: 42,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(8)),
              ),
            ),
          ),
          Positioned(
            right: 45,
            bottom: 22,
            child: Container(
              width: 18,
              height: 42,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(8)),
              ),
            ),
          ),
          Positioned(
            left: 44,
            top: 4,
            child: Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: brandGold, width: 16),
              ),
            ),
          ),
          Positioned(
            left: 69,
            top: 56,
            child: Container(
              width: 18,
              height: 56,
              decoration: const BoxDecoration(
                color: brandGoldDeep,
                borderRadius: BorderRadius.vertical(
                  bottom: Radius.circular(12),
                ),
              ),
            ),
          ),
          const Positioned(left: 5, bottom: 6, child: _BncTinyPerson()),
          Positioned(
            right: 0,
            bottom: 6,
            child: Transform(
              alignment: Alignment.center,
              transform: Matrix4.diagonal3Values(-1, 1, 1),
              child: const _BncTinyPerson(),
            ),
          ),
        ],
      ),
    );
  }
}

class _BncTinyPerson extends StatelessWidget {
  const _BncTinyPerson();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 28,
      height: 66,
      child: Column(
        children: [
          Container(
            width: 14,
            height: 14,
            decoration: const BoxDecoration(
              color: Color(0xFFFFC66F),
              shape: BoxShape.circle,
            ),
          ),
          Container(
            width: 13,
            height: 27,
            decoration: BoxDecoration(
              color: brandGold,
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 5,
                height: 22,
                decoration: BoxDecoration(
                  color: brandNavyDeep,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              const SizedBox(width: 4),
              Container(
                width: 5,
                height: 22,
                decoration: BoxDecoration(
                  color: brandNavyDeep,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _BncSearchBox extends StatelessWidget {
  const _BncSearchBox({required this.onSearch});

  final Future<void> Function() onSearch;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: const [
          BoxShadow(
            color: Color(0x24000000),
            blurRadius: 18,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          const SizedBox(width: 8),
          const Icon(Icons.search, color: brandMuted, size: 25),
          const SizedBox(width: 10),
          const Expanded(
            child: Text(
              'Search shops, products, services or deals',
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: brandMuted,
                fontSize: 13.5,
                height: 1.2,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(width: 8),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: brandGold,
              foregroundColor: brandNavy,
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            onPressed: () => onSearch(),
            child: const Text(
              'Search',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900),
            ),
          ),
        ],
      ),
    );
  }
}

class _BncHeroActions extends StatelessWidget {
  const _BncHeroActions();

  @override
  Widget build(BuildContext context) {
    const items = [
      (Icons.star_rounded, 'Star shops'),
      (Icons.track_changes_rounded, 'Best matches'),
      (Icons.card_giftcard_rounded, 'Weekly draw'),
      (Icons.redeem_rounded, 'Gifts'),
    ];

    return Wrap(
      spacing: 14,
      runSpacing: 8,
      children: items.map((item) {
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(item.$1, color: brandGold, size: 18),
            const SizedBox(width: 5),
            Text(
              item.$2,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.86),
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        );
      }).toList(),
    );
  }
}

class _BncSectionTitle extends StatelessWidget {
  const _BncSectionTitle({required this.title, this.action});

  final String title;
  final String? action;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: brandNavy,
              fontSize: 18,
              height: 1.1,
              fontWeight: FontWeight.w900,
            ),
          ),
        ),
        if (action != null) ...[
          const SizedBox(width: 10),
          Text(
            action!,
            style: const TextStyle(
              color: brandNavy,
              fontSize: 12.5,
              fontWeight: FontWeight.w800,
            ),
          ),
          const Icon(Icons.chevron_right, color: brandNavy, size: 18),
        ],
      ],
    );
  }
}

class _BncCategoryRail extends StatelessWidget {
  const _BncCategoryRail();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 108,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: _bncCategories.length,
        separatorBuilder: (_, _) => const SizedBox(width: 10),
        itemBuilder: (context, index) {
          final item = _bncCategories[index];
          return SizedBox(width: 86, child: _BncCategoryTile(item: item));
        },
      ),
    );
  }
}

class _BncCategoryTile extends StatelessWidget {
  const _BncCategoryTile({required this.item});

  final _BncCategorySpec item;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: brandLine),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0E08204A),
            blurRadius: 12,
            offset: Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: item.tint,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(item.icon, color: item.color, size: 25),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: Center(
              child: Text(
                item.label,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: brandNavy,
                  fontSize: 12,
                  height: 1.12,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _BncDealRail extends StatelessWidget {
  const _BncDealRail();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 158,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: _bncDeals.length,
        separatorBuilder: (_, _) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          return SizedBox(
            width: 304,
            child: _BncDealCard(deal: _bncDeals[index]),
          );
        },
      ),
    );
  }
}

class _BncDealCard extends StatelessWidget {
  const _BncDealCard({required this.deal});

  final _BncDealSpec deal;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: deal.colors),
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: brandLine),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1008204A),
            blurRadius: 14,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(14, 14, 8, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: deal.badgeColor,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      deal.badge,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                  const SizedBox(height: 9),
                  Text(
                    deal.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: brandNavy,
                      fontSize: 17,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    deal.text,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Color(0xFF596A82),
                      fontSize: 12,
                      height: 1.25,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const Spacer(),
                  Row(
                    children: [
                      ClipOval(
                        child: SizedBox(
                          width: 22,
                          height: 22,
                          child: _AssetImageFill(asset: deal.asset),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          deal.shop,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: brandNavy,
                            fontSize: 11.5,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(right: 10),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: SizedBox(
                width: 106,
                height: 120,
                child: _AssetImageFill(asset: deal.asset),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _BncFeaturedRail extends StatelessWidget {
  const _BncFeaturedRail();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 238,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: _featuredBncShops.length,
        separatorBuilder: (_, _) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          return SizedBox(
            width: 202,
            child: _BncShopCard(shop: _featuredBncShops[index]),
          );
        },
      ),
    );
  }
}

class _BncOfferRail extends StatelessWidget {
  const _BncOfferRail();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 142,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: _bncOffers.length,
        separatorBuilder: (_, _) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          return SizedBox(
            width: 248,
            child: _BncOfferCard(offer: _bncOffers[index]),
          );
        },
      ),
    );
  }
}

class _BncOfferCard extends StatelessWidget {
  const _BncOfferCard({required this.offer});

  final _BncOfferSpec offer;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: offer.colors),
        borderRadius: BorderRadius.circular(15),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1608204A),
            blurRadius: 14,
            offset: Offset(0, 6),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          Positioned(
            right: 0,
            bottom: 0,
            child: SizedBox(
              width: 112,
              height: 120,
              child: _AssetImageFill(asset: offer.asset),
            ),
          ),
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.black.withValues(alpha: 0.10),
                    Colors.transparent,
                  ],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: SizedBox(
              width: 142,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    offer.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      height: 1,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 7),
                  Text(
                    offer.text,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.86),
                      fontSize: 12,
                      height: 1.25,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    offer.shop,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 7,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.18),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      'Use Code: ${offer.code}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _BncAllShopsHeader extends StatelessWidget {
  const _BncAllShopsHeader();

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'All shops in Kozhikode',
                style: TextStyle(
                  color: brandNavy,
                  fontSize: 19,
                  height: 1.1,
                  fontWeight: FontWeight.w900,
                ),
              ),
              SizedBox(height: 4),
              Text(
                'Showing trusted local businesses near you',
                style: TextStyle(
                  color: brandMuted,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        TextButton.icon(
          onPressed: () {},
          iconAlignment: IconAlignment.end,
          icon: const Icon(Icons.chevron_right, size: 18),
          label: const Text('View all'),
          style: TextButton.styleFrom(
            foregroundColor: brandNavy,
            textStyle: const TextStyle(fontWeight: FontWeight.w900),
          ),
        ),
      ],
    );
  }
}

class _BncFilterRail extends StatelessWidget {
  const _BncFilterRail();

  @override
  Widget build(BuildContext context) {
    const filters = [
      'All',
      'Restaurant',
      'Grocery',
      'Mobile',
      'Beauty',
      'Open Now',
      'Offers',
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: List.generate(filters.length, (index) {
          final label = filters[index];
          final active = index == 0;
          return Padding(
            padding: EdgeInsets.only(
              right: index == filters.length - 1 ? 0 : 8,
            ),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
              decoration: BoxDecoration(
                color: active ? brandNavy : Colors.white,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: active ? brandNavy : brandLine),
              ),
              child: Row(
                children: [
                  if (label == 'Open Now' || label == 'Offers') ...[
                    Container(
                      width: 7,
                      height: 7,
                      decoration: BoxDecoration(
                        color: label == 'Open Now'
                            ? const Color(0xFF31C563)
                            : const Color(0xFFE84141),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                  ],
                  Text(
                    label,
                    style: TextStyle(
                      color: active ? Colors.white : const Color(0xFF405474),
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }
}

class _BncShopGrid extends StatelessWidget {
  const _BncShopGrid();

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _allBncShops.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 0.71,
      ),
      itemBuilder: (context, index) {
        return _BncShopCard(shop: _allBncShops[index], dense: true);
      },
    );
  }
}

class _BncShopCard extends StatelessWidget {
  const _BncShopCard({required this.shop, this.dense = false});

  final _BncShopSpec shop;
  final bool dense;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(13),
        border: Border.all(color: brandLine),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0F08204A),
            blurRadius: 13,
            offset: Offset(0, 5),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            height: dense ? 112 : 118,
            child: Stack(
              children: [
                Positioned.fill(
                  child: _AssetImageFill(asset: shop.asset, darken: true),
                ),
                Positioned(
                  left: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: shop.badgeColor,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      shop.badge,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                ),
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.24),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.favorite_border,
                      color: Colors.white,
                      size: 17,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: EdgeInsets.all(dense ? 10 : 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  shop.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: brandNavy,
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  shop.category,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: brandMuted,
                    fontSize: 11.5,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  children: [
                    _BncMeta(
                      icon: Icons.star_rounded,
                      color: brandGold,
                      text: '${shop.rating} (${shop.reviews})',
                    ),
                    _BncMeta(
                      icon: Icons.location_on_outlined,
                      color: brandMuted,
                      text: shop.distance,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BncMeta extends StatelessWidget {
  const _BncMeta({required this.icon, required this.color, required this.text});

  final IconData icon;
  final Color color;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: color, size: 14),
        const SizedBox(width: 3),
        Text(
          text,
          style: const TextStyle(
            color: brandMuted,
            fontSize: 11,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

class _BncRankingFilters extends StatelessWidget {
  const _BncRankingFilters();

  @override
  Widget build(BuildContext context) {
    const labels = ['Best Match', 'Most Rated', 'Nearby', 'Offers', 'New'];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: List.generate(labels.length, (index) {
          final active = index == 0;
          return Padding(
            padding: EdgeInsets.only(right: index == labels.length - 1 ? 0 : 8),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 8),
              decoration: BoxDecoration(
                color: active ? brandNavy : Colors.white,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: active ? brandNavy : brandLine),
              ),
              child: Text(
                labels[index],
                style: TextStyle(
                  color: active ? Colors.white : const Color(0xFF405474),
                  fontSize: 11.5,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}

class _BncRankedList extends StatelessWidget {
  const _BncRankedList();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(_rankedBncShops.length, (index) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: index == _rankedBncShops.length - 1 ? 0 : 10,
          ),
          child: _BncRankedCard(shop: _rankedBncShops[index]),
        );
      }),
    );
  }
}

class _BncRankedCard extends StatelessWidget {
  const _BncRankedCard({required this.shop});

  final _BncRankedSpec shop;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(13),
        border: Border.all(color: brandLine),
      ),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(colors: [brandGold, brandGoldDeep]),
            ),
            child: Center(
              child: Text(
                '${shop.rank}',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: SizedBox(
              width: 82,
              height: 58,
              child: _AssetImageFill(asset: shop.asset),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  shop.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: brandNavy,
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  shop.category,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: brandMuted,
                    fontSize: 11.5,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(Icons.star_rounded, color: brandGold, size: 14),
                    const SizedBox(width: 3),
                    Expanded(
                      child: Text(
                        '${shop.rating} (${shop.reviews}) - ${shop.distance}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: brandMuted,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: brandLine),
            ),
            child: const Icon(Icons.chevron_right, color: brandNavy, size: 18),
          ),
        ],
      ),
    );
  }
}

class _BncEcosystemGrid extends StatelessWidget {
  const _BncEcosystemGrid();

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _bncEcosystem.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 1,
        mainAxisSpacing: 10,
        childAspectRatio: 4.15,
      ),
      itemBuilder: (context, index) {
        return _BncEcosystemCard(item: _bncEcosystem[index]);
      },
    );
  }
}

class _BncEcosystemCard extends StatelessWidget {
  const _BncEcosystemCard({required this.item});

  final _BncEcosystemSpec item;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(13),
        border: Border.all(color: brandLine),
      ),
      child: Row(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: const Color(0xFFEDF3FF),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(item.icon, color: brandNavy, size: 28),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: brandNavy,
                    fontSize: 14,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  item.text,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: brandMuted,
                    fontSize: 11.5,
                    height: 1.2,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: brandLine),
            ),
            child: const Icon(Icons.chevron_right, color: brandNavy, size: 18),
          ),
        ],
      ),
    );
  }
}

class _BncMobileFooter extends StatelessWidget {
  const _BncMobileFooter();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [brandNavy, brandNavyDeep]),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.location_on, color: brandGold, size: 30),
              SizedBox(width: 4),
              Text(
                'BNC',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                ),
              ),
              SizedBox(width: 8),
              Text(
                '| Nearu',
                style: TextStyle(
                  color: Color(0xCCDDE7FF),
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'Your trusted local discovery and business ecosystem in Kozhikode.',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.74),
              fontSize: 12.5,
              height: 1.45,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.16),
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    'Enter your email',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.52),
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: brandGold,
                  foregroundColor: brandNavy,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 12,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                onPressed: () {},
                child: const Text(
                  'Subscribe',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _AssetImageFill extends StatelessWidget {
  const _AssetImageFill({required this.asset, this.darken = false});

  final String asset;
  final bool darken;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        Image.asset(
          asset,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return const DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [brandNavy, brandNavyBright],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
            );
          },
        ),
        if (darken)
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.black.withValues(alpha: 0.28),
                  Colors.transparent,
                  Colors.black.withValues(alpha: 0.10),
                ],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
          ),
      ],
    );
  }
}

// ignore: unused_element
class _HeroSection extends StatelessWidget {
  const _HeroSection({
    required this.catalog,
    required this.usingFallback,
    required this.onRefresh,
    required this.showPreviewChrome,
  });

  final CatalogData catalog;
  final bool usingFallback;
  final Future<void> Function() onRefresh;
  final bool showPreviewChrome;

  @override
  Widget build(BuildContext context) {
    final heroPrimary = _selectBusinessVisual(
      catalog,
      categoryHint: 'tailor',
      fallbackIndex: 1,
    );
    final heroSecondary = _selectBusinessVisual(
      catalog,
      categoryHint: 'grocery',
      fallbackIndex: 2,
      excludingId: heroPrimary.id,
    );

    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [brandNavyDeep, brandNavy],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Padding(
        padding: EdgeInsets.fromLTRB(20, showPreviewChrome ? 14 : 10, 20, 34),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.location_on, color: Colors.white, size: 23),
                const SizedBox(width: 8),
                Expanded(
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          catalog.locationLabel,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 17,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      const SizedBox(width: 4),
                      const Icon(
                        Icons.keyboard_arrow_down,
                        color: Colors.white,
                        size: 22,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                const _NotificationBell(),
                const SizedBox(width: 12),
                const _RemoteAvatar(imageUrl: profileImageUrl),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _titleLine('Discover'),
                      _titleLine('the best'),
                      const SizedBox(height: 4),
                      _highlightLine('products & services'),
                      _highlightLine('near you', showPin: true),
                      const SizedBox(height: 10),
                      Text(
                        usingFallback
                            ? 'Showing saved listings while reconnecting.'
                            : 'Top-rated shops, services and offers around you.',
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: brandHeroText,
                          fontSize: 14,
                          height: 1.32,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                _HeroGraphic(primary: heroPrimary, secondary: heroSecondary),
              ],
            ),
            const SizedBox(height: 16),
            _SearchBar(onTap: onRefresh),
          ],
        ),
      ),
    );
  }

  Widget _titleLine(String text) {
    return Align(
      alignment: Alignment.centerLeft,
      child: FittedBox(
        fit: BoxFit.scaleDown,
        alignment: Alignment.centerLeft,
        child: Text(
          text,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 34,
            height: 0.9,
            fontWeight: FontWeight.w900,
          ),
        ),
      ),
    );
  }

  Widget _highlightLine(String text, {bool showPin = false}) {
    return Align(
      alignment: Alignment.centerLeft,
      child: FittedBox(
        fit: BoxFit.scaleDown,
        alignment: Alignment.centerLeft,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              text,
              style: const TextStyle(
                color: brandGold,
                fontSize: 29,
                height: 0.96,
                fontWeight: FontWeight.w900,
              ),
            ),
            if (showPin) ...[
              const SizedBox(width: 4),
              const Icon(Icons.location_on, color: brandGold, size: 24),
            ],
          ],
        ),
      ),
    );
  }
}

class _NotificationBell extends StatelessWidget {
  const _NotificationBell();

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        const Icon(Icons.notifications_none, color: Colors.white, size: 29),
        Positioned(
          right: -3,
          top: -4,
          child: Container(
            width: 18,
            height: 18,
            decoration: const BoxDecoration(
              color: Color(0xFFFFB91D),
              shape: BoxShape.circle,
            ),
            child: const Center(
              child: Text(
                '3',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _HeroGraphic extends StatelessWidget {
  const _HeroGraphic({required this.primary, required this.secondary});

  final BusinessItem primary;
  final BusinessItem secondary;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 126,
      height: 146,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned(
            left: 10,
            right: 0,
            bottom: 10,
            child: Container(
              height: 34,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(999),
                gradient: const LinearGradient(
                  colors: [Color(0xFF1E4A97), Color(0xFF2B66D0)],
                ),
              ),
            ),
          ),
          Positioned(
            left: 0,
            top: 2,
            child: Container(
              width: 40,
              height: 40,
              decoration: const BoxDecoration(
                color: brandGold,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Color(0x44110900),
                    blurRadius: 14,
                    offset: Offset(0, 6),
                  ),
                ],
              ),
              child: const Icon(Icons.location_on, color: brandNavy, size: 22),
            ),
          ),
          Positioned(
            right: 0,
            top: 10,
            child: Container(
              width: 92,
              height: 122,
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.14),
                borderRadius: BorderRadius.circular(26),
                border: Border.all(
                  color: brandGold.withValues(alpha: 0.65),
                  width: 1.2,
                ),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x26031644),
                    blurRadius: 20,
                    offset: Offset(0, 12),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(22),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    _RemoteBusinessImage(
                      imageUrl: primary.imageUrl,
                      variant: primary.coverVariant,
                      darken: true,
                    ),
                    DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Colors.transparent,
                            Colors.black.withValues(alpha: 0.10),
                            Colors.black.withValues(alpha: 0.45),
                          ],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                      ),
                    ),
                    Positioned(
                      left: 8,
                      right: 8,
                      bottom: 8,
                      child: Text(
                        primary.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11.5,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            left: 10,
            bottom: 0,
            child: Container(
              width: 52,
              height: 52,
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: Colors.white.withValues(alpha: 0.6)),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x21000000),
                    blurRadius: 12,
                    offset: Offset(0, 6),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(15),
                child: _RemoteBusinessImage(
                  imageUrl: secondary.imageUrl,
                  variant: secondary.coverVariant,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _RemoteAvatar extends StatelessWidget {
  const _RemoteAvatar({required this.imageUrl});

  final String imageUrl;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Image.network(
          imageUrl,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFFFFD1AE), Color(0xFF8A5127)],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
              child: const Icon(Icons.person, color: Colors.white),
            );
          },
        ),
      ),
    );
  }
}

class _SearchBar extends StatelessWidget {
  const _SearchBar({required this.onTap});

  final Future<void> Function() onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
      ),
      child: Row(
        children: [
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 10),
            child: Icon(Icons.search, color: brandMuted, size: 28),
          ),
          const Expanded(
            child: Text(
              'Search products, shops or services',
              style: TextStyle(
                color: brandMuted,
                fontSize: 15,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: brandGold,
              foregroundColor: brandNavy,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(18),
              ),
            ),
            onPressed: () => onTap(),
            child: const Text(
              'Search',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
            ),
          ),
        ],
      ),
    );
  }
}

// ignore: unused_element
class _ContentSection extends StatelessWidget {
  const _ContentSection({required this.catalog});

  final CatalogData catalog;

  @override
  Widget build(BuildContext context) {
    final dealPrimary = _selectBusinessVisual(
      catalog,
      categoryHint: 'grocery',
      fallbackIndex: 2,
    );
    final dealSecondary = _selectBusinessVisual(
      catalog,
      categoryHint: 'restaurant',
      fallbackIndex: 0,
      excludingId: dealPrimary.id,
    );

    return Container(
      decoration: const BoxDecoration(
        color: brandSurface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 18, 16, 110),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _PlatformPriorityRail(catalog: catalog),
            const SizedBox(height: 18),
            _CategoryRail(categories: catalog.categories),
            const SizedBox(height: 14),
            const _SegmentControl(),
            const SizedBox(height: 16),
            _DealBanner(primary: dealPrimary, secondary: dealSecondary),
            const SizedBox(height: 22),
            const _SectionHeader(
              title: 'Featured near you',
              action: 'View all',
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 256,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: catalog.featured.length,
                separatorBuilder: (_, _) => const SizedBox(width: 12),
                itemBuilder: (context, index) =>
                    _FeaturedCard(data: catalog.featured[index]),
              ),
            ),
            const SizedBox(height: 20),
            const _SectionHeader(title: 'Popular near you'),
            const SizedBox(height: 12),
            _FilterChips(categories: catalog.categories),
            const SizedBox(height: 14),
            Column(
              children: List.generate(
                catalog.popular.length,
                (index) => Padding(
                  padding: EdgeInsets.only(
                    bottom: index == catalog.popular.length - 1 ? 0 : 12,
                  ),
                  child: _PopularCard(data: catalog.popular[index]),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CategoryRail extends StatelessWidget {
  const _CategoryRail({required this.categories});

  final List<CategoryItem> categories;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: List.generate(categories.length, (index) {
          final category = categories[index];
          return Padding(
            padding: EdgeInsets.only(
              right: index == categories.length - 1 ? 0 : 10,
            ),
            child: _CategoryCard(category: category),
          );
        }),
      ),
    );
  }
}

class _CategoryCard extends StatelessWidget {
  const _CategoryCard({required this.category});

  final CategoryItem category;

  @override
  Widget build(BuildContext context) {
    final accentColor = _colorFromHex(category.accent);
    final iconColor = category.isActive ? Colors.white : accentColor;
    final backgroundColor = category.isActive
        ? brandNavy
        : accentColor.withValues(alpha: 0.12);

    return Container(
      width: 88,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
      decoration: BoxDecoration(
        color: brandSurface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: brandLine),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0F08204A),
            blurRadius: 14,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: backgroundColor,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(
              _iconForSlug(category.icon),
              color: iconColor,
              size: 24,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            category.name,
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: brandNavy,
              fontSize: 13,
              height: 1.1,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _SegmentControl extends StatelessWidget {
  const _SegmentControl();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: brandSoft,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: brandLine),
      ),
      child: Row(
        children: [
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: brandNavy,
                borderRadius: BorderRadius.circular(999),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.shopping_bag_outlined,
                    color: Colors.white,
                    size: 18,
                  ),
                  SizedBox(width: 8),
                  Text(
                    'Products',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(999),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.handyman_outlined, color: brandMuted, size: 18),
                  SizedBox(width: 8),
                  Text(
                    'Services',
                    style: TextStyle(
                      color: brandMuted,
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DealBanner extends StatelessWidget {
  const _DealBanner({required this.primary, required this.secondary});

  final BusinessItem primary;
  final BusinessItem secondary;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(18, 18, 16, 18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: const LinearGradient(
          colors: [Color(0xFFFFFAEE), Color(0xFFFFF1CC)],
        ),
        border: Border.all(color: const Color(0xFFF1D58C)),
      ),
      child: Row(
        children: [
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Big savings,\nright around you!',
                  style: TextStyle(
                    color: brandNavy,
                    fontSize: 20,
                    height: 1.1,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                SizedBox(height: 10),
                Text(
                  'Exclusive offers on top products\n& services near you.',
                  style: TextStyle(
                    color: Color(0xFF496488),
                    fontSize: 14,
                    height: 1.4,
                  ),
                ),
                SizedBox(height: 14),
                _BlueBadgeButton(label: 'Explore Deals'),
              ],
            ),
          ),
          const SizedBox(width: 10),
          _DealPhotoCluster(primary: primary, secondary: secondary),
        ],
      ),
    );
  }
}

class _PlatformPriorityRail extends StatelessWidget {
  const _PlatformPriorityRail({required this.catalog});

  final CatalogData catalog;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          margin: const EdgeInsets.only(bottom: 14),
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          decoration: BoxDecoration(
            color: const Color(0xFF13222D),
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: const Color(0x1FC9A227)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x1408204A),
                blurRadius: 18,
                offset: Offset(0, 8),
              ),
            ],
          ),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: List.generate(platformSections.length, (index) {
                final section = platformSections[index];
                return Padding(
                  padding: EdgeInsets.only(
                    right: index == platformSections.length - 1 ? 0 : 6,
                  ),
                  child: _PlatformNavChip(
                    label: section.label,
                    active: index == 0,
                  ),
                );
              }),
            ),
          ),
        ),
        SizedBox(
          height: 322,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: platformSections.length,
            separatorBuilder: (_, _) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final section = platformSections[index];
              return SizedBox(
                width: 286,
                child: _PlatformSectionCard(
                  section: section,
                  visual: section.imageHint == null
                      ? null
                      : _selectBusinessVisual(
                          catalog,
                          categoryHint: section.imageHint,
                        ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _PlatformNavChip extends StatelessWidget {
  const _PlatformNavChip({required this.label, required this.active});

  final String label;
  final bool active;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: active ? brandGold : Colors.transparent,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: active
              ? const Color(0xFF13222D)
              : Colors.white.withValues(alpha: 0.92),
          fontSize: 13,
          fontWeight: active ? FontWeight.w900 : FontWeight.w700,
        ),
      ),
    );
  }
}

class _PlatformSectionCard extends StatelessWidget {
  const _PlatformSectionCard({required this.section, required this.visual});

  final PlatformSectionData section;
  final BusinessItem? visual;

  @override
  Widget build(BuildContext context) {
    final accent = _colorFromHex(section.accentHex);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        gradient: LinearGradient(
          colors: [accent.withValues(alpha: 0.12), Colors.white],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border.all(color: accent.withValues(alpha: 0.2)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1408204A),
            blurRadius: 18,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: accent.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Center(
                  child: Text(
                    section.emoji,
                    style: TextStyle(
                      color: accent,
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      section.eyebrow,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: accent,
                        fontSize: 10.5,
                        letterSpacing: 0.9,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      section.label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: brandNavy,
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              ),
              if (section.badge != null)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: accent,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    section.badge!,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10.5,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          Expanded(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        section.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: brandNavy,
                          fontSize: 17,
                          height: 1.12,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        section.description,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: brandMuted,
                          fontSize: 12.5,
                          height: 1.35,
                        ),
                      ),
                      const Spacer(),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          for (final item in section.highlights.take(1))
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 7,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.9),
                                borderRadius: BorderRadius.circular(999),
                                border: Border.all(
                                  color: accent.withValues(alpha: 0.16),
                                ),
                              ),
                              child: Text(
                                item,
                                style: const TextStyle(
                                  color: brandNavy,
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                _PlatformSectionVisual(
                  section: section,
                  accent: accent,
                  visual: visual,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PlatformSectionVisual extends StatelessWidget {
  const _PlatformSectionVisual({
    required this.section,
    required this.accent,
    required this.visual,
  });

  final PlatformSectionData section;
  final Color accent;
  final BusinessItem? visual;

  @override
  Widget build(BuildContext context) {
    if (visual == null) {
      return Container(
        width: 108,
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.88),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: accent.withValues(alpha: 0.18)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 54,
              height: 54,
              decoration: BoxDecoration(
                color: accent.withValues(alpha: 0.14),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  section.emoji,
                  style: TextStyle(
                    color: accent,
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 14),
            Text(
              section.highlights.first,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: brandNavy,
                fontSize: 12.5,
                height: 1.25,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      );
    }

    return SizedBox(
      width: 112,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: Stack(
                children: [
                  Positioned.fill(
                    child: _RemoteBusinessImage(
                      imageUrl: visual!.imageUrl,
                      variant: visual!.coverVariant,
                      darken: true,
                    ),
                  ),
                  Positioned(
                    left: 8,
                    top: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: accent.withValues(alpha: 0.94),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        section.badge ?? section.emoji,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    left: 10,
                    right: 10,
                    bottom: 10,
                    child: Text(
                      visual!.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11.5,
                        height: 1.2,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.92),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(
              visual!.subtitle,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: brandNavy,
                fontSize: 11,
                height: 1.25,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, this.action});

  final String title;
  final String? action;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: brandNavy,
              fontSize: 18,
              fontWeight: FontWeight.w900,
            ),
          ),
        ),
        if (action != null) const SizedBox(width: 12),
        if (action != null)
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                action!,
                style: const TextStyle(
                  color: brandMuted,
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(width: 4),
              const Icon(Icons.chevron_right, color: brandMuted),
            ],
          ),
      ],
    );
  }
}

class _FeaturedCard extends StatelessWidget {
  const _FeaturedCard({required this.data});

  final BusinessItem data;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 238,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1408204A),
            blurRadius: 18,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            child: SizedBox(
              height: 112,
              child: Stack(
                children: [
                  Positioned.fill(
                    child: _RemoteBusinessImage(
                      imageUrl: data.imageUrl,
                      variant: data.coverVariant,
                      darken: true,
                    ),
                  ),
                  if (data.badgeText != null)
                    Positioned(
                      left: 10,
                      top: 10,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: _colorFromHex(data.badgeColor ?? '#2961F0'),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          data.badgeText!,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ),
                  Positioned(
                    right: 10,
                    top: 10,
                    child: Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.22),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.favorite_border,
                        color: Colors.white,
                        size: 18,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  data.name,
                  style: const TextStyle(
                    color: brandNavy,
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${data.subtitle} / ${data.area}',
                  style: const TextStyle(color: brandMuted, fontSize: 13),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 10,
                  runSpacing: 6,
                  children: [
                    _MetaPill(
                      icon: Icons.star,
                      color: const Color(0xFFFFB11B),
                      text:
                          '${data.rating.toStringAsFixed(1)} (${data.reviewCount})',
                    ),
                    _MetaPill(
                      icon: Icons.location_on_outlined,
                      color: const Color(0xFF7C8CAB),
                      text: '${data.distanceKm.toStringAsFixed(1)} km',
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterChips extends StatelessWidget {
  const _FilterChips({required this.categories});

  final List<CategoryItem> categories;

  @override
  Widget build(BuildContext context) {
    final labels = [
      'All',
      ...categories.take(4).map((category) => category.name),
      'Filters',
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: List.generate(labels.length, (index) {
          final label = labels[index];
          final active = index == 0;
          return Padding(
            padding: EdgeInsets.only(
              right: index == labels.length - 1 ? 0 : 10,
            ),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
              decoration: BoxDecoration(
                color: active ? brandNavy : brandSoft,
                borderRadius: BorderRadius.circular(999),
                border: label == 'Filters'
                    ? Border.all(color: brandLine)
                    : null,
              ),
              child: Row(
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      color: active ? Colors.white : brandNavy,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  if (label == 'Filters') ...[
                    const SizedBox(width: 8),
                    const Icon(Icons.tune, size: 18, color: brandNavy),
                  ],
                ],
              ),
            ),
          );
        }),
      ),
    );
  }
}

class _PopularCard extends StatelessWidget {
  const _PopularCard({required this.data});

  final BusinessItem data;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: brandSurface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: brandLine),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: SizedBox(
              width: 88,
              height: 78,
              child: _RemoteBusinessImage(
                imageUrl: data.imageUrl,
                variant: data.coverVariant,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        data.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: brandNavy,
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    const Icon(
                      Icons.favorite_border,
                      color: brandMuted,
                      size: 20,
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  data.subtitle,
                  style: const TextStyle(color: brandMuted, fontSize: 13),
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 10,
                  runSpacing: 6,
                  children: [
                    _MetaPill(
                      icon: Icons.star,
                      color: const Color(0xFFFFB11B),
                      text:
                          '${data.rating.toStringAsFixed(1)} (${data.reviewCount})',
                    ),
                    _MetaPill(
                      icon: Icons.location_on_outlined,
                      color: const Color(0xFF7C8CAB),
                      text: '${data.distanceKm.toStringAsFixed(1)} km',
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MetaPill extends StatelessWidget {
  const _MetaPill({
    required this.icon,
    required this.color,
    required this.text,
  });

  final IconData icon;
  final Color color;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 4),
        Text(text, style: const TextStyle(color: brandMuted, fontSize: 13)),
      ],
    );
  }
}

class _RemoteBusinessImage extends StatelessWidget {
  const _RemoteBusinessImage({
    required this.imageUrl,
    required this.variant,
    this.darken = false,
  });

  final String imageUrl;
  final String variant;
  final bool darken;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        _BusinessPlaceholder(variant: variant),
        Image.network(
          imageUrl,
          fit: BoxFit.cover,
          loadingBuilder: (context, child, progress) {
            if (progress == null) {
              return child;
            }

            return _BusinessPlaceholder(variant: variant);
          },
          errorBuilder: (context, error, stackTrace) {
            return _BusinessPlaceholder(variant: variant);
          },
        ),
        if (darken)
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.black.withValues(alpha: 0.12),
                  Colors.transparent,
                  Colors.black.withValues(alpha: 0.18),
                ],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
          ),
      ],
    );
  }
}

class _BusinessPlaceholder extends StatelessWidget {
  const _BusinessPlaceholder({required this.variant});

  final String variant;

  @override
  Widget build(BuildContext context) {
    final colors = switch (variant) {
      'plate' => const [Color(0xFF402313), Color(0xFF85552C)],
      'suit' => const [Color(0xFF0E1830), Color(0xFF3A4F76)],
      'basket' => const [Color(0xFF5A351A), Color(0xFFB9873A)],
      'salon' => const [Color(0xFF402D24), Color(0xFF7B5A47)],
      'shelf' => const [Color(0xFF8A551B), Color(0xFFD5A257)],
      'phone' => const [Color(0xFF07111C), Color(0xFF275C9E)],
      'worker' => const [Color(0xFF163E73), Color(0xFF4E90C3)],
      _ => const [Color(0xFF163460), Color(0xFF2A5BA0)],
    };

    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: colors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Center(
        child: Icon(
          _variantIcon(variant),
          size: 34,
          color: Colors.white.withValues(alpha: 0.72),
        ),
      ),
    );
  }
}

class _BlueBadgeButton extends StatelessWidget {
  const _BlueBadgeButton({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: brandNavy,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _DealPhotoCluster extends StatelessWidget {
  const _DealPhotoCluster({required this.primary, required this.secondary});

  final BusinessItem primary;
  final BusinessItem secondary;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 126,
      height: 108,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned(
            right: 0,
            top: 2,
            child: Container(
              width: 94,
              height: 94,
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.92),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: const Color(0xFFF5DA9E)),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x1808204A),
                    blurRadius: 18,
                    offset: Offset(0, 8),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(18),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    _RemoteBusinessImage(
                      imageUrl: primary.imageUrl,
                      variant: primary.coverVariant,
                      darken: true,
                    ),
                    DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Colors.transparent,
                            Colors.black.withValues(alpha: 0.12),
                            Colors.black.withValues(alpha: 0.35),
                          ],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                      ),
                    ),
                    Positioned(
                      left: 7,
                      right: 7,
                      bottom: 7,
                      child: Text(
                        primary.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            left: 0,
            bottom: 0,
            child: Container(
              width: 54,
              height: 54,
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: Colors.white.withValues(alpha: 0.65)),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x18000000),
                    blurRadius: 14,
                    offset: Offset(0, 8),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(15),
                child: _RemoteBusinessImage(
                  imageUrl: secondary.imageUrl,
                  variant: secondary.coverVariant,
                ),
              ),
            ),
          ),
          Positioned(
            right: 8,
            top: -4,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: brandGold,
                borderRadius: BorderRadius.circular(999),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x2EF4B227),
                    blurRadius: 12,
                    offset: Offset(0, 6),
                  ),
                ],
              ),
              child: Text(
                primary.badgeText ?? 'Hot Deal',
                style: const TextStyle(
                  color: brandNavy,
                  fontSize: 10.5,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          ),
          Positioned(
            left: 30,
            right: 16,
            bottom: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.92),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Text(
                primary.subtitle,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: brandNavy,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _BottomNavigationBar extends StatelessWidget {
  const _BottomNavigationBar();

  @override
  Widget build(BuildContext context) {
    const items = [
      _NavItemData(Icons.home_rounded, 'Home', true),
      _NavItemData(Icons.search_rounded, 'Search', false),
      _NavItemData(Icons.local_offer_outlined, 'Deals', false),
      _NavItemData(Icons.calendar_today_outlined, 'Bookings', false),
      _NavItemData(Icons.person_outline, 'Profile', false),
    ];

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 18),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: const [
          BoxShadow(
            color: Color(0x1408204A),
            blurRadius: 18,
            offset: Offset(0, -8),
          ),
        ],
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Row(
        children: items
            .map((item) => Expanded(child: _BottomNavItem(data: item)))
            .toList(),
      ),
    );
  }
}

class _BottomNavItem extends StatelessWidget {
  const _BottomNavItem({required this.data});

  final _NavItemData data;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(data.icon, color: data.active ? brandNavy : brandMuted, size: 26),
        const SizedBox(height: 8),
        Text(
          data.label,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: data.active ? brandNavy : brandMuted,
            fontSize: 12,
            fontWeight: data.active ? FontWeight.w800 : FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

class _NavItemData {
  const _NavItemData(this.icon, this.label, this.active);

  final IconData icon;
  final String label;
  final bool active;
}

List<BusinessItem> _uniqueBusinesses(CatalogData catalog) {
  final result = <BusinessItem>[];
  final seen = <String>{};

  for (final item in [...catalog.featured, ...catalog.popular]) {
    final key = item.id.isEmpty ? item.name : item.id;
    if (seen.add(key)) {
      result.add(item);
    }
  }

  if (result.isEmpty) {
    return fallbackCatalog.featured;
  }

  return result;
}

BusinessItem _selectBusinessVisual(
  CatalogData catalog, {
  String? categoryHint,
  int fallbackIndex = 0,
  String? excludingId,
}) {
  final items = _uniqueBusinesses(catalog);

  if (categoryHint != null && categoryHint.trim().isNotEmpty) {
    final needle = categoryHint.toLowerCase();
    for (final item in items) {
      final haystack = '${item.categoryName} ${item.subtitle} ${item.name}'
          .toLowerCase();
      if (item.id != excludingId && haystack.contains(needle)) {
        return item;
      }
    }
  }

  for (final item in items) {
    if (item.id != excludingId) {
      return item;
    }
  }

  final safeIndex = fallbackIndex >= 0 && fallbackIndex < items.length
      ? fallbackIndex
      : 0;
  return items[safeIndex];
}

Color _colorFromHex(String hex) {
  final cleaned = hex.replaceAll('#', '').trim();
  final normalized = cleaned.length == 6 ? 'FF$cleaned' : cleaned;
  final value = int.tryParse(normalized, radix: 16);
  return value == null ? const Color(0xFF7183A6) : Color(value);
}

IconData _iconForSlug(String slug) {
  return switch (slug) {
    'shopping-cart' => Icons.shopping_cart_checkout_outlined,
    'utensils-crossed' => Icons.restaurant_outlined,
    'scissors' => Icons.content_cut_outlined,
    'sparkles' => Icons.auto_awesome_outlined,
    'monitor-smartphone' => Icons.devices_other_outlined,
    'house-plus' => Icons.home_repair_service_outlined,
    'layout-grid' => Icons.apps_outlined,
    _ => Icons.category_outlined,
  };
}

IconData _variantIcon(String variant) {
  return switch (variant) {
    'plate' => Icons.ramen_dining_outlined,
    'suit' => Icons.checkroom_outlined,
    'basket' => Icons.local_grocery_store_outlined,
    'salon' => Icons.content_cut_outlined,
    'shelf' => Icons.storefront_outlined,
    'phone' => Icons.smartphone_outlined,
    'worker' => Icons.handyman_outlined,
    _ => Icons.image_outlined,
  };
}
