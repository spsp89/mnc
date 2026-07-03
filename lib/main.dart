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
                  child: Column(
                    children: [
                      _HeroSection(
                        catalog: catalog,
                        usingFallback: usingFallback,
                        onRefresh: onRefresh,
                        showPreviewChrome: showPreviewChrome,
                      ),
                      Transform.translate(
                        offset: const Offset(0, -22),
                        child: _ContentSection(catalog: catalog),
                      ),
                    ],
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
                _HeroGraphic(
                  primary: heroPrimary,
                  secondary: heroSecondary,
                ),
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
                    isExplain: section.id == 'explain',
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
  const _PlatformNavChip({
    required this.label,
    required this.active,
    required this.isExplain,
  });

  final String label;
  final bool active;
  final bool isExplain;

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
              : isExplain
              ? const Color(0xFFF0B0B0)
              : Colors.white.withValues(alpha: 0.86),
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
      final haystack =
          '${item.categoryName} ${item.subtitle} ${item.name}'.toLowerCase();
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
