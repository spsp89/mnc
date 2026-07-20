import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'src/catalog_api_config.dart';
import 'src/catalog_models.dart';
import 'src/catalog_seed.dart';
import 'src/catalog_service.dart';
import 'src/clinic_service.dart';
import 'src/deals_service.dart';
import 'src/location_result.dart';
import 'src/location_service.dart';
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
  const NearuHomePage({super.key, this.catalogService});

  final CatalogService? catalogService;

  @override
  State<NearuHomePage> createState() => _NearuHomePageState();
}

class _NearuHomePageState extends State<NearuHomePage> {
  late final CatalogService _catalogService;
  late final bool _ownsCatalogService;

  CatalogData _catalog = fallbackCatalog;
  CatalogQuery _activeQuery = const CatalogQuery();
  DetectedLocation? _detectedLocation;
  bool _isLoadingCatalog = true;
  bool _usingFallback = false;
  bool _isDetectingLocation = false;
  String? _catalogError;
  String? _locationError;

  @override
  void initState() {
    super.initState();
    _catalogService = widget.catalogService ?? CatalogService();
    _ownsCatalogService = widget.catalogService == null;
    _refreshCatalog();
    _detectLocation();
  }

  Future<void> _detectLocation() async {
    if (_isDetectingLocation) {
      return;
    }

    setState(() {
      _isDetectingLocation = true;
      _locationError = null;
    });

    final location = await detectCurrentLocation();
    if (!mounted) {
      return;
    }

    setState(() {
      _detectedLocation = location;
      _isDetectingLocation = false;
      _locationError = location == null
          ? 'Location permission was denied or unavailable.'
          : null;
    });
  }

  Future<void> _refreshCatalog({CatalogQuery query = const CatalogQuery()}) async {
    setState(() {
      _isLoadingCatalog = true;
      _catalogError = null;
      _activeQuery = query;
    });

    try {
      final catalog = await _catalogService.fetchCatalog(query: query);
      if (!mounted) {
        return;
      }

      setState(() {
        _catalog = catalog;
        _isLoadingCatalog = false;
        _usingFallback = false;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        if (useCatalogFallback) {
          _catalog = fallbackCatalog;
        }
        _isLoadingCatalog = false;
        _usingFallback = useCatalogFallback;
        _catalogError = error is CatalogException
            ? error.message
            : 'Catalog API is unavailable.';
      });
    }
  }

  Future<void> _searchCatalog(String query) async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => BncSearchPage(
          initialQuery: query.trim(),
          catalogService: widget.catalogService,
        ),
      ),
    );
  }

  Future<void> _openCategory(String categorySlug) async {
    if (categorySlug == 'clinic') {
      await Navigator.of(context).push(
        MaterialPageRoute<void>(builder: (_) => const BncDoctorBookingPage()),
      );
      return;
    }

    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => BncCategoryBrowsePage(
          initialCategorySlug: categorySlug,
          initialCategories: _catalog.categories,
          catalogService: widget.catalogService,
        ),
      ),
    );
  }

  @override
  void dispose() {
    if (_ownsCatalogService) {
      _catalogService.close();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final usePreviewShell = constraints.maxWidth > 500;

        Widget screen = _MobileHomeScreen(
          catalog: _catalog,
          activeQuery: _activeQuery,
          detectedLocation: _detectedLocation,
          isLoadingCatalog: _isLoadingCatalog,
          usingFallback: _usingFallback,
          isDetectingLocation: _isDetectingLocation,
          catalogError: _catalogError,
          locationError: _locationError,
          onRefresh: () => _refreshCatalog(query: _activeQuery),
          onDetectLocation: _detectLocation,
          onSearch: _searchCatalog,
          onCategorySelected: _openCategory,
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
          body: SafeArea(
            top: !usePreviewShell,
            bottom: false,
            child: screen,
          ),
        );
      },
    );
  }
}

class _MobileHomeScreen extends StatelessWidget {
  const _MobileHomeScreen({
    required this.catalog,
    required this.activeQuery,
    required this.detectedLocation,
    required this.isLoadingCatalog,
    required this.usingFallback,
    required this.isDetectingLocation,
    required this.catalogError,
    required this.locationError,
    required this.onRefresh,
    required this.onDetectLocation,
    required this.onSearch,
    required this.onCategorySelected,
    required this.showPreviewChrome,
  });

  final CatalogData catalog;
  final CatalogQuery activeQuery;
  final DetectedLocation? detectedLocation;
  final bool isLoadingCatalog;
  final bool usingFallback;
  final bool isDetectingLocation;
  final String? catalogError;
  final String? locationError;
  final Future<void> Function() onRefresh;
  final Future<void> Function() onDetectLocation;
  final Future<void> Function(String query) onSearch;
  final Future<void> Function(String categorySlug) onCategorySelected;
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
                    activeQuery: activeQuery,
                    detectedLocation: detectedLocation,
                    isLoadingCatalog: isLoadingCatalog,
                    usingFallback: usingFallback,
                    isDetectingLocation: isDetectingLocation,
                    catalogError: catalogError,
                    locationError: locationError,
                    onRefresh: onRefresh,
                    onDetectLocation: onDetectLocation,
                    onSearch: onSearch,
                    onCategorySelected: onCategorySelected,
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

class BncCategoryBrowsePage extends StatefulWidget {
  const BncCategoryBrowsePage({
    super.key,
    required this.initialCategorySlug,
    required this.initialCategories,
    this.catalogService,
  });

  final String initialCategorySlug;
  final List<CategoryItem> initialCategories;
  final CatalogService? catalogService;

  @override
  State<BncCategoryBrowsePage> createState() => _BncCategoryBrowsePageState();
}

class _BncCategoryBrowsePageState extends State<BncCategoryBrowsePage> {
  late final CatalogService _catalogService;
  late final bool _ownsCatalogService;

  late String _categorySlug;
  CatalogData? _catalog;
  bool _isLoading = true;
  bool _usingFallback = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _catalogService = widget.catalogService ?? CatalogService();
    _ownsCatalogService = widget.catalogService == null;
    _categorySlug = widget.initialCategorySlug;
    _loadCategory(_categorySlug);
  }

  Future<void> _loadCategory(String slug) async {
    setState(() {
      _categorySlug = slug;
      _isLoading = true;
      _error = null;
    });

    try {
      final catalog = await _catalogService.fetchCatalog(
        query: CatalogQuery(categorySlug: slug),
      );
      if (!mounted) {
        return;
      }

      setState(() {
        _catalog = catalog;
        _isLoading = false;
        _usingFallback = false;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _catalog = useCatalogFallback ? _fallbackCategoryCatalog(slug) : null;
        _isLoading = false;
        _usingFallback = useCatalogFallback;
        _error = error is CatalogException
            ? error.message
            : 'Category could not be loaded.';
      });
    }
  }

  @override
  void dispose() {
    if (_ownsCatalogService) {
      _catalogService.close();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final catalog = _catalog;
    final categories = catalog?.categories.isNotEmpty == true
        ? catalog!.categories
        : widget.initialCategories;
    final categoryName = _categoryNameForSlug(categories, _categorySlug);
    final businesses = catalog?.all ?? const <BusinessItem>[];
    final shopCards = _shopSpecsFromBusinesses(businesses, const []);

    return _BncPhoneSizedRoute(
      child: Scaffold(
        backgroundColor: brandSurface,
        body: SafeArea(
          child: RefreshIndicator(
            color: brandNavy,
            onRefresh: () => _loadCategory(_categorySlug),
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                SliverToBoxAdapter(
                  child: _CategoryBrowseHeader(
                    title: categoryName,
                    count: businesses.length,
                    isLoading: _isLoading,
                    usingFallback: _usingFallback,
                    error: _error,
                    onRetry: () => _loadCategory(_categorySlug),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 18, 16, 0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const _BncSectionTitle(title: 'Browse categories'),
                        const SizedBox(height: 12),
                        if (categories.isEmpty && _isLoading)
                          const _BncCategorySkeleton()
                        else if (categories.isEmpty)
                          const _BncEmptyPanel(
                            icon: Icons.category_outlined,
                            title: 'No categories yet',
                            text: 'Categories added from the web admin will appear here.',
                          )
                        else
                          _BncCategoryRail(
                            items: _categorySpecsFromCategories(
                              categories,
                              _categorySlug,
                            ),
                            onSelected: _loadCategory,
                          ),
                        const SizedBox(height: 24),
                        _BncSectionTitle(title: '$categoryName businesses'),
                        const SizedBox(height: 12),
                        if (_isLoading && shopCards.isEmpty)
                          const _BncGridSkeleton()
                        else if (shopCards.isEmpty)
                          _BncEmptyPanel(
                            icon: Icons.storefront_outlined,
                            title: 'No businesses found',
                            text: _error == null
                                ? 'Listings for this category will appear here once they are added.'
                                : 'Pull to refresh or try another category.',
                          )
                        else
                          _BncShopGrid(
                            shops: shopCards,
                            catalogService: _catalogService,
                          ),
                        const SizedBox(height: 110),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class BncFeaturedShopsPage extends StatefulWidget {
  const BncFeaturedShopsPage({super.key, this.catalogService});

  final CatalogService? catalogService;

  @override
  State<BncFeaturedShopsPage> createState() => _BncFeaturedShopsPageState();
}

class _BncFeaturedShopsPageState extends State<BncFeaturedShopsPage> {
  late final CatalogService _catalogService;
  late final bool _ownsCatalogService;

  CatalogData? _catalog;
  bool _isLoading = true;
  bool _usingFallback = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _catalogService = widget.catalogService ?? CatalogService();
    _ownsCatalogService = widget.catalogService == null;
    _loadFeatured();
  }

  Future<void> _loadFeatured() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final catalog = await _catalogService.fetchCatalog(
        query: const CatalogQuery(featured: true, sort: 'rating'),
      );
      if (!mounted) {
        return;
      }

      setState(() {
        _catalog = catalog;
        _isLoading = false;
        _usingFallback = false;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _catalog = useCatalogFallback
            ? CatalogData(
                categories: fallbackCatalog.categories,
                featured: fallbackCatalog.featured,
                popular: fallbackCatalog.popular,
                all: fallbackCatalog.featured,
                stats: fallbackCatalog.stats,
                filters: const CatalogFilters(featured: true, sort: 'rating'),
              )
            : null;
        _isLoading = false;
        _usingFallback = useCatalogFallback;
        _error = error is CatalogException
            ? error.message
            : 'Featured shops could not be loaded.';
      });
    }
  }

  @override
  void dispose() {
    if (_ownsCatalogService) {
      _catalogService.close();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final businesses = _catalog?.all ?? const <BusinessItem>[];
    final shopCards = _shopSpecsFromBusinesses(businesses, const []);

    return _BncPhoneSizedRoute(
      child: Scaffold(
        backgroundColor: brandSurface,
        body: SafeArea(
          child: RefreshIndicator(
            color: brandNavy,
            onRefresh: _loadFeatured,
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                SliverToBoxAdapter(
                  child: _CategoryBrowseHeader(
                    label: 'Star shops',
                    title: 'Featured shops',
                    description:
                        'Top-rated local businesses selected from the catalog.',
                    count: businesses.length,
                    isLoading: _isLoading,
                    usingFallback: _usingFallback,
                    error: _error,
                    onRetry: _loadFeatured,
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 18, 16, 110),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const _BncSectionTitle(title: 'Star shops near you'),
                        const SizedBox(height: 12),
                        if (_isLoading && shopCards.isEmpty)
                          const _BncGridSkeleton()
                        else if (shopCards.isEmpty)
                          _BncEmptyPanel(
                            icon: Icons.star_border_rounded,
                            title: 'No star shops yet',
                            text: _error == null
                                ? 'Featured businesses will appear here once they are added.'
                                : 'Pull to refresh or try again.',
                          )
                        else
                          _BncShopGrid(
                            shops: shopCards,
                            catalogService: _catalogService,
                          ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class BncAllShopsPage extends StatefulWidget {
  const BncAllShopsPage({super.key, this.catalogService});

  final CatalogService? catalogService;

  @override
  State<BncAllShopsPage> createState() => _BncAllShopsPageState();
}

class _BncAllShopsPageState extends State<BncAllShopsPage> {
  late final CatalogService _catalogService;
  late final bool _ownsCatalogService;

  CatalogData? _catalog;
  bool _isLoading = true;
  bool _usingFallback = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _catalogService = widget.catalogService ?? CatalogService();
    _ownsCatalogService = widget.catalogService == null;
    _loadAllShops();
  }

  Future<void> _loadAllShops() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final catalog = await _catalogService.fetchCatalog();
      if (!mounted) {
        return;
      }

      setState(() {
        _catalog = catalog;
        _isLoading = false;
        _usingFallback = false;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _catalog = useCatalogFallback ? fallbackCatalog : null;
        _isLoading = false;
        _usingFallback = useCatalogFallback;
        _error = error is CatalogException
            ? error.message
            : 'All shops could not be loaded.';
      });
    }
  }

  @override
  void dispose() {
    if (_ownsCatalogService) {
      _catalogService.close();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final businesses = _catalog?.all ?? const <BusinessItem>[];
    final shopCards = _shopSpecsFromBusinesses(
      businesses,
      _catalog == fallbackCatalog ? _allBncShops : const [],
    );

    return _BncPhoneSizedRoute(
      child: Scaffold(
        backgroundColor: brandSurface,
        body: SafeArea(
          child: RefreshIndicator(
            color: brandNavy,
            onRefresh: _loadAllShops,
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                SliverToBoxAdapter(
                  child: _CategoryBrowseHeader(
                    label: 'All shops',
                    title: 'All shops in Kozhikode',
                    description:
                        'Browse trusted local businesses and open shop details.',
                    count: businesses.length,
                    isLoading: _isLoading,
                    usingFallback: _usingFallback,
                    error: _error,
                    onRetry: _loadAllShops,
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 18, 16, 110),
                    child: _BncAllShopsSection(
                      isLoadingCatalog: _isLoading,
                      activeQuery: const CatalogQuery(),
                      allCards: shopCards,
                      compact: false,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _CategoryBrowseHeader extends StatelessWidget {
  const _CategoryBrowseHeader({
    this.label = 'Categories',
    required this.title,
    this.description = 'Explore trusted local businesses from the live catalog.',
    required this.count,
    required this.isLoading,
    required this.usingFallback,
    required this.error,
    required this.onRetry,
  });

  final String label;
  final String title;
  final String description;
  final int count;
  final bool isLoading;
  final bool usingFallback;
  final String? error;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 22),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [brandNavyDeep, brandNavy, brandNavyBright],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(Icons.arrow_back, color: Colors.white),
              ),
              const SizedBox(width: 4),
              Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
            decoration: BoxDecoration(
              color: brandGold,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              isLoading ? 'Loading listings' : '$count listings',
              style: const TextStyle(
                color: brandNavy,
                fontSize: 12,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 34,
              height: 1,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            description,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.84),
              fontSize: 13.5,
              height: 1.35,
              fontWeight: FontWeight.w700,
            ),
          ),
          if (isLoading || usingFallback || error != null) ...[
            const SizedBox(height: 12),
            _CatalogStatusBanner(
              isLoading: isLoading,
              usingFallback: usingFallback,
              error: error,
              onRetry: onRetry,
            ),
          ],
        ],
      ),
    );
  }
}

CatalogData _fallbackCategoryCatalog(String slug) {
  final businesses = fallbackCatalog.all
      .where((business) => business.categorySlug == slug)
      .toList();

  return CatalogData(
    categories: fallbackCatalog.categories,
    featured: businesses.where((business) => business.isFeatured).toList(),
    popular: businesses.where((business) => business.isPopular).toList(),
    all: businesses,
    filters: CatalogFilters(categorySlug: slug),
    stats: CatalogStats(
      categories: fallbackCatalog.categories.length,
      businesses: businesses.length,
      trusted: businesses.where((business) => business.isPopular).length,
      happyUsers: fallbackCatalog.stats.happyUsers,
    ),
  );
}

String _categoryNameForSlug(List<CategoryItem> categories, String slug) {
  for (final category in categories) {
    if (category.slug == slug) {
      return category.name;
    }
  }

  return slug
      .split('-')
      .where((part) => part.isNotEmpty)
      .map((part) => '${part[0].toUpperCase()}${part.substring(1)}')
      .join(' ');
}

class BncSearchPage extends StatefulWidget {
  const BncSearchPage({
    super.key,
    required this.initialQuery,
    this.catalogService,
  });

  final String initialQuery;
  final CatalogService? catalogService;

  @override
  State<BncSearchPage> createState() => _BncSearchPageState();
}

class _BncSearchPageState extends State<BncSearchPage> {
  late final CatalogService _catalogService;
  late final bool _ownsCatalogService;

  CatalogData? _catalog;
  String _query = '';
  bool _isLoading = false;
  bool _usingFallback = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _catalogService = widget.catalogService ?? CatalogService();
    _ownsCatalogService = widget.catalogService == null;
    _query = widget.initialQuery.trim();
    if (_query.isNotEmpty) {
      _runSearch(_query);
    }
  }

  Future<void> _runSearch(String value) async {
    final query = value.trim();
    setState(() {
      _query = query;
      _error = null;
      _usingFallback = false;
      if (query.isEmpty) {
        _catalog = null;
        _isLoading = false;
      } else {
        _isLoading = true;
      }
    });

    if (query.isEmpty) {
      return;
    }

    try {
      final catalog = await _catalogService.fetchCatalog(
        query: CatalogQuery(query: query),
      );
      if (!mounted) {
        return;
      }

      setState(() {
        _catalog = catalog;
        _isLoading = false;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _catalog = useCatalogFallback ? _fallbackSearchCatalog(query) : null;
        _isLoading = false;
        _usingFallback = useCatalogFallback;
        _error = error is CatalogException
            ? error.message
            : 'Search could not be completed.';
      });
    }
  }

  @override
  void dispose() {
    if (_ownsCatalogService) {
      _catalogService.close();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final businesses = _catalog?.all ?? const <BusinessItem>[];
    final shopCards = _shopSpecsFromBusinesses(businesses, const []);
    final hasQuery = _query.isNotEmpty;

    return _BncPhoneSizedRoute(
      child: Scaffold(
        backgroundColor: brandSurface,
        body: SafeArea(
          child: RefreshIndicator(
            color: brandNavy,
            onRefresh: () => hasQuery ? _runSearch(_query) : Future<void>.value(),
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                SliverToBoxAdapter(
                  child: _SearchResultsHeader(
                    query: _query,
                    count: businesses.length,
                    isLoading: _isLoading,
                    usingFallback: _usingFallback,
                    error: _error,
                    onSearch: _runSearch,
                    onRetry: () => _runSearch(_query),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 18, 16, 110),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                      _BncSectionTitle(
                        title: hasQuery ? 'Search results' : 'Start a search',
                      ),
                      const SizedBox(height: 12),
                      if (!hasQuery)
                        _BncSearchStartPanel(
                          onSearch: _runSearch,
                        )
                        else if (_isLoading && shopCards.isEmpty)
                          const _BncGridSkeleton()
                        else if (shopCards.isEmpty)
                          _BncEmptyPanel(
                            icon: Icons.search_off_rounded,
                            title: 'No results found',
                            text: _error == null
                                ? 'Try a different business, service, or category.'
                                : 'Pull to refresh or try another search.',
                          )
                        else
                          _BncShopGrid(
                            shops: shopCards,
                            catalogService: _catalogService,
                          ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SearchResultsHeader extends StatelessWidget {
  const _SearchResultsHeader({
    required this.query,
    required this.count,
    required this.isLoading,
    required this.usingFallback,
    required this.error,
    required this.onSearch,
    required this.onRetry,
  });

  final String query;
  final int count;
  final bool isLoading;
  final bool usingFallback;
  final String? error;
  final Future<void> Function(String query) onSearch;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 22),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [brandNavyDeep, brandNavy, brandNavyBright],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(
                onPressed: () => Navigator.of(context).pop(),
                visualDensity: VisualDensity.compact,
                icon: const Icon(Icons.arrow_back, color: Colors.white, size: 22),
              ),
              const SizedBox(width: 4),
              const Expanded(
                child: Text(
                  'Search',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: brandGold,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(
                  Icons.manage_search_rounded,
                  color: brandNavy,
                  size: 22,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _BncSearchBox(initialQuery: query, onSearch: onSearch),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
            decoration: BoxDecoration(
              color: brandGold,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(
              isLoading
                  ? 'Searching catalog'
                  : query.isEmpty
                      ? 'Enter a keyword'
                      : '$count matches',
              style: const TextStyle(
                color: brandNavy,
                fontSize: 12,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            query.isEmpty ? 'Find local businesses' : 'Results for "$query"',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 32,
              height: 1,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'Search by business name, service, category, tag, or nearby location.',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.84),
              fontSize: 13.5,
              height: 1.35,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _BncSearchQuickChip(label: 'Restaurants', onTap: onSearch),
              _BncSearchQuickChip(label: 'Grocery', onTap: onSearch),
              _BncSearchQuickChip(label: 'Beauty', onTap: onSearch),
              _BncSearchQuickChip(label: 'Home services', onTap: onSearch),
            ],
          ),
          if (isLoading || usingFallback || error != null) ...[
            const SizedBox(height: 12),
            _CatalogStatusBanner(
              isLoading: isLoading,
              usingFallback: usingFallback,
              error: error,
              onRetry: onRetry,
            ),
          ],
        ],
      ),
    );
  }
}

class _BncSearchQuickChip extends StatelessWidget {
  const _BncSearchQuickChip({required this.label, required this.onTap});

  final String label;
  final Future<void> Function(String query) onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => onTap(label),
      borderRadius: BorderRadius.circular(999),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: Colors.white.withValues(alpha: 0.16)),
        ),
        child: Text(
          label,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 11.5,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
    );
  }
}

class _BncSearchStartPanel extends StatelessWidget {
  const _BncSearchStartPanel({required this.onSearch});

  final Future<void> Function(String query) onSearch;

  @override
  Widget build(BuildContext context) {
    const suggestions = [
      (Icons.restaurant_outlined, 'Restaurants', 'Food, cafes and family dining'),
      (Icons.shopping_cart_outlined, 'Grocery', 'Fresh stores and daily essentials'),
      (Icons.content_cut_outlined, 'Beauty', 'Salon, spa and grooming'),
      (Icons.handyman_outlined, 'Repairs', 'Home services near you'),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFEAF1FF),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: brandLine),
          ),
          child: const Row(
            children: [
              Icon(Icons.auto_awesome_rounded, color: brandNavy, size: 28),
              SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Try a shop, category, product, service, area or tag.',
                  style: TextStyle(
                    color: brandNavy,
                    fontSize: 13,
                    height: 1.3,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
          childAspectRatio: 1.45,
          children: suggestions.map((item) {
            return InkWell(
              onTap: () => onSearch(item.$2),
              borderRadius: BorderRadius.circular(18),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: brandLine),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(item.$1, color: brandNavy, size: 24),
                    const Spacer(),
                    Text(
                      item.$2,
                      style: const TextStyle(
                        color: brandNavy,
                        fontSize: 13,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      item.$3,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: brandMuted,
                        fontSize: 10.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}

CatalogData _fallbackSearchCatalog(String query) {
  final normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery.isEmpty) {
    return const CatalogData(
      categories: [],
      featured: [],
      popular: [],
      all: [],
      stats: CatalogStats(
        categories: 0,
        businesses: 0,
        trusted: 0,
        happyUsers: '0',
      ),
    );
  }

  final matches = fallbackCatalog.all.where((business) {
    final haystack = [
      business.name,
      business.shortDescription,
      business.categoryName,
      business.area,
      business.city,
      business.searchText,
      ...business.tags,
    ].join(' ').toLowerCase();

    return haystack.contains(normalizedQuery);
  }).toList();

  return CatalogData(
    categories: fallbackCatalog.categories,
    featured: matches.where((business) => business.isFeatured).toList(),
    popular: matches.where((business) => business.isPopular).toList(),
    all: matches,
    stats: fallbackCatalog.stats,
    filters: CatalogFilters(query: query),
  );
}

void _openBusinessDetail(
  BuildContext context,
  _BncShopSpec shop, {
  CatalogService? catalogService,
}) {
  Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => BncBusinessDetailPage(
        initialShop: shop,
        catalogService: catalogService,
      ),
    ),
  );
}

class BncBusinessDetailPage extends StatefulWidget {
  const BncBusinessDetailPage({
    super.key,
    required this.initialShop,
    this.catalogService,
  });

  final _BncShopSpec initialShop;
  final CatalogService? catalogService;

  @override
  State<BncBusinessDetailPage> createState() => _BncBusinessDetailPageState();
}

class _BncBusinessDetailPageState extends State<BncBusinessDetailPage> {
  late final CatalogService _catalogService;
  late final bool _ownsCatalogService;

  BusinessItem? _business;
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _catalogService = widget.catalogService ?? CatalogService();
    _ownsCatalogService = widget.catalogService == null;
    if (widget.initialShop.slug.isNotEmpty) {
      _loadBusiness();
    }
  }

  Future<void> _loadBusiness() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final business = await _catalogService.fetchBusiness(
        widget.initialShop.slug,
      );
      if (!mounted) {
        return;
      }

      setState(() {
        _business = business;
        _isLoading = false;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _isLoading = false;
        _error = error is CatalogException
            ? error.message
            : 'Business details could not be loaded.';
      });
    }
  }

  @override
  void dispose() {
    if (_ownsCatalogService) {
      _catalogService.close();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final business = _business;
    final title = business?.name ?? widget.initialShop.name;
    final description =
        business?.shortDescription ?? widget.initialShop.description;
    final category = business?.categoryName ?? widget.initialShop.category;
    final rating = business?.rating.toStringAsFixed(1) ?? widget.initialShop.rating;
    final reviews = business?.reviewCount.toString() ?? widget.initialShop.reviews;
    final distance = business != null
        ? '${business.distanceKm.toStringAsFixed(1)} km'
        : widget.initialShop.distance;
    final address = business?.location.label ??
        widget.initialShop.address?.label ??
        'Location not added';
    final contact = business?.contact ?? widget.initialShop.contact;
    final image = business != null
        ? (_businessAssetByVariant[business.coverVariant] ??
            '$_mockupPath/im-restaurant.jpg')
        : widget.initialShop.asset;
    final imageUrl = business?.primaryImage.url ?? widget.initialShop.imageUrl;
    final isFeatured = business?.isFeatured ?? widget.initialShop.isFeatured;
    final isPopular = business?.isPopular ?? widget.initialShop.isPopular;

    return LayoutBuilder(
      builder: (context, constraints) {
        final usePreviewShell = constraints.maxWidth > 500;

        Widget screen = Scaffold(
      backgroundColor: brandSurface,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [brandNavyDeep, brandNavy, brandNavyBright],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(10, 8, 16, 0),
                      child: IconButton(
                        onPressed: () => Navigator.of(context).pop(),
                        icon: const Icon(Icons.arrow_back, color: Colors.white),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 22),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              _BusinessPill(label: category, color: brandGold),
                              if (isFeatured)
                                const _BusinessPill(
                                  label: 'Featured',
                                  color: Color(0xFF2469D6),
                                  foreground: Colors.white,
                                ),
                              if (isPopular)
                                const _BusinessPill(
                                  label: 'Popular',
                                  color: Color(0xFFF4A51C),
                                ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Text(
                            title,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 34,
                              height: 1,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            description.isEmpty
                                ? 'Business description not added yet.'
                                : description,
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.84),
                              fontSize: 14,
                              height: 1.35,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 14),
                          Row(
                            children: [
                              const Icon(
                                Icons.star_rounded,
                                color: brandGold,
                                size: 18,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                '$rating ($reviews)',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              const SizedBox(width: 14),
                              const Icon(
                                Icons.location_on_outlined,
                                color: Colors.white,
                                size: 18,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                distance,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ],
                          ),
                          if (_isLoading || _error != null) ...[
                            const SizedBox(height: 12),
                            _CatalogStatusBanner(
                              isLoading: _isLoading,
                              usingFallback: false,
                              error: _error,
                              onRetry: _loadBusiness,
                            ),
                          ],
                        ],
                      ),
                    ),
                    ClipRRect(
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(26),
                      ),
                      child: SizedBox(
                        height: 220,
                        width: double.infinity,
                        child: _AssetImageFill(
                          asset: image,
                          imageUrl: imageUrl,
                          darken: true,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 18, 16, 110),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const _BncSectionTitle(title: 'Contact'),
                    const SizedBox(height: 12),
                    _DetailInfoCard(
                      children: [
                        _DetailInfoRow(
                          icon: Icons.phone_outlined,
                          label: 'Phone',
                          value: contact.phone ?? 'Phone not added',
                        ),
                        _DetailInfoRow(
                          icon: Icons.chat_outlined,
                          label: 'WhatsApp',
                          value: contact.whatsapp ?? 'WhatsApp not added',
                        ),
                        _DetailInfoRow(
                          icon: Icons.email_outlined,
                          label: 'Email',
                          value: contact.email ?? 'Email not added',
                        ),
                        _DetailInfoRow(
                          icon: Icons.language_outlined,
                          label: 'Website',
                          value: contact.website ?? 'Website not added',
                        ),
                      ],
                    ),
                    const SizedBox(height: 22),
                    const _BncSectionTitle(title: 'Address'),
                    const SizedBox(height: 12),
                    _DetailInfoCard(
                      children: [
                        _DetailInfoRow(
                          icon: Icons.location_on_outlined,
                          label: 'Location',
                          value: address,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );

        screen = _BncPageWithBottomNav(child: screen);

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
          backgroundColor: usePreviewShell ? brandSoft : brandSurface,
          body: SafeArea(top: !usePreviewShell, bottom: false, child: screen),
        );
      },
    );
  }
}

class _BusinessPill extends StatelessWidget {
  const _BusinessPill({
    required this.label,
    required this.color,
    this.foreground = brandNavy,
  });

  final String label;
  final Color color;
  final Color foreground;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: foreground,
          fontSize: 12,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }
}

class _DetailInfoCard extends StatelessWidget {
  const _DetailInfoCard({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: brandLine),
      ),
      child: Column(children: children),
    );
  }
}

class _DetailInfoRow extends StatelessWidget {
  const _DetailInfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: brandSoft,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: brandNavy, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    color: brandMuted,
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  value,
                  style: const TextStyle(
                    color: brandNavy,
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BncCategorySpec {
  const _BncCategorySpec(
    this.label,
    this.icon,
    this.color,
    this.tint, {
    this.slug = '',
    this.isActive = false,
  });

  final String label;
  final String slug;
  final IconData icon;
  final Color color;
  final Color tint;
  final bool isActive;
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
    required this.code,
  });

  final String badge;
  final Color badgeColor;
  final String title;
  final String text;
  final String shop;
  final String asset;
  final List<Color> colors;
  final String code;
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
    this.imageUrl = '',
    this.slug = '',
    this.description = '',
    this.contact = const BusinessContact(),
    this.address,
    this.isFeatured = false,
    this.isPopular = false,
  });

  final String slug;
  final String name;
  final String category;
  final String description;
  final String rating;
  final String reviews;
  final String distance;
  final String asset;
  final String imageUrl;
  final String badge;
  final Color badgeColor;
  final BusinessContact contact;
  final BusinessAddress? address;
  final bool isFeatured;
  final bool isPopular;
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
    this.imageUrl = '',
    this.slug = '',
    this.description = '',
  });

  final int rank;
  final String slug;
  final String name;
  final String category;
  final String description;
  final String rating;
  final String reviews;
  final String distance;
  final String asset;
  final String imageUrl;
}

class _BncEcosystemSpec {
  const _BncEcosystemSpec(this.title, this.text, this.icon, this.badge);

  final String title;
  final String text;
  final IconData icon;
  final String badge;
}

const _mockupPath = 'nearu-web/public/mockup';

_BncCategorySpec _clinicCategorySpec({bool isActive = false}) {
  return _BncCategorySpec(
    'Clinic',
    Icons.local_hospital_outlined,
    brandNavy,
    const Color(0xFFF3F6FB),
    slug: 'clinic',
    isActive: isActive,
  );
}

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
    code: 'BAKE20',
  ),
  _BncDealSpec(
    badge: 'Rs599',
    badgeColor: Color(0xFF2565C7),
    title: 'Limited Time Offer',
    text: 'Hair spa and haircut combo',
    shop: 'Maya Beauty Salon',
    asset: '$_mockupPath/im-beauty.jpg',
    colors: [Color(0xFFEEF5FF), Colors.white, Color(0xFFE7F0FF)],
    code: 'SPA599',
  ),
  _BncDealSpec(
    badge: '15% OFF',
    badgeColor: Color(0xFFF3A51A),
    title: 'Fashion Fiesta',
    text: 'Flat 15% off on all men wear',
    shop: 'Royale Tailors',
    asset: '$_mockupPath/im-card_suit.jpg',
    colors: [Color(0xFFFFF2D8), Colors.white, Color(0xFFFFF0CE)],
    code: 'STYLE15',
  ),
  _BncDealSpec(
    badge: 'B1G1',
    badgeColor: Color(0xFF7242B8),
    title: 'Buy 1 Get 1',
    text: 'On selected burgers and fries',
    shop: 'ALUKKY Hotel',
    asset: '$_mockupPath/im-restaurant.jpg',
    colors: [Color(0xFFF4EAFF), Colors.white, Color(0xFFEADCFF)],
    code: 'PIZZA1',
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
    'Create',
  ),
  _BncEcosystemSpec(
    'B2B Network',
    'Connect & grow with businesses',
    Icons.hub_outlined,
    'Network',
  ),
  _BncEcosystemSpec(
    'Jobs',
    'Find jobs or hire local talent',
    Icons.business_center_outlined,
    'Hiring',
  ),
  _BncEcosystemSpec(
    'Winner',
    'Join contests & win exciting prizes',
    Icons.emoji_events_outlined,
    'Rewards',
  ),
  _BncEcosystemSpec(
    'Doctor Booking',
    'Book nearby clinics and doctors',
    Icons.medical_services_outlined,
    'Health',
  ),
  _BncEcosystemSpec(
    'Feed',
    'Read & share local stories & updates',
    Icons.article_outlined,
    'Local',
  ),
  _BncEcosystemSpec(
    'Plans',
    'Choose the best plan for your business',
    Icons.shield_outlined,
    'Plans',
  ),
  _BncEcosystemSpec(
    'Dashboard',
    'Manage your business performance',
    Icons.analytics_outlined,
    'Insights',
  ),
  _BncEcosystemSpec(
    'Admin',
    'Manage users, reports & system',
    Icons.settings_outlined,
    'Admin',
  ),
  _BncEcosystemSpec(
    'Explanations',
    'Guides, help articles & resources',
    Icons.lightbulb_outline,
    'Help',
  ),
];

const _businessAssetByVariant = {
  'plate': '$_mockupPath/im-restaurant.jpg',
  'suit': '$_mockupPath/im-card_suit.jpg',
  'basket': '$_mockupPath/im-vegetables.jpg',
  'salon': '$_mockupPath/im-beauty.jpg',
  'shelf': '$_mockupPath/im-supermarket.jpg',
  'phone': '$_mockupPath/im-mobile.jpg',
  'worker': '$_mockupPath/im-occ_helper.jpg',
};

List<_BncCategorySpec> _categorySpecsFromCatalog(
  CatalogData catalog, [
  String activeCategorySlug = '',
]) {
  return _categorySpecsFromCategories(catalog.categories, activeCategorySlug);
}

List<_BncCategorySpec> _categorySpecsFromCategories(
  List<CategoryItem> categories, [
  String activeCategorySlug = '',
]) {
  final databaseItems = categories
      .where((item) => item.name.trim().isNotEmpty)
      .map((item) {
        final color = _colorFromHex(item.accent, brandNavy);
        return _BncCategorySpec(
          item.name,
          _iconForCatalogCategory(item),
          color,
          color.withValues(alpha: 0.12),
          slug: item.slug,
          isActive: activeCategorySlug.isNotEmpty
              ? item.slug == activeCategorySlug
              : item.isActive,
        );
      })
      .toList();

  final merged = _mergeCategorySpecs(
    databaseItems,
    _bncCategories,
    _bncCategories.length,
  );

  final clinic = _clinicCategorySpec(isActive: activeCategorySlug == 'clinic');
  final withoutClinic = merged
      .where((item) => _normalizeKey(item.label) != _normalizeKey(clinic.label))
      .toList();
  final insertIndex = withoutClinic.isNotEmpty ? 1 : 0;
  withoutClinic.insert(insertIndex, clinic);
  return withoutClinic;
}

List<_BncShopSpec> _shopSpecsFromBusinesses(
  List<BusinessItem> businesses,
  List<_BncShopSpec> fallback, {
  int? minimum,
}) {
  final databaseItems = businesses.map(_shopSpecFromBusiness).toList();
  return _mergeShopSpecs(databaseItems, fallback, minimum ?? fallback.length);
}

List<_BncRankedSpec> _rankedSpecsFromBusinesses(List<BusinessItem> businesses) {
  final sorted = [...businesses]
    ..sort(
      (left, right) => right.rating.compareTo(left.rating) != 0
          ? right.rating.compareTo(left.rating)
          : right.reviewCount.compareTo(left.reviewCount),
    );

  final databaseItems = sorted.take(_rankedBncShops.length).toList();
  if (databaseItems.isEmpty) {
    return _rankedBncShops;
  }

  return List.generate(databaseItems.length, (index) {
    final shop = _shopSpecFromBusiness(databaseItems[index]);
    return _BncRankedSpec(
      rank: index + 1,
      slug: databaseItems[index].slug,
      name: shop.name,
      category: shop.category,
      description: shop.description,
      rating: shop.rating,
      reviews: shop.reviews,
      distance: shop.distance,
      asset: shop.asset,
      imageUrl: shop.imageUrl,
    );
  });
}

List<_BncRankedSpec> _rankedSpecsFromShops(List<_BncShopSpec> shops) {
  return List.generate(shops.length, (index) {
    final shop = shops[index];
    return _BncRankedSpec(
      rank: index + 1,
      slug: shop.slug,
      name: shop.name,
      category: shop.category,
      description: shop.description,
      rating: shop.rating,
      reviews: shop.reviews,
      distance: shop.distance,
      asset: shop.asset,
      imageUrl: shop.imageUrl,
    );
  });
}

_BncShopSpec _shopSpecFromBusiness(BusinessItem business) {
  return _BncShopSpec(
    slug: business.slug,
    name: business.name,
    category: business.categoryName.isNotEmpty
        ? business.categoryName
        : business.shortDescription,
    description: business.shortDescription,
    rating: business.rating.toStringAsFixed(1),
    reviews: business.reviewCount.toString(),
    distance: '${business.distanceKm.toStringAsFixed(1)} km',
    asset:
        _businessAssetByVariant[business.coverVariant] ??
        '$_mockupPath/im-restaurant.jpg',
    imageUrl: business.primaryImage.url,
    badge:
        business.badgeText ??
        (business.isFeatured
            ? 'Star Shop'
            : business.isPopular
            ? 'Popular'
            : 'Verified'),
    badgeColor: _colorFromHex(
      business.badgeColor,
      business.isFeatured
          ? const Color(0xFF2469D6)
          : business.isPopular
          ? const Color(0xFFF4A51C)
          : const Color(0xFF25A451),
    ),
    contact: business.contact,
    address: business.location,
    isFeatured: business.isFeatured,
    isPopular: business.isPopular,
  );
}

List<_BncCategorySpec> _mergeCategorySpecs(
  List<_BncCategorySpec> primary,
  List<_BncCategorySpec> fallback,
  int minimum,
) {
  final merged = <_BncCategorySpec>[];
  final seen = <String>{};

  for (final item in [...primary, ...fallback]) {
    final key = _normalizeKey(item.label);
    if (key.isEmpty || seen.contains(key)) {
      continue;
    }

    seen.add(key);
    merged.add(item);
  }

  return merged
      .take(primary.length > minimum ? primary.length : minimum)
      .toList();
}

List<_BncShopSpec> _mergeShopSpecs(
  List<_BncShopSpec> primary,
  List<_BncShopSpec> fallback,
  int minimum,
) {
  final merged = <_BncShopSpec>[];
  final seen = <String>{};

  for (final item in [...primary, ...fallback]) {
    final key = _normalizeKey(item.name);
    if (key.isEmpty || seen.contains(key)) {
      continue;
    }

    seen.add(key);
    merged.add(item);
  }

  return merged
      .take(primary.length > minimum ? primary.length : minimum)
      .toList();
}

String _normalizeKey(String value) {
  return value.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]+'), '');
}

IconData _iconForCatalogCategory(CategoryItem item) {
  switch (item.icon) {
    case 'shopping-cart':
      return Icons.shopping_cart_outlined;
    case 'utensils-crossed':
      return Icons.restaurant_menu_rounded;
    case 'scissors':
      return Icons.content_cut_rounded;
    case 'sparkles':
      return Icons.brush_outlined;
    case 'monitor-smartphone':
      return Icons.phone_android_outlined;
    case 'house-plus':
      return Icons.home_repair_service_outlined;
    case 'layout-grid':
      return Icons.grid_view_rounded;
  }

  switch (item.slug) {
    case 'restaurants':
    case 'restaurant':
      return Icons.restaurant_menu_rounded;
    case 'bakery-sweets':
      return Icons.cake_outlined;
    case 'tailors':
      return Icons.content_cut_rounded;
    case 'beauty':
      return Icons.brush_outlined;
    case 'electronics':
    case 'mobile':
      return Icons.phone_android_outlined;
    case 'home-services':
      return Icons.home_repair_service_outlined;
    case 'grocery':
      return Icons.shopping_cart_outlined;
    case 'pharmacy':
      return Icons.local_pharmacy_outlined;
    case 'gifts-stationery':
      return Icons.card_giftcard_outlined;
    default:
      return Icons.grid_view_rounded;
  }
}

class _BncMarketplaceHome extends StatelessWidget {
  const _BncMarketplaceHome({
    required this.catalog,
    required this.activeQuery,
    required this.detectedLocation,
    required this.isLoadingCatalog,
    required this.usingFallback,
    required this.isDetectingLocation,
    required this.catalogError,
    required this.locationError,
    required this.onRefresh,
    required this.onDetectLocation,
    required this.onSearch,
    required this.onCategorySelected,
    required this.showPreviewChrome,
  });

  final CatalogData catalog;
  final CatalogQuery activeQuery;
  final DetectedLocation? detectedLocation;
  final bool isLoadingCatalog;
  final bool usingFallback;
  final bool isDetectingLocation;
  final String? catalogError;
  final String? locationError;
  final Future<void> Function() onRefresh;
  final Future<void> Function() onDetectLocation;
  final Future<void> Function(String query) onSearch;
  final Future<void> Function(String categorySlug) onCategorySelected;
  final bool showPreviewChrome;

  @override
  Widget build(BuildContext context) {
    final showingSeedFallback = usingFallback;
    final categoryCards = _categorySpecsFromCatalog(
      catalog,
      activeQuery.categorySlug,
    );
    final featuredCards = _shopSpecsFromBusinesses(
      catalog.featured,
      showingSeedFallback ? _featuredBncShops : const [],
    );
    final popularCards = _shopSpecsFromBusinesses(
      catalog.popular,
      showingSeedFallback ? _featuredBncShops : const [],
    );
    final catalogBusinesses = catalog.all;
    final allCards = _shopSpecsFromBusinesses(
      catalogBusinesses,
      showingSeedFallback ? _allBncShops : const [],
    );
    final hasCatalogData =
        catalog.categories.isNotEmpty ||
        catalog.featured.isNotEmpty ||
        catalog.popular.isNotEmpty ||
        catalog.all.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _BncHero(
          location: detectedLocation?.label ?? catalog.locationLabel,
          locationDetail: detectedLocation?.detail,
          isDetectingLocation: isDetectingLocation,
          locationError: locationError,
          activeQuery: activeQuery,
          isLoading: isLoadingCatalog,
          usingFallback: usingFallback,
          catalogError: catalogError,
          onSearch: onRefresh,
          onDetectLocation: onDetectLocation,
          onKeywordSearch: onSearch,
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
              if (isLoadingCatalog && !hasCatalogData)
                const _BncCategorySkeleton()
              else if (categoryCards.isEmpty)
                const _BncEmptyPanel(
                  icon: Icons.category_outlined,
                  title: 'No categories yet',
                  text: 'Categories added from the web admin will appear here.',
                )
              else
                _BncCategoryRail(
                  items: categoryCards,
                  onSelected: onCategorySelected,
                ),
              const SizedBox(height: 22),
              _BncSectionTitle(
                title: 'Deals in spotlight',
                action: 'View all deals',
                onActionTap: () => _openHeroAction(context, 'deals'),
              ),
              const SizedBox(height: 12),
              const _BncDealRail(),
              const SizedBox(height: 22),
              _BncSectionTitle(
                title: 'Featured shops',
                action: 'View all shops',
                onActionTap: () => _openHeroAction(context, 'featured'),
              ),
              const SizedBox(height: 12),
              if (isLoadingCatalog && catalog.featured.isEmpty)
                const _BncHorizontalShopSkeleton()
              else if (featuredCards.isEmpty)
                const _BncEmptyPanel(
                  icon: Icons.star_border_rounded,
                  title: 'No featured businesses',
                  text: 'Mark listings as featured in the admin panel.',
                )
              else
                _BncFeaturedRail(shops: featuredCards),
              const SizedBox(height: 22),
              _BncSectionTitle(
                title: 'Today\'s top offers',
                action: 'View all offers',
                onActionTap: () => _openHeroAction(context, 'deals'),
              ),
              const SizedBox(height: 12),
              const _BncOfferRail(),
              const SizedBox(height: 24),
              _BncAllShopsSection(
                isLoadingCatalog: isLoadingCatalog,
                activeQuery: activeQuery,
                allCards: allCards,
              ),
              const SizedBox(height: 24),
              _BncPopularBusinessSection(
                isLoadingCatalog: isLoadingCatalog,
                popularCards: popularCards,
                allCards: allCards,
              ),
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
    required this.locationDetail,
    required this.isDetectingLocation,
    required this.locationError,
    required this.activeQuery,
    required this.isLoading,
    required this.usingFallback,
    required this.catalogError,
    required this.onSearch,
    required this.onDetectLocation,
    required this.onKeywordSearch,
    required this.showPreviewChrome,
  });

  final String location;
  final String? locationDetail;
  final bool isDetectingLocation;
  final String? locationError;
  final CatalogQuery activeQuery;
  final bool isLoading;
  final bool usingFallback;
  final String? catalogError;
  final Future<void> Function() onSearch;
  final Future<void> Function() onDetectLocation;
  final Future<void> Function(String query) onKeywordSearch;
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
                  child: _BncLocationPill(
                    location: location,
                    detail: locationDetail,
                    isDetecting: isDetectingLocation,
                    error: locationError,
                    onTap: onDetectLocation,
                  ),
                ),
                const SizedBox(width: 10),
                const _BncBell(),
              ],
            ),
            if (locationError != null) ...[
              const SizedBox(height: 8),
              _BncLocationNotice(
                message: locationError!,
                onRetry: onDetectLocation,
              ),
            ],
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
            _BncSearchBox(
              initialQuery: activeQuery.query,
              onSearch: onKeywordSearch,
            ),
            if (isLoading || usingFallback || catalogError != null) ...[
              const SizedBox(height: 10),
              _CatalogStatusBanner(
                isLoading: isLoading,
                usingFallback: usingFallback,
                error: catalogError,
                onRetry: onSearch,
              ),
            ],
            const SizedBox(height: 14),
            const _BncHeroActions(),
          ],
        ),
      ),
    );
  }
}

class _BncLocationPill extends StatelessWidget {
  const _BncLocationPill({
    required this.location,
    required this.detail,
    required this.isDetecting,
    required this.error,
    required this.onTap,
  });

  final String location;
  final String? detail;
  final bool isDetecting;
  final String? error;
  final Future<void> Function() onTap;

  @override
  Widget build(BuildContext context) {
    final text = isDetecting ? 'Detecting location...' : location;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
          ),
          child: Row(
            children: [
              if (isDetecting)
                const SizedBox(
                  width: 15,
                  height: 15,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(brandGold),
                  ),
                )
              else
                Icon(
                  error == null
                      ? Icons.my_location_rounded
                      : Icons.location_on_outlined,
                  color: Colors.white,
                  size: 15,
                ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  detail == null ? text : '$text - $detail',
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
                Icons.refresh_rounded,
                color: Colors.white,
                size: 16,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BncLocationNotice extends StatelessWidget {
  const _BncLocationNotice({required this.message, required this.onRetry});

  final String message;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(13),
        border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
      ),
      child: Row(
        children: [
          const Icon(Icons.location_disabled_outlined, color: brandGold, size: 17),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              '$message Using Kozhikode for now.',
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 11.5,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          TextButton(
            onPressed: onRetry,
            style: TextButton.styleFrom(
              foregroundColor: brandGold,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              minimumSize: const Size(0, 34),
            ),
            child: const Text(
              'Allow',
              style: TextStyle(fontWeight: FontWeight.w900),
            ),
          ),
        ],
      ),
    );
  }
}

class _BncBell extends StatelessWidget {
  const _BncBell();

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _openNotificationsPage(context),
      child: Stack(
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
                  '3',
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
      ),
    );
  }
}

void _openNotificationsPage(BuildContext context) {
  Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => const BncNotificationsPage(),
    ),
  );
}

class _BncPhoneSizedRoute extends StatelessWidget {
  const _BncPhoneSizedRoute({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth <= 500) {
          return _BncPageWithBottomNav(child: child);
        }

        return Scaffold(
          backgroundColor: brandSoft,
          body: Center(
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
                child: _BncPageWithBottomNav(child: child),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _BncPageWithBottomNav extends StatelessWidget {
  const _BncPageWithBottomNav({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        child,
        const Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          child: Material(
            color: Colors.transparent,
            child: _BottomNavigationBar(),
          ),
        ),
      ],
    );
  }
}

class BncNotificationsPage extends StatefulWidget {
  const BncNotificationsPage({super.key});

  @override
  State<BncNotificationsPage> createState() => _BncNotificationsPageState();
}

class _BncNotificationsPageState extends State<BncNotificationsPage> {
  String _selectedFilter = 'All';

  List<_BncNotificationSpec> get _filteredItems {
    if (_selectedFilter == 'All') {
      return _bncNotifications;
    }

    return _bncNotifications
        .where((item) => item.type == _selectedFilter)
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final items = _filteredItems;
    final unreadCount = _bncNotifications.where((item) => item.unread).length;

    return _BncPhoneSizedRoute(
      child: Scaffold(
        backgroundColor: brandSurface,
        body: SafeArea(
          child: CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: Container(
                  padding: const EdgeInsets.fromLTRB(12, 8, 14, 18),
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [brandNavyDeep, brandNavy, brandNavyBright],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.vertical(
                      bottom: Radius.circular(26),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          IconButton(
                            onPressed: () => Navigator.of(context).pop(),
                            visualDensity: VisualDensity.compact,
                            icon: const Icon(
                              Icons.arrow_back,
                              color: Colors.white,
                              size: 22,
                            ),
                          ),
                          const SizedBox(width: 2),
                          const Expanded(
                            child: Text(
                              'Notifications',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 20,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 9,
                              vertical: 5,
                            ),
                            decoration: BoxDecoration(
                              color: brandGold,
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: const Text(
                              '3 new',
                              style: TextStyle(
                                color: brandNavy,
                                fontSize: 10.5,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      _BncNotificationSummary(unreadCount: unreadCount),
                      const SizedBox(height: 12),
                      const Text(
                        'Shop updates, local deals and BNC rewards in one place.',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          height: 1.3,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(14, 14, 14, 94),
                sliver: SliverList(
                  delegate: SliverChildListDelegate(
                    [
                      _BncNotificationFilters(
                        selected: _selectedFilter,
                        onSelected: (filter) {
                          setState(() {
                            _selectedFilter = filter;
                          });
                        },
                      ),
                      const SizedBox(height: 12),
                      if (items.isEmpty)
                        const _BncEmptyPanel(
                          icon: Icons.notifications_off_outlined,
                          title: 'No alerts here',
                          text: 'New matching updates will appear here.',
                        )
                      else
                        ...items.map(
                          (item) => Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: _BncNotificationItem(item: item),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BncNotificationSpec {
  const _BncNotificationSpec({
    required this.icon,
    required this.title,
    required this.message,
    required this.time,
    required this.type,
    required this.accent,
    required this.actionLabel,
    required this.route,
    this.asset = '',
    this.unread = false,
  });

  final IconData icon;
  final String title;
  final String message;
  final String time;
  final String type;
  final Color accent;
  final String actionLabel;
  final String route;
  final String asset;
  final bool unread;
}

const _bncNotifications = [
  _BncNotificationSpec(
    icon: Icons.local_offer_outlined,
    title: 'New deal nearby',
    message: 'Sweet Bakery added a 20% weekend offer.',
    time: 'Now',
    type: 'Deals',
    accent: Color(0xFF27A857),
    actionLabel: 'View deal',
    route: 'shop:Sweet Bakery',
    asset: '$_mockupPath/im-bakery.jpg',
    unread: true,
  ),
  _BncNotificationSpec(
    icon: Icons.storefront_outlined,
    title: 'Featured shop',
    message: 'Spice Garden is trending in Restaurants.',
    time: '15 min',
    type: 'Shops',
    accent: brandNavy,
    actionLabel: 'Visit shop',
    route: 'shop:Spice Garden',
    asset: '$_mockupPath/im-restaurant.jpg',
    unread: true,
  ),
  _BncNotificationSpec(
    icon: Icons.card_giftcard_outlined,
    title: 'Weekly draw',
    message: 'Check the BNC weekly rewards and gifts.',
    time: 'Today',
    type: 'Rewards',
    accent: brandGoldDeep,
    actionLabel: 'View rewards',
    route: 'rewards',
    asset: '$_mockupPath/im-gifts.jpg',
    unread: true,
  ),
  _BncNotificationSpec(
    icon: Icons.calendar_today_outlined,
    title: 'Booking reminder',
    message: 'You can book home services and appointments from BNC.',
    time: 'Today',
    type: 'Bookings',
    accent: Color(0xFF5F54D8),
    actionLabel: 'Book now',
    route: 'bookings',
    asset: '$_mockupPath/im-electrical.jpg',
  ),
  _BncNotificationSpec(
    icon: Icons.person_outline,
    title: 'Complete profile',
    message: 'Save shops, manage location and personalize your alerts.',
    time: 'Yesterday',
    type: 'Account',
    accent: Color(0xFF1C7C70),
    actionLabel: 'Profile',
    route: 'profile',
    asset: '$_mockupPath/im-card_banner.jpg',
  ),
];

class _BncNotificationSummary extends StatelessWidget {
  const _BncNotificationSummary({required this.unreadCount});

  final int unreadCount;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _BncNotificationSummaryPill(
          icon: Icons.mark_email_unread_outlined,
          value: '$unreadCount',
          label: 'new alerts',
        ),
        const SizedBox(width: 8),
        const _BncNotificationSummaryPill(
          icon: Icons.local_offer_outlined,
          value: '2',
          label: 'deals',
        ),
        const SizedBox(width: 8),
        const _BncNotificationSummaryPill(
          icon: Icons.card_giftcard_outlined,
          value: '1',
          label: 'reward',
        ),
      ],
    );
  }
}

class _BncNotificationSummaryPill extends StatelessWidget {
  const _BncNotificationSummaryPill({
    required this.icon,
    required this.value,
    required this.label,
  });

  final IconData icon;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withValues(alpha: 0.16)),
        ),
        child: Row(
          children: [
            Icon(icon, color: brandGold, size: 16),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                '$value $label',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10.5,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BncNotificationFilters extends StatelessWidget {
  const _BncNotificationFilters({
    required this.selected,
    required this.onSelected,
  });

  final String selected;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    const filters = ['All', 'Deals', 'Shops', 'Rewards', 'Bookings', 'Account'];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: List.generate(filters.length, (index) {
          final filter = filters[index];
          final active = selected == filter;

          return Padding(
            padding: EdgeInsets.only(right: index == filters.length - 1 ? 0 : 8),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () => onSelected(filter),
                borderRadius: BorderRadius.circular(999),
                child: Ink(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 13, vertical: 8),
                  decoration: BoxDecoration(
                    color: active ? brandNavy : Colors.white,
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: active ? brandNavy : brandLine),
                  ),
                  child: Text(
                    filter,
                    style: TextStyle(
                      color: active ? Colors.white : const Color(0xFF405474),
                      fontSize: 11.5,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}

class _BncNotificationItem extends StatelessWidget {
  const _BncNotificationItem({required this.item});

  final _BncNotificationSpec item;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _openNotificationRoute(context, item.route),
        borderRadius: BorderRadius.circular(18),
        child: Ink(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: item.unread
                ? item.accent.withValues(alpha: 0.08)
                : Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: item.unread
                  ? item.accent.withValues(alpha: 0.25)
                  : brandLine,
            ),
            boxShadow: [
              BoxShadow(
                color: item.accent.withValues(alpha: 0.08),
                blurRadius: 14,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 58,
                height: 58,
                decoration: BoxDecoration(
                  color: item.accent.withValues(alpha: 0.13),
                  borderRadius: BorderRadius.circular(14),
                ),
                clipBehavior: Clip.antiAlias,
                child: item.asset.isEmpty
                    ? Icon(item.icon, color: item.accent, size: 21)
                    : Stack(
                        fit: StackFit.expand,
                        children: [
                          _AssetImageFill(asset: item.asset),
                          DecoratedBox(
                            decoration: BoxDecoration(
                              color: item.accent.withValues(alpha: 0.18),
                            ),
                          ),
                          Icon(item.icon, color: Colors.white, size: 21),
                        ],
                      ),
              ),
              const SizedBox(width: 11),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            item.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: brandNavy,
                              fontSize: 13.8,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                        if (item.unread)
                          Container(
                            width: 7,
                            height: 7,
                            decoration: BoxDecoration(
                              color: item.accent,
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      item.message,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: brandMuted,
                        fontSize: 11.5,
                        height: 1.25,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 9),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: item.accent.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            item.type,
                            style: TextStyle(
                              color: item.accent,
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          item.time,
                          style: const TextStyle(
                            color: brandMuted,
                            fontSize: 10.5,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const Spacer(),
                        Text(
                          item.actionLabel,
                          style: TextStyle(
                            color: item.accent,
                            fontSize: 10.5,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        Icon(
                          Icons.chevron_right_rounded,
                          color: item.accent,
                          size: 16,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

void _openNotificationRoute(BuildContext context, String route) {
  if (route.startsWith('shop:')) {
    final shopName = route.substring(5);
    final shop = _allBncShops.firstWhere(
      (item) => item.name == shopName,
      orElse: () => _allBncShops.first,
    );
    _openBusinessDetail(context, shop);
    return;
  }

  Widget page;

  switch (route) {
    case 'deals':
    case 'rewards':
      page = const BncDealsPage();
      break;
    case 'shops':
      page = const BncAllShopsPage();
      break;
    case 'bookings':
      page = const BncBookingsPage();
      break;
    case 'profile':
      page = const BncProfilePage();
      break;
    default:
      page = const BncSearchPage(initialQuery: '');
  }

  Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => page));
}

class BncDealsPage extends StatefulWidget {
  const BncDealsPage({super.key, this.initialCode = ''});

  final String initialCode;

  @override
  State<BncDealsPage> createState() => _BncDealsPageState();
}

class _BncDealsPageState extends State<BncDealsPage> {
  late final DealsService _dealsService;
  List<_BncDealUiItem> _deals = _fallbackDealUiItems;
  bool _isLoadingDeals = true;
  bool _usingDealFallback = false;
  String? _dealError;

  @override
  void initState() {
    super.initState();
    _dealsService = DealsService();
    _refreshDeals();
  }

  Future<void> _refreshDeals() async {
    setState(() {
      _isLoadingDeals = true;
      _dealError = null;
    });

    try {
      final deals = await _dealsService.fetchDeals();
      if (!mounted) {
        return;
      }
      setState(() {
        _deals = deals.map(_dealUiFromApi).toList();
        _isLoadingDeals = false;
        _usingDealFallback = false;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _deals = _fallbackDealUiItems;
        _isLoadingDeals = false;
        _usingDealFallback = true;
        _dealError = error is CatalogException
            ? error.message
            : 'Deals API is unavailable.';
      });
    }
  }

  @override
  void dispose() {
    _dealsService.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final selectedCode = widget.initialCode.toUpperCase();
    final mainOffers = _deals.where((deal) => deal.section != 'combo').toList();
    final comboOffers = _deals.where((deal) => deal.section == 'combo').toList();
    final highlight = _deals.firstWhere(
      (deal) => deal.isFeatured,
      orElse: () => _deals.first,
    );

    return _BncPhoneSizedRoute(
      child: Scaffold(
        backgroundColor: brandSurface,
        body: SafeArea(
          child: CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              const SliverToBoxAdapter(
                child: _BncMobileFeatureHeader(
                  title: 'Deals',
                  subtitle: 'Fresh offers from shops near you.',
                  icon: Icons.local_offer_outlined,
                  badge: '8 live',
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(14, 14, 14, 94),
                sliver: SliverList(
                  delegate: SliverChildListDelegate(
                    [
                      _BncDealHighlightCard(
                        deal: highlight,
                        isSelected: selectedCode == highlight.code,
                      ),
                      if (_isLoadingDeals) ...[
                        const SizedBox(height: 10),
                        const _BncDoctorStatusCard(
                          icon: Icons.sync_rounded,
                          text: 'Loading live deals from backend...',
                        ),
                      ] else if (_usingDealFallback && _dealError != null) ...[
                        const SizedBox(height: 10),
                        _BncDoctorStatusCard(
                          icon: Icons.cloud_off_outlined,
                          text: 'Live deals unavailable. Showing saved sample deals.',
                          actionLabel: 'Retry',
                          onAction: _refreshDeals,
                        ),
                      ],
                      const SizedBox(height: 12),
                      const _BncDealsQuickActions(),
                      const SizedBox(height: 16),
                      const _BncProfileSectionTitle(title: 'Main offers'),
                      const SizedBox(height: 8),
                      ...mainOffers.map(
                        (deal) => _BncOfferListCard(
                          icon: deal.icon,
                          title: deal.title,
                          shop: deal.shopName,
                          code: deal.code,
                          detail: deal.description,
                          asset: deal.asset,
                          color: deal.color,
                          targetShop: deal.shop,
                          isSelected: selectedCode == deal.code,
                        ),
                      ),
                      const SizedBox(height: 14),
                      const _BncProfileSectionTitle(title: 'Combo packages'),
                      const SizedBox(height: 8),
                      ...comboOffers.map(
                        (deal) => _BncOfferListCard(
                          icon: deal.icon,
                          title: deal.title,
                          shop: deal.shopName,
                          code: deal.code,
                          detail: deal.description,
                          asset: deal.asset,
                          color: deal.color,
                          targetShop: deal.shop,
                          isSelected: selectedCode == deal.code,
                        ),
                      ),
                      const SizedBox(height: 14),
                      const _BncProfileSectionTitle(title: 'Shops to visit'),
                      const SizedBox(height: 8),
                      const _BncDealShopVisitRail(),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BncDealUiItem {
  const _BncDealUiItem({
    required this.title,
    required this.description,
    required this.code,
    required this.shopName,
    required this.asset,
    required this.color,
    required this.section,
    required this.isFeatured,
    required this.icon,
    this.shop,
  });

  final String title;
  final String description;
  final String code;
  final String shopName;
  final String asset;
  final Color color;
  final String section;
  final bool isFeatured;
  final IconData icon;
  final _BncShopSpec? shop;
}

const _fallbackDealUiItems = [
  _BncDealUiItem(
    title: '20% off cleaning',
    description: 'Valid today for home cleaning bookings.',
    code: 'CLEAN20',
    shopName: 'HomeFix Pro',
    asset: '$_mockupPath/im-electrical.jpg',
    color: Color(0xFF0E7A43),
    section: 'main',
    isFeatured: true,
    icon: Icons.cleaning_services_outlined,
    shop: _BncShopSpec(
      name: 'HomeFix Pro',
      category: 'Home Services',
      rating: '4.6',
      reviews: '53',
      distance: '4.0 km',
      asset: '$_mockupPath/im-electrical.jpg',
      badge: 'Offer',
      badgeColor: Color(0xFFF4A51C),
    ),
  ),
  _BncDealUiItem(
    title: 'Weekend bakery deal',
    description: 'Fresh bakery items with weekend discount.',
    code: 'BAKE20',
    shopName: 'Sweet Bakery',
    asset: '$_mockupPath/im-bakery.jpg',
    color: Color(0xFFD94842),
    section: 'main',
    isFeatured: false,
    icon: Icons.cake_outlined,
  ),
  _BncDealUiItem(
    title: 'Rs599 salon combo',
    description: 'Hair spa and haircut package.',
    code: 'SPA599',
    shopName: 'Maya Beauty Salon',
    asset: '$_mockupPath/im-beauty.jpg',
    color: brandNavy,
    section: 'combo',
    isFeatured: false,
    icon: Icons.spa_outlined,
    shop: _BncShopSpec(
      name: 'Maya Beauty Salon',
      category: 'Beauty Salon',
      rating: '4.7',
      reviews: '76',
      distance: '3.4 km',
      asset: '$_mockupPath/im-beauty.jpg',
      badge: 'Popular',
      badgeColor: Color(0xFFF4A51C),
    ),
  ),
  _BncDealUiItem(
    title: 'Family dinner combo',
    description: 'Save on dinner combos for four.',
    code: 'FAMILY15',
    shopName: 'Spice Garden',
    asset: '$_mockupPath/im-restaurant.jpg',
    color: Color(0xFF8D3F20),
    section: 'combo',
    isFeatured: false,
    icon: Icons.restaurant_outlined,
  ),
];

_BncDealUiItem _dealUiFromApi(DealItem deal) {
  final business = deal.business;
  final shopName = business?.name ?? 'BNC partner';
  final category = business?.categorySlug ?? '';
  final shop = business == null ? null : _shopSpecFromBusiness(business);
  return _BncDealUiItem(
    title: deal.title,
    description: deal.description,
    code: deal.code.toUpperCase(),
    shopName: shopName,
    asset: _assetFromApiImage(
      deal.imageUrl,
      shop?.asset ?? '$_mockupPath/im-gifts.jpg',
    ),
    color: _colorFromHex(deal.accentColor, brandNavy),
    section: deal.section,
    isFeatured: deal.isFeatured,
    icon: _dealIconForCategory(category),
    shop: shop,
  );
}

IconData _dealIconForCategory(String categorySlug) {
  switch (categorySlug) {
    case 'beauty':
      return Icons.spa_outlined;
    case 'restaurant':
      return Icons.restaurant_outlined;
    case 'grocery':
      return Icons.shopping_cart_outlined;
    case 'pharmacy':
    case 'clinic':
      return Icons.local_hospital_outlined;
    case 'home-services':
      return Icons.cleaning_services_outlined;
    default:
      return Icons.local_offer_outlined;
  }
}

class BncDoctorBookingPage extends StatefulWidget {
  const BncDoctorBookingPage({super.key});

  @override
  State<BncDoctorBookingPage> createState() => _BncDoctorBookingPageState();
}

class _BncDoctorBookingPageState extends State<BncDoctorBookingPage> {
  final TextEditingController _searchController = TextEditingController();
  late final ClinicService _clinicService;
  List<_BncClinicSummary> _clinics = _doctorClinicSummaries();
  bool _isLoadingClinics = true;
  bool _usingClinicFallback = false;
  String? _clinicError;

  @override
  void initState() {
    super.initState();
    _clinicService = ClinicService();
    _refreshClinics();
  }

  Future<void> _refreshClinics() async {
    setState(() {
      _isLoadingClinics = true;
      _clinicError = null;
    });

    try {
      final clinics = await _clinicService.fetchClinics();
      if (!mounted) {
        return;
      }

      setState(() {
        _clinics = clinics.map(_clinicSummaryFromApi).toList();
        _isLoadingClinics = false;
        _usingClinicFallback = false;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _clinics = _doctorClinicSummaries();
        _isLoadingClinics = false;
        _usingClinicFallback = true;
        _clinicError = error is CatalogException
            ? error.message
            : 'Clinic API is unavailable.';
      });
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    _clinicService.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final query = _searchController.text.trim().toLowerCase();
    final clinics = _clinics.where((clinic) {
      if (query.isEmpty) {
        return true;
      }
      return clinic.name.toLowerCase().contains(query) ||
          clinic.address.toLowerCase().contains(query) ||
          clinic.doctors.any((doctor) {
            return doctor.name.toLowerCase().contains(query) ||
                doctor.speciality.toLowerCase().contains(query) ||
                doctor.services.any((service) => service.toLowerCase().contains(query));
          });
    }).toList();

    return _BncPhoneSizedRoute(
      child: Scaffold(
        backgroundColor: brandSurface,
        body: SafeArea(
          child: CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              const SliverToBoxAdapter(
                child: _BncMobileFeatureHeader(
                  title: 'Doctor Booking',
                  subtitle: 'Search hospitals and choose the right doctor.',
                  icon: Icons.medical_services_outlined,
                  badge: 'Health',
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(14, 14, 14, 94),
                sliver: SliverList(
                  delegate: SliverChildListDelegate(
                    [
                      _BncDoctorSearchBox(
                        controller: _searchController,
                        onChanged: (_) => setState(() {}),
                      ),
                      if (_isLoadingClinics) ...[
                        const SizedBox(height: 10),
                        const _BncDoctorStatusCard(
                          icon: Icons.sync_rounded,
                          text: 'Loading nearby clinics from live backend...',
                        ),
                      ] else if (_usingClinicFallback && _clinicError != null) ...[
                        const SizedBox(height: 10),
                        _BncDoctorStatusCard(
                          icon: Icons.cloud_off_outlined,
                          text: 'Live clinics unavailable. Showing saved sample clinics.',
                          actionLabel: 'Retry',
                          onAction: _refreshClinics,
                        ),
                      ],
                      const SizedBox(height: 14),
                      const _BncDoctorHeroCard(),
                      const SizedBox(height: 14),
                      const _BncProfileSectionTitle(
                        title: 'Nearby hospitals and clinics',
                      ),
                      const SizedBox(height: 8),
                      if (clinics.isEmpty)
                        const _BncDoctorEmptyState()
                      else
                        ...clinics.map((clinic) {
                          return _BncNearbyClinicCard(clinic: clinic);
                        }),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BncClinicSummary {
  const _BncClinicSummary({
    this.id = '',
    this.slug = '',
    required this.name,
    required this.address,
    required this.distance,
    required this.nextSlot,
    required this.phone,
    required this.whatsapp,
    required this.asset,
    required this.doctors,
  });

  final String id;
  final String slug;
  final String name;
  final String address;
  final String distance;
  final String nextSlot;
  final String phone;
  final String whatsapp;
  final String asset;
  final List<_BncDoctorSpec> doctors;
}

class _BncDoctorSpec {
  const _BncDoctorSpec({
    this.id = '',
    this.clinicId = '',
    this.slug = '',
    required this.name,
    required this.speciality,
    required this.clinic,
    required this.experience,
    required this.rating,
    required this.distance,
    required this.nextSlot,
    required this.fee,
    required this.phone,
    required this.whatsapp,
    required this.address,
    required this.asset,
    required this.services,
  });

  final String id;
  final String clinicId;
  final String slug;
  final String name;
  final String speciality;
  final String clinic;
  final String experience;
  final String rating;
  final String distance;
  final String nextSlot;
  final String fee;
  final String phone;
  final String whatsapp;
  final String address;
  final String asset;
  final List<String> services;
}

const _bncDoctors = [
  _BncDoctorSpec(
    name: 'Dr. Anjali Menon',
    speciality: 'General Physician',
    clinic: 'CarePlus Family Clinic',
    experience: '12 yrs exp',
    rating: '4.8',
    distance: '1.1 km',
    nextSlot: 'Today 6:30 PM',
    fee: 'Rs300',
    phone: '+91 98765 21010',
    whatsapp: '+91 98765 21010',
    address: 'CarePlus Family Clinic, Mavoor Road, Kozhikode',
    asset: '$_mockupPath/im-occ_reception.jpg',
    services: ['Fever', 'Diabetes', 'BP check'],
  ),
  _BncDoctorSpec(
    name: 'Dr. Kiran Joseph',
    speciality: 'Pediatrician',
    clinic: 'CarePlus Family Clinic',
    experience: '10 yrs exp',
    rating: '4.6',
    distance: '1.1 km',
    nextSlot: 'Today 8:00 PM',
    fee: 'Rs400',
    phone: '+91 98765 21010',
    whatsapp: '+91 98765 21010',
    address: 'CarePlus Family Clinic, Mavoor Road, Kozhikode',
    asset: '$_mockupPath/im-occ_helper.jpg',
    services: ['Child fever', 'Vaccination', 'Cold'],
  ),
  _BncDoctorSpec(
    name: 'Dr. Sameer Rahman',
    speciality: 'Dentist',
    clinic: 'Smile Care Dental Studio',
    experience: '9 yrs exp',
    rating: '4.7',
    distance: '1.8 km',
    nextSlot: 'Tomorrow 10:00 AM',
    fee: 'Rs500',
    phone: '+91 98470 44122',
    whatsapp: '+91 98470 44122',
    address: 'Smile Care Dental Studio, Stadium Junction, Kozhikode',
    asset: '$_mockupPath/im-optical.jpg',
    services: ['Tooth pain', 'Cleaning', 'Root canal'],
  ),
  _BncDoctorSpec(
    name: 'Dr. Nisha Varghese',
    speciality: 'Orthodontist',
    clinic: 'Smile Care Dental Studio',
    experience: '7 yrs exp',
    rating: '4.5',
    distance: '1.8 km',
    nextSlot: 'Tomorrow 12:30 PM',
    fee: 'Rs600',
    phone: '+91 98470 44122',
    whatsapp: '+91 98470 44122',
    address: 'Smile Care Dental Studio, Stadium Junction, Kozhikode',
    asset: '$_mockupPath/im-occ_beauty.jpg',
    services: ['Braces', 'Aligners', 'Smile design'],
  ),
  _BncDoctorSpec(
    name: 'Dr. Meera Nair',
    speciality: 'Dermatologist',
    clinic: 'Glow Skin Clinic',
    experience: '8 yrs exp',
    rating: '4.9',
    distance: '2.4 km',
    nextSlot: 'Today 7:15 PM',
    fee: 'Rs650',
    phone: '+91 97455 88221',
    whatsapp: '+91 97455 88221',
    address: 'Glow Skin Clinic, PT Usha Road, Kozhikode',
    asset: '$_mockupPath/im-beauty.jpg',
    services: ['Skin allergy', 'Acne', 'Hair care'],
  ),
  _BncDoctorSpec(
    name: 'Dr. Faisal Ahmed',
    speciality: 'Cardiologist',
    clinic: 'City Care Hospital',
    experience: '15 yrs exp',
    rating: '4.8',
    distance: '2.0 km',
    nextSlot: 'Today 5:45 PM',
    fee: 'Rs800',
    phone: '+91 98460 11880',
    whatsapp: '+91 98460 11880',
    address: 'City Care Hospital, Bank Road, Kozhikode',
    asset: '$_mockupPath/im-occ_computer.jpg',
    services: ['Chest pain', 'ECG', 'Heart check'],
  ),
  _BncDoctorSpec(
    name: 'Dr. Riya Thomas',
    speciality: 'Gynecologist',
    clinic: 'Metro Medical Centre',
    experience: '11 yrs exp',
    rating: '4.7',
    distance: '2.7 km',
    nextSlot: 'Tomorrow 9:30 AM',
    fee: 'Rs700',
    phone: '+91 98461 55220',
    whatsapp: '+91 98461 55220',
    address: 'Metro Medical Centre, Eranhipalam, Kozhikode',
    asset: '$_mockupPath/im-occ_reception.jpg',
    services: ['Pregnancy care', 'Women health', 'Scan review'],
  ),
  _BncDoctorSpec(
    name: 'Dr. Arjun Pillai',
    speciality: 'Orthopedic',
    clinic: 'Aster Ortho Clinic',
    experience: '13 yrs exp',
    rating: '4.6',
    distance: '3.1 km',
    nextSlot: 'Today 8:30 PM',
    fee: 'Rs650',
    phone: '+91 98462 77110',
    whatsapp: '+91 98462 77110',
    address: 'Aster Ortho Clinic, Nadakkavu, Kozhikode',
    asset: '$_mockupPath/im-occ_helper.jpg',
    services: ['Joint pain', 'Back pain', 'Sports injury'],
  ),
];

List<_BncClinicSummary> _doctorClinicSummaries() {
  final grouped = <String, List<_BncDoctorSpec>>{};
  for (final doctor in _bncDoctors) {
    grouped.putIfAbsent(doctor.clinic, () => []).add(doctor);
  }

  return grouped.entries.map((entry) {
    final doctors = entry.value;
    final first = doctors.first;
    return _BncClinicSummary(
      name: entry.key,
      address: first.address,
      distance: first.distance,
      nextSlot: doctors.map((doctor) => doctor.nextSlot).join(' / '),
      phone: first.phone,
      whatsapp: first.whatsapp,
      asset: _clinicAssetFor(entry.key),
      doctors: doctors,
    );
  }).toList();
}

String _clinicAssetFor(String clinic) {
  switch (clinic) {
    case 'CarePlus Family Clinic':
      return '$_mockupPath/im-pharmacy.jpg';
    case 'Smile Care Dental Studio':
      return '$_mockupPath/im-optical.jpg';
    case 'Glow Skin Clinic':
      return '$_mockupPath/im-beauty.jpg';
    case 'City Care Hospital':
      return '$_mockupPath/im-pharmacy.jpg';
    case 'Metro Medical Centre':
      return '$_mockupPath/im-supermarket.jpg';
    case 'Aster Ortho Clinic':
      return '$_mockupPath/im-electrical.jpg';
    default:
      return '$_mockupPath/im-pharmacy.jpg';
  }
}

_BncClinicSummary _clinicSummaryFromApi(ClinicItem clinic) {
  final address = clinic.address.label.isNotEmpty
      ? clinic.address.label
      : '${clinic.name}, Kozhikode';
  final phone = clinic.phone.isNotEmpty ? clinic.phone : '+91 98765 21010';
  final whatsapp = clinic.whatsapp.isNotEmpty ? clinic.whatsapp : phone;

  return _BncClinicSummary(
    id: clinic.id,
    slug: clinic.slug,
    name: clinic.name,
    address: address,
    distance: _formatDistance(clinic.distanceKm),
    nextSlot: clinic.doctors.map((doctor) => doctor.nextSlot).join(' / '),
    phone: phone,
    whatsapp: whatsapp,
    asset: _assetFromApiImage(clinic.imageUrl, _clinicAssetFor(clinic.name)),
    doctors: clinic.doctors.map((doctor) {
      return _BncDoctorSpec(
        id: doctor.id,
        clinicId: clinic.id,
        slug: doctor.slug,
        name: doctor.name,
        speciality: doctor.speciality,
        clinic: clinic.name,
        experience: doctor.experience,
        rating: doctor.ratingAverage.toStringAsFixed(1),
        distance: _formatDistance(clinic.distanceKm),
        nextSlot: doctor.nextSlot,
        fee: doctor.fee,
        phone: phone,
        whatsapp: whatsapp,
        address: address,
        asset: _assetFromApiImage(doctor.imageUrl, _clinicAssetFor(clinic.name)),
        services: doctor.services,
      );
    }).toList(),
  );
}

String _formatDistance(double distanceKm) {
  if (distanceKm <= 0) {
    return 'Nearby';
  }
  return '${distanceKm.toStringAsFixed(1)} km';
}

String _assetFromApiImage(String imageUrl, String fallback) {
  final trimmed = imageUrl.trim();
  if (trimmed.isEmpty) {
    return fallback;
  }
  if (trimmed.startsWith('/mockup/')) {
    return '$_mockupPath/${trimmed.split('/').last}';
  }
  if (trimmed.startsWith('mockup/')) {
    return '$_mockupPath/${trimmed.split('/').last}';
  }
  if (trimmed.startsWith(_mockupPath)) {
    return trimmed;
  }
  return fallback;
}

class _BncDoctorHeroCard extends StatelessWidget {
  const _BncDoctorHeroCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF031641), brandNavy, brandNavyBright],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(26),
        boxShadow: const [
          BoxShadow(
            color: Color(0x2608204A),
            blurRadius: 22,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 54,
                height: 54,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
                ),
                child: const Icon(
                  Icons.local_hospital_outlined,
                  color: brandGold,
                  size: 30,
                ),
              ),
              const SizedBox(width: 11),
              const Expanded(
                child: Text(
                  'Find care near you',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 21,
                    height: 1.05,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
                decoration: BoxDecoration(
                  color: brandGold,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: const Text(
                  'Fast',
                  style: TextStyle(
                    color: brandNavy,
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 11),
          const Text(
            'Search hospitals first, open the right place, then choose a doctor and request a visit.',
            style: TextStyle(
              color: brandHeroText,
              fontSize: 12.5,
              height: 1.35,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 13),
          const Row(
            children: [
              Expanded(
                child: _DoctorHeroChip(
                  icon: Icons.location_on_outlined,
                  label: 'Hospitals near',
                ),
              ),
              SizedBox(width: 8),
              Expanded(
                child: _DoctorHeroChip(
                  icon: Icons.verified_user_outlined,
                  label: 'Doctor details',
                ),
              ),
              SizedBox(width: 8),
              Expanded(
                child: _DoctorHeroChip(
                  icon: Icons.chat_outlined,
                  label: 'Request slot',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _DoctorHeroChip extends StatelessWidget {
  const _DoctorHeroChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
      ),
      child: Column(
        children: [
          Icon(icon, color: brandGold, size: 17),
          const SizedBox(height: 4),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 9.5,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }
}

class _BncDoctorSearchBox extends StatelessWidget {
  const _BncDoctorSearchBox({
    required this.controller,
    required this.onChanged,
  });

  final TextEditingController controller;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      onChanged: onChanged,
      textInputAction: TextInputAction.search,
      decoration: InputDecoration(
        hintText: 'Search hospital, clinic, doctor',
        prefixIcon: const Icon(Icons.search_rounded, color: brandMuted),
        suffixIcon: controller.text.isEmpty
            ? null
            : IconButton(
                onPressed: () {
                  controller.clear();
                  onChanged('');
                },
                icon: const Icon(Icons.close_rounded, color: brandMuted),
              ),
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: const BorderSide(color: brandLine),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(18),
          borderSide: const BorderSide(color: brandNavyBright, width: 1.4),
        ),
      ),
      style: const TextStyle(
        color: brandNavy,
        fontWeight: FontWeight.w800,
      ),
    );
  }
}

class _BncDoctorStatusCard extends StatelessWidget {
  const _BncDoctorStatusCard({
    required this.icon,
    required this.text,
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String text;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
      decoration: BoxDecoration(
        color: const Color(0xFFEAF1FF),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: brandLine),
      ),
      child: Row(
        children: [
          Icon(icon, color: brandNavy, size: 20),
          const SizedBox(width: 9),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                color: brandNavy,
                fontSize: 11.5,
                height: 1.25,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(width: 8),
            TextButton(
              onPressed: onAction,
              style: TextButton.styleFrom(
                foregroundColor: brandNavy,
                visualDensity: VisualDensity.compact,
              ),
              child: Text(
                actionLabel!,
                style: const TextStyle(fontWeight: FontWeight.w900),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _BncDoctorEmptyState extends StatelessWidget {
  const _BncDoctorEmptyState();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: brandLine),
      ),
      child: const Row(
        children: [
          Icon(Icons.search_off_rounded, color: brandMuted, size: 24),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'No hospital found. Try hospital name, doctor, speciality or service.',
              style: TextStyle(
                color: brandMuted,
                fontSize: 12,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _BncNearbyClinicCard extends StatelessWidget {
  const _BncNearbyClinicCard({required this.clinic});

  final _BncClinicSummary clinic;

  @override
  Widget build(BuildContext context) {
    final specialities = clinic.doctors.map((doctor) => doctor.speciality).toSet().join(', ');

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => _BncClinicDoctorsPage(clinic: clinic),
              ),
            );
          },
          borderRadius: BorderRadius.circular(22),
          child: Ink(
            padding: const EdgeInsets.all(13),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: brandLine),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x0D08204A),
                  blurRadius: 14,
                  offset: Offset(0, 7),
                ),
              ],
            ),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(18),
                  child: SizedBox(
                    width: 72,
                    height: 72,
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        _AssetImageFill(asset: clinic.asset),
                        Positioned.fill(
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  Colors.transparent,
                                  brandNavy.withValues(alpha: 0.55),
                                ],
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          left: 7,
                          bottom: 7,
                          child: Container(
                            width: 26,
                            height: 26,
                            decoration: BoxDecoration(
                              color: brandNavy,
                              borderRadius: BorderRadius.circular(9),
                              border: Border.all(
                                color: Colors.white.withValues(alpha: 0.65),
                              ),
                            ),
                            child: const Icon(
                              Icons.local_hospital_outlined,
                              color: Colors.white,
                              size: 17,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 11),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        clinic.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: brandNavy,
                          fontSize: 15.5,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        specialities,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: brandMuted,
                          fontSize: 11.5,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          _DoctorInfoPill(Icons.person_outline, '${clinic.doctors.length} doctors'),
                          const SizedBox(width: 6),
                          _DoctorInfoPill(Icons.location_on_outlined, clinic.distance),
                        ],
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.chevron_right_rounded,
                  color: brandNavy,
                  size: 26,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _BncClinicDoctorsPage extends StatelessWidget {
  const _BncClinicDoctorsPage({required this.clinic});

  final _BncClinicSummary clinic;

  @override
  Widget build(BuildContext context) {
    return _BncPhoneSizedRoute(
      child: Scaffold(
        backgroundColor: brandSurface,
        body: SafeArea(
          child: CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: _BncMobileFeatureHeader(
                  title: clinic.name,
                  subtitle: clinic.address,
                  icon: Icons.local_hospital_outlined,
                  badge: '${clinic.doctors.length} docs',
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(14, 14, 14, 94),
                sliver: SliverList(
                  delegate: SliverChildListDelegate(
                    [
                      _BncClinicSummaryCard(clinic: clinic),
                      const SizedBox(height: 14),
                      const _BncProfileSectionTitle(title: 'Doctors working here'),
                      const SizedBox(height: 8),
                      ...clinic.doctors.map((doctor) {
                        return _BncDoctorClinicCard(doctor: doctor);
                      }),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BncClinicSummaryCard extends StatelessWidget {
  const _BncClinicSummaryCard({required this.clinic});

  final _BncClinicSummary clinic;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [brandNavyDeep, brandNavy, brandNavyBright],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(22),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(17),
            child: SizedBox(
              height: 126,
              width: double.infinity,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  _AssetImageFill(asset: clinic.asset),
                  DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.transparent,
                          brandNavyDeep.withValues(alpha: 0.62),
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                  Positioned(
                    left: 12,
                    bottom: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: brandGold,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        '${clinic.doctors.length} doctors available',
                        style: const TextStyle(
                          color: brandNavy,
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            clinic.name,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            clinic.address,
            style: const TextStyle(
              color: brandHeroText,
              fontSize: 12,
              height: 1.3,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _ClinicMiniMetric(Icons.location_on_outlined, clinic.distance),
              const SizedBox(width: 8),
              _ClinicMiniMetric(Icons.schedule_outlined, 'Slots available'),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _DoctorActionButton(
                  icon: Icons.chat_outlined,
                  label: 'Contact',
                  color: const Color(0xFF118B50),
                  onTap: () => _copyClinicContact(context, clinic),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _DoctorActionButton(
                  icon: Icons.call_outlined,
                  label: 'Call',
                  color: brandNavy,
                  onTap: () => _copyClinicPhone(context, clinic),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _DoctorActionButton(
                  icon: Icons.location_on_outlined,
                  label: 'Location',
                  color: brandNavyBright,
                  onTap: () => _showClinicLocation(context, clinic),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ClinicMiniMetric extends StatelessWidget {
  const _ClinicMiniMetric(this.icon, this.label);

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 9),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          children: [
            Icon(icon, color: brandGold, size: 16),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BncDoctorClinicCard extends StatelessWidget {
  const _BncDoctorClinicCard({required this.doctor});

  final _BncDoctorSpec doctor;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: brandLine),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0D08204A),
            blurRadius: 14,
            offset: Offset(0, 7),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(18),
                child: SizedBox(
                  width: 66,
                  height: 66,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      _AssetImageFill(asset: doctor.asset),
                      Positioned.fill(
                        child: DecoratedBox(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                Colors.transparent,
                                brandNavy.withValues(alpha: 0.38),
                              ],
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                            ),
                          ),
                        ),
                      ),
                      Positioned(
                        right: 6,
                        bottom: 6,
                        child: Container(
                          width: 23,
                          height: 23,
                          decoration: BoxDecoration(
                            color: brandGold,
                            borderRadius: BorderRadius.circular(999),
                            border: Border.all(color: Colors.white, width: 1.5),
                          ),
                          child: const Icon(
                            Icons.verified_rounded,
                            color: brandNavy,
                            size: 14,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 11),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      doctor.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: brandNavy,
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      doctor.speciality,
                      style: const TextStyle(
                        color: brandMuted,
                        fontSize: 11.5,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 7),
                    Text(
                      doctor.clinic,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: brandNavy,
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                decoration: BoxDecoration(
                  color: brandGold,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  doctor.fee,
                  style: const TextStyle(
                    color: brandNavy,
                    fontSize: 10.5,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 7,
            runSpacing: 7,
            children: [
              _DoctorInfoPill(Icons.star_rounded, '${doctor.rating} rated'),
              _DoctorInfoPill(Icons.work_outline, doctor.experience),
              _DoctorInfoPill(Icons.location_on_outlined, doctor.distance),
              _DoctorInfoPill(Icons.schedule_outlined, doctor.nextSlot),
            ],
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 7,
            runSpacing: 7,
            children: doctor.services.map((service) {
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
                decoration: BoxDecoration(
                  color: brandSoft,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  service,
                  style: const TextStyle(
                    color: brandNavy,
                    fontSize: 10.5,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _DoctorActionButton(
                  icon: Icons.chat_outlined,
                  label: 'WhatsApp',
                  color: const Color(0xFF118B50),
                  onTap: () => _copyDoctorBookingRequest(context, doctor),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _DoctorActionButton(
                  icon: Icons.call_outlined,
                  label: 'Call',
                  color: brandNavy,
                  onTap: () => _copyDoctorPhone(context, doctor),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _DoctorActionButton(
                  icon: Icons.location_on_outlined,
                  label: 'Location',
                  color: brandNavyBright,
                  onTap: () => _showDoctorLocation(context, doctor),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _DoctorInfoPill extends StatelessWidget {
  const _DoctorInfoPill(this.icon, this.label);

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFF7FAFF),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: brandLine),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: brandGold, size: 14),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(
              color: brandMuted,
              fontSize: 10,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _DoctorActionButton extends StatelessWidget {
  const _DoctorActionButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(15),
        child: Ink(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(15),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: Colors.white, size: 16),
              const SizedBox(width: 5),
              Flexible(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

String _doctorBookingMessage(_BncDoctorSpec doctor) {
  return 'Hi ${doctor.name}, I found you on BNC. I want to request an appointment at ${doctor.clinic}. Preferred slot: ${doctor.nextSlot}.';
}

Future<void> _copyDoctorBookingRequest(
  BuildContext context,
  _BncDoctorSpec doctor,
) async {
  final message = _doctorBookingMessage(doctor);
  await Clipboard.setData(
    ClipboardData(text: '$message WhatsApp: ${doctor.whatsapp}'),
  );
  var savedRequest = false;
  if (doctor.clinicId.isNotEmpty && doctor.id.isNotEmpty) {
    final service = ClinicService();
    try {
      await service.createBookingRequest(
        clinicId: doctor.clinicId,
        doctorId: doctor.id,
        patientName: 'BNC app user',
        phone: doctor.whatsapp,
        preferredSlot: doctor.nextSlot,
        message: message,
      );
      savedRequest = true;
    } catch (_) {
      savedRequest = false;
    } finally {
      service.close();
    }
  }
  if (!context.mounted) {
    return;
  }
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(
        savedRequest
            ? 'Booking request saved and copied for ${doctor.whatsapp}.'
            : 'Booking request copied for ${doctor.whatsapp}.',
      ),
      behavior: SnackBarBehavior.floating,
    ),
  );
}

Future<void> _copyDoctorPhone(
  BuildContext context,
  _BncDoctorSpec doctor,
) async {
  await Clipboard.setData(ClipboardData(text: doctor.phone));
  if (!context.mounted) {
    return;
  }
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text('Call number copied: ${doctor.phone}'),
      behavior: SnackBarBehavior.floating,
    ),
  );
}

Future<void> _copyClinicContact(
  BuildContext context,
  _BncClinicSummary clinic,
) async {
  await Clipboard.setData(
    ClipboardData(
      text: 'Hi ${clinic.name}, I found your clinic on BNC. I want to check doctor availability. WhatsApp: ${clinic.whatsapp}',
    ),
  );
  if (!context.mounted) {
    return;
  }
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text('Clinic WhatsApp request copied for ${clinic.whatsapp}.'),
      behavior: SnackBarBehavior.floating,
    ),
  );
}

Future<void> _copyClinicPhone(
  BuildContext context,
  _BncClinicSummary clinic,
) async {
  await Clipboard.setData(ClipboardData(text: clinic.phone));
  if (!context.mounted) {
    return;
  }
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text('Clinic number copied: ${clinic.phone}'),
      behavior: SnackBarBehavior.floating,
    ),
  );
}

void _showClinicLocation(BuildContext context, _BncClinicSummary clinic) {
  showModalBottomSheet<void>(
    context: context,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (sheetContext) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(18, 18, 18, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              clinic.name,
              style: const TextStyle(
                color: brandNavy,
                fontSize: 18,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              clinic.address,
              style: const TextStyle(
                color: brandMuted,
                fontSize: 13,
                height: 1.35,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: brandNavy,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                onPressed: () async {
                  await Clipboard.setData(ClipboardData(text: clinic.address));
                  if (sheetContext.mounted) {
                    Navigator.of(sheetContext).pop();
                  }
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Clinic location copied.'),
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  }
                },
                icon: const Icon(Icons.copy_outlined, size: 18),
                label: const Text(
                  'Copy location',
                  style: TextStyle(fontWeight: FontWeight.w900),
                ),
              ),
            ),
          ],
        ),
      );
    },
  );
}

void _showDoctorLocation(BuildContext context, _BncDoctorSpec doctor) {
  showModalBottomSheet<void>(
    context: context,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (sheetContext) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(18, 18, 18, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              doctor.clinic,
              style: const TextStyle(
                color: brandNavy,
                fontSize: 18,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              doctor.address,
              style: const TextStyle(
                color: brandMuted,
                fontSize: 13,
                height: 1.35,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: brandNavy,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                onPressed: () async {
                  await Clipboard.setData(ClipboardData(text: doctor.address));
                  if (sheetContext.mounted) {
                    Navigator.of(sheetContext).pop();
                  }
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Clinic address copied.'),
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  }
                },
                icon: const Icon(Icons.copy_outlined, size: 18),
                label: const Text(
                  'Copy location',
                  style: TextStyle(fontWeight: FontWeight.w900),
                ),
              ),
            ),
          ],
        ),
      );
    },
  );
}

class BncBookingsPage extends StatelessWidget {
  const BncBookingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return _BncPhoneSizedRoute(
      child: Scaffold(
        backgroundColor: brandSurface,
        body: SafeArea(
          child: CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              const SliverToBoxAdapter(
                child: _BncMobileFeatureHeader(
                  title: 'Bookings',
                  subtitle: 'Manage appointments and service requests.',
                  icon: Icons.calendar_today_outlined,
                  badge: 'Today',
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(14, 14, 14, 94),
                sliver: SliverList(
                  delegate: SliverChildListDelegate(
                    [
                      const _BncBookingStatusCard(),
                      const SizedBox(height: 14),
                      const _BncProfileSectionTitle(title: 'Quick booking'),
                      const SizedBox(height: 8),
                      _BncBookingActionCard(
                        icon: Icons.home_repair_service_outlined,
                        title: 'Home services',
                        text: 'Book plumbing, cleaning or electrical help.',
                        asset: '$_mockupPath/im-electrical.jpg',
                        onTap: () => _openBookingAction(context, 'home'),
                      ),
                      _BncBookingActionCard(
                        icon: Icons.restaurant_outlined,
                        title: 'Restaurant table',
                        text: 'Reserve a spot at popular local restaurants.',
                        asset: '$_mockupPath/im-restaurant.jpg',
                        onTap: () => _openBookingAction(context, 'restaurant'),
                      ),
                      _BncBookingActionCard(
                        icon: Icons.content_cut_outlined,
                        title: 'Salon appointment',
                        text: 'Schedule beauty and grooming services.',
                        asset: '$_mockupPath/im-beauty.jpg',
                        onTap: () => _openBookingAction(context, 'salon'),
                      ),
                      _BncBookingActionCard(
                        icon: Icons.medical_services_outlined,
                        title: 'Doctor appointment',
                        text: 'Find nearby clinics, doctors and health services.',
                        asset: '$_mockupPath/im-electrical.jpg',
                        onTap: () => _openBookingAction(context, 'doctor'),
                      ),
                      const SizedBox(height: 14),
                      const _BncProfileSectionTitle(title: 'Recommended shops'),
                      const SizedBox(height: 8),
                      const _BncBookingShopVisitRail(),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BncEcosystemPage extends StatelessWidget {
  const _BncEcosystemPage({required this.item});

  final _BncEcosystemSpec item;

  @override
  Widget build(BuildContext context) {
    final features = _ecosystemFeaturesFor(item.title);
    final isBusinessCard = item.title == 'Business Card';

    return _BncPhoneSizedRoute(
      child: Scaffold(
        backgroundColor: brandSurface,
        body: SafeArea(
          child: CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: _BncMobileFeatureHeader(
                  title: item.title,
                  subtitle: item.text,
                  icon: item.icon,
                  badge: item.badge,
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(14, 14, 14, 94),
                sliver: SliverList(
                  delegate: SliverChildListDelegate(
                    [
                      if (isBusinessCard)
                        const _BncBusinessCardPreview()
                      else
                        _BncEcosystemHeroCard(item: item),
                      const SizedBox(height: 14),
                      _BncProfileSectionTitle(
                        title: isBusinessCard
                            ? 'Grow with your card'
                            : 'What you can do',
                      ),
                      const SizedBox(height: 8),
                      ...features.map(
                        (feature) => _BncMobileInfoCard(
                          icon: feature.icon,
                          title: feature.title,
                          text: feature.text,
                        ),
                      ),
                      const SizedBox(height: 12),
                      const _BncProfileSectionTitle(title: 'Quick access'),
                      const SizedBox(height: 8),
                      _BncEcosystemQuickAccessGrid(item: item),
                      const SizedBox(height: 14),
                      const _BncProfileSectionTitle(title: 'Smart suggestions'),
                      const SizedBox(height: 8),
                      _BncEcosystemSmartSuggestionCard(item: item),
                      const SizedBox(height: 12),
                      _BncEcosystemProgressStrip(item: item),
                      const SizedBox(height: 14),
                      _BncEcosystemPrimaryAction(item: item),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BncEcosystemHeroCard extends StatelessWidget {
  const _BncEcosystemHeroCard({required this.item});

  final _BncEcosystemSpec item;

  @override
  Widget build(BuildContext context) {
    final accent = _ecosystemAccentFor(item.title);
    final stats = _ecosystemStatsFor(item.title);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            brandNavyDeep,
            brandNavy,
            brandNavyBright,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: brandNavy.withValues(alpha: 0.30),
            blurRadius: 26,
            offset: const Offset(0, 14),
          ),
        ],
        border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      brandNavyBright,
                      brandNavy,
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.18),
                      blurRadius: 14,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Icon(item.icon, color: Colors.white, size: 27),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.text,
                      style: const TextStyle(
                        color: brandHeroText,
                        fontSize: 12.5,
                        height: 1.3,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
                decoration: BoxDecoration(
                  color: brandGold,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: const Text(
                  'Smart',
                  style: TextStyle(
                    color: brandNavy,
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _ecosystemUsageHintFor(item.title),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    height: 1.35,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: _ecosystemFlowFor(item.title).map((flow) {
                    return Expanded(
                      child: _BncEcosystemFlowChip(
                        icon: flow.$1,
                        label: flow.$2,
                        accent: accent,
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: stats.map((stat) {
              return Expanded(
                child: Container(
                  margin: const EdgeInsets.only(right: 8),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.10),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        stat.$1,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: brandGold,
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        stat.$2,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: brandHeroText,
                          fontSize: 10.5,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

class _BncEcosystemFlowChip extends StatelessWidget {
  const _BncEcosystemFlowChip({
    required this.icon,
    required this.label,
    required this.accent,
  });

  final IconData icon;
  final String label;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(13),
        border: Border.all(color: Colors.white.withValues(alpha: 0.13)),
      ),
      child: Column(
        children: [
          Icon(icon, color: brandGold, size: 18),
          const SizedBox(height: 4),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 9.5,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }
}

class _BncBusinessCardPreview extends StatelessWidget {
  const _BncBusinessCardPreview();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF08245F), brandNavy, brandNavyBright],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: const [
          BoxShadow(
            color: Color(0x2608204A),
            blurRadius: 20,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
                ),
                child: const Icon(
                  Icons.badge_outlined,
                  color: Color(0xFFC9D8FF),
                  size: 27,
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'BNC Business Card',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'One smart profile for calls, location, catalog and offers.',
                      style: TextStyle(
                        color: brandHeroText,
                        fontSize: 11.5,
                        height: 1.3,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    Container(
                      width: 74,
                      height: 74,
                      decoration: BoxDecoration(
                        color: const Color(0xFFEAF1FF),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Icon(
                        Icons.qr_code_2_rounded,
                        color: brandNavy,
                        size: 48,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Spice Garden',
                            style: TextStyle(
                              color: brandNavy,
                              fontSize: 17,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Restaurant - Kozhikode',
                            style: TextStyle(
                              color: brandMuted,
                              fontSize: 11.5,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          SizedBox(height: 8),
                          Row(
                            children: [
                              Icon(
                                Icons.star_rounded,
                                color: brandNavyBright,
                                size: 16,
                              ),
                              SizedBox(width: 4),
                              Text(
                                '4.6 rating - 1.2 km',
                                style: TextStyle(
                                  color: brandMuted,
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Row(
                  children: [
                    Expanded(
                      child: _BusinessCardMiniAction(
                        icon: Icons.call_outlined,
                        label: 'Call',
                      ),
                    ),
                    SizedBox(width: 8),
                    Expanded(
                      child: _BusinessCardMiniAction(
                        icon: Icons.location_on_outlined,
                        label: 'Route',
                      ),
                    ),
                    SizedBox(width: 8),
                    Expanded(
                      child: _BusinessCardMiniAction(
                        icon: Icons.share_outlined,
                        label: 'Share',
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: const [
              Expanded(
                child: _BusinessCardMetric(value: 'QR', label: 'scan & share'),
              ),
              SizedBox(width: 8),
              Expanded(
                child: _BusinessCardMetric(value: '1 tap', label: 'contact'),
              ),
              SizedBox(width: 8),
              Expanded(
                child: _BusinessCardMetric(value: 'Live', label: 'catalog'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _BusinessCardMiniAction extends StatelessWidget {
  const _BusinessCardMiniAction({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 9),
      decoration: BoxDecoration(
        color: brandSoft,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        children: [
          Icon(icon, color: brandNavy, size: 18),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              color: brandNavy,
              fontSize: 10,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }
}

class _BusinessCardMetric extends StatelessWidget {
  const _BusinessCardMetric({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: const TextStyle(
              color: Color(0xFFC9D8FF),
              fontSize: 14,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: brandHeroText,
              fontSize: 9.5,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _BncEcosystemQuickAccessGrid extends StatelessWidget {
  const _BncEcosystemQuickAccessGrid({required this.item});

  final _BncEcosystemSpec item;

  @override
  Widget build(BuildContext context) {
    final accent = _ecosystemAccentFor(item.title);
    final actions = _ecosystemQuickActionsFor(item.title);

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: actions.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        childAspectRatio: 1.38,
      ),
      itemBuilder: (context, index) {
        final action = actions[index];
        return _BncEcosystemQuickActionCard(
          icon: action.$1,
          title: action.$2,
          text: action.$3,
          accent: accent,
          onTap: () => _openEcosystemQuickAction(
            context,
            item.title,
            action.$2,
          ),
        );
      },
    );
  }
}

class _BncEcosystemQuickActionCard extends StatelessWidget {
  const _BncEcosystemQuickActionCard({
    required this.icon,
    required this.title,
    required this.text,
    required this.accent,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String text;
  final Color accent;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Ink(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [brandNavyDeep, brandNavy, brandNavyBright],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x2408204A),
                blurRadius: 16,
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
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(13),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.13),
                      ),
                    ),
                    child: Icon(icon, color: brandGold, size: 21),
                  ),
                  const Spacer(),
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: brandGold,
                      borderRadius: BorderRadius.circular(999),
                      boxShadow: [
                        BoxShadow(
                          color: brandGold.withValues(alpha: 0.24),
                          blurRadius: 8,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Icon(
                      Icons.arrow_forward_rounded,
                      color: brandNavy,
                      size: 16,
                    ),
                  ),
                ],
              ),
              const Spacer(),
              Text(
                title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                text,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: brandHeroText,
                  fontSize: 10.5,
                  height: 1.2,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BncEcosystemSmartSuggestionCard extends StatelessWidget {
  const _BncEcosystemSmartSuggestionCard({required this.item});

  final _BncEcosystemSpec item;

  @override
  Widget build(BuildContext context) {
    final accent = _ecosystemAccentFor(item.title);
    final suggestion = _ecosystemSuggestionFor(item.title);
    final steps = _ecosystemNextStepsFor(item.title);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            brandNavyDeep,
            brandNavy,
            brandNavyBright,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
        boxShadow: [
          BoxShadow(
            color: brandNavy.withValues(alpha: 0.22),
            blurRadius: 18,
            offset: const Offset(0, 10),
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
                  color: Colors.white.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(15),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
                ),
                child: Icon(
                  suggestion.$1,
                  color: brandGold,
                  size: 23,
                ),
              ),
              const SizedBox(width: 11),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      suggestion.$2,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14.5,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      suggestion.$3,
                      style: const TextStyle(
                        color: brandHeroText,
                        fontSize: 11.5,
                        height: 1.25,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: steps.map((step) {
              return Expanded(
                child: _BncEcosystemSuggestionStep(
                  icon: step.$1,
                  title: step.$2,
                  accent: accent,
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

class _BncEcosystemSuggestionStep extends StatelessWidget {
  const _BncEcosystemSuggestionStep({
    required this.icon,
    required this.title,
    required this.accent,
  });

  final IconData icon;
  final String title;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(right: 7),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 9),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
      ),
      child: Column(
        children: [
          Icon(icon, color: brandGold, size: 18),
          const SizedBox(height: 5),
          Text(
            title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 10.5,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }
}

class _BncEcosystemProgressStrip extends StatelessWidget {
  const _BncEcosystemProgressStrip({required this.item});

  final _BncEcosystemSpec item;

  @override
  Widget build(BuildContext context) {
    final accent = _ecosystemAccentFor(item.title);
    final metrics = _ecosystemProgressFor(item.title);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            brandNavyDeep,
            brandNavy,
            brandNavyBright,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
        boxShadow: [
          BoxShadow(
            color: brandNavy.withValues(alpha: 0.20),
            blurRadius: 18,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        children: metrics.map((metric) {
          return Expanded(
            child: _BncProgressMetric(
              value: metric.$1,
              label: metric.$2,
              accent: accent,
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _BncProgressMetric extends StatelessWidget {
  const _BncProgressMetric({
    required this.value,
    required this.label,
    required this.accent,
  });

  final String value;
  final String label;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
      ),
      child: Column(
        children: [
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: brandGold,
              fontSize: 15,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: brandHeroText,
              fontSize: 10,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _BncEcosystemPrimaryAction extends StatelessWidget {
  const _BncEcosystemPrimaryAction({required this.item});

  final _BncEcosystemSpec item;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _openEcosystemAction(context, item.title),
        borderRadius: BorderRadius.circular(18),
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [brandNavy, brandNavyBright],
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
            ),
            borderRadius: BorderRadius.circular(18),
            boxShadow: const [
              BoxShadow(
                color: Color(0x2608204A),
                blurRadius: 16,
                offset: Offset(0, 9),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(item.icon, color: Colors.white, size: 19),
              const SizedBox(width: 9),
              Flexible(
                child: Text(
                  _ecosystemActionLabelFor(item.title),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 14,
                  ),
                ),
              ),
              const SizedBox(width: 9),
              const Icon(
                Icons.arrow_forward_rounded,
                color: brandGold,
                size: 19,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BncEcosystemFeature {
  const _BncEcosystemFeature(this.icon, this.title, this.text);

  final IconData icon;
  final String title;
  final String text;
}

void _openEcosystemAction(BuildContext context, String title) {
  Widget? page;

  switch (title) {
    case 'Business Card':
    case 'Dashboard':
      page = const BncProfilePage();
      break;
    case 'B2B Network':
      page = const BncAllShopsPage();
      break;
    case 'Jobs':
      page = const BncSearchPage(initialQuery: 'jobs');
      break;
    case 'Winner':
    case 'Feed':
      page = const BncNotificationsPage();
      break;
    case 'Doctor Booking':
      page = const BncDoctorBookingPage();
      break;
    case 'Plans':
      page = const BncDealsPage();
      break;
    case 'Admin':
      page = const BncProfilePage();
      break;
  }

  if (page != null) {
    Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => page!));
    return;
  }

  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text('$title will be connected soon.'),
      behavior: SnackBarBehavior.floating,
    ),
  );
}

void _openEcosystemQuickAction(
  BuildContext context,
  String sectionTitle,
  String actionTitle,
) {
  Widget? page;

  switch (sectionTitle) {
    case 'Business Card':
      switch (actionTitle) {
        case 'QR card':
        case 'Catalog':
        case 'Contact':
        case 'Route':
          page = const BncProfilePage();
          break;
      }
      break;
    case 'B2B Network':
      switch (actionTitle) {
        case 'Suppliers':
        case 'Partners':
        case 'Network':
          page = const BncAllShopsPage();
          break;
        case 'Leads':
          page = const BncNotificationsPage();
          break;
      }
      break;
    case 'Jobs':
      switch (actionTitle) {
        case 'Openings':
        case 'Candidates':
        case 'Post job':
          page = const BncSearchPage(initialQuery: 'jobs');
          break;
        case 'Saved':
          page = const BncProfilePage();
          break;
      }
      break;
    case 'Winner':
      switch (actionTitle) {
        case 'Join draw':
        case 'Gifts':
        case 'Winners':
        case 'Alerts':
          page = const BncNotificationsPage();
          break;
      }
      break;
    case 'Doctor Booking':
      page = const BncDoctorBookingPage();
      break;
    case 'Feed':
      switch (actionTitle) {
        case 'Stories':
        case 'Promote':
        case 'Engage':
          page = const BncNotificationsPage();
          break;
        case 'Offers':
          page = const BncDealsPage();
          break;
      }
      break;
    case 'Plans':
      page = const BncDealsPage();
      break;
    case 'Dashboard':
      switch (actionTitle) {
        case 'Insights':
          page = const BncNotificationsPage();
          break;
        case 'Listing':
        case 'Photos':
          page = const BncProfilePage();
          break;
        case 'Offers':
          page = const BncDealsPage();
          break;
      }
      break;
    case 'Admin':
      switch (actionTitle) {
        case 'Categories':
          page = const BncCategoryBrowsePage(
            initialCategorySlug: 'grocery',
            initialCategories: [],
          );
          break;
        case 'Listings':
          page = const BncAllShopsPage();
          break;
        case 'Reports':
          page = const BncNotificationsPage();
          break;
        case 'Access':
          page = const BncProfilePage();
          break;
      }
      break;
  }

  if (page != null) {
    Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => page!));
    return;
  }

  _openEcosystemAction(context, sectionTitle);
}

Color _ecosystemAccentFor(String title) {
  return brandNavyBright;
}

String _ecosystemShortHintFor(String title) {
  switch (title) {
    case 'Business Card':
      return 'Share in seconds';
    case 'B2B Network':
      return 'Find partners';
    case 'Jobs':
      return 'Hire or apply';
    case 'Winner':
      return 'Rewards live';
    case 'Doctor Booking':
      return 'Book doctors';
    case 'Feed':
      return 'Local updates';
    case 'Plans':
      return 'Grow visibility';
    case 'Dashboard':
      return 'Track business';
    case 'Admin':
      return 'Manage system';
    default:
      return 'Learn faster';
  }
}

String _ecosystemUsageHintFor(String title) {
  switch (title) {
    case 'Business Card':
      return 'Best for shop owners who want one shareable profile for calls, location and catalog discovery.';
    case 'B2B Network':
      return 'Use this to discover nearby business partners, vendors and service providers.';
    case 'Jobs':
      return 'Designed for local hiring, quick openings and service worker discovery.';
    case 'Winner':
      return 'Keep weekly draws, gifts and reward announcements visible to users.';
    case 'Doctor Booking':
      return 'Helps users find nearby clinics, choose a doctor and start a booking request quickly.';
    case 'Feed':
      return 'A place for local business stories, new arrivals, announcements and offers.';
    case 'Plans':
      return 'Helps businesses compare promotion, visibility and catalog growth options.';
    case 'Dashboard':
      return 'Useful for owners to check views, saves, leads and listing performance.';
    case 'Admin':
      return 'Reserved for secure business, category, report and user management.';
    default:
      return 'Simple help content for users and business owners inside the app.';
  }
}

List<(String, String)> _ecosystemStatsFor(String title) {
  switch (title) {
    case 'Business Card':
      return const [('QR', 'share'), ('1 tap', 'contact')];
    case 'B2B Network':
      return const [('B2B', 'leads'), ('Local', 'partners')];
    case 'Jobs':
      return const [('Jobs', 'nearby'), ('Hire', 'talent')];
    case 'Winner':
      return const [('Weekly', 'draw'), ('Gifts', 'rewards')];
    case 'Doctor Booking':
      return const [('Clinics', 'nearby'), ('Fast', 'booking')];
    case 'Feed':
      return const [('Posts', 'local'), ('Offers', 'news')];
    case 'Plans':
      return const [('Boost', 'reach'), ('Pro', 'tools')];
    case 'Dashboard':
      return const [('Views', 'track'), ('Leads', 'manage')];
    case 'Admin':
      return const [('Secure', 'access'), ('Data', 'control')];
    default:
      return const [('FAQ', 'guides'), ('Help', 'support')];
  }
}

List<(IconData, String)> _ecosystemFlowFor(String title) {
  switch (title) {
    case 'B2B Network':
      return const [
        (Icons.search_rounded, 'Find'),
        (Icons.handshake_outlined, 'Connect'),
        (Icons.trending_up_rounded, 'Grow'),
      ];
    case 'Jobs':
      return const [
        (Icons.work_outline, 'Post'),
        (Icons.people_alt_outlined, 'Match'),
        (Icons.call_outlined, 'Hire'),
      ];
    case 'Winner':
      return const [
        (Icons.card_giftcard_rounded, 'Join'),
        (Icons.confirmation_number_outlined, 'Draw'),
        (Icons.emoji_events_outlined, 'Win'),
      ];
    case 'Doctor Booking':
      return const [
        (Icons.search_rounded, 'Find'),
        (Icons.calendar_month_outlined, 'Book'),
        (Icons.local_hospital_outlined, 'Visit'),
      ];
    case 'Feed':
      return const [
        (Icons.edit_note_rounded, 'Post'),
        (Icons.campaign_outlined, 'Promote'),
        (Icons.favorite_border, 'Engage'),
      ];
    case 'Plans':
      return const [
        (Icons.visibility_outlined, 'Reach'),
        (Icons.star_border_rounded, 'Boost'),
        (Icons.analytics_outlined, 'Track'),
      ];
    case 'Dashboard':
      return const [
        (Icons.remove_red_eye_outlined, 'Views'),
        (Icons.call_outlined, 'Leads'),
        (Icons.tune_rounded, 'Manage'),
      ];
    case 'Admin':
      return const [
        (Icons.category_outlined, 'Catalog'),
        (Icons.verified_user_outlined, 'Review'),
        (Icons.security_outlined, 'Secure'),
      ];
    default:
      return const [
        (Icons.menu_book_outlined, 'Learn'),
        (Icons.help_outline_rounded, 'Fix'),
        (Icons.support_agent_outlined, 'Support'),
      ];
  }
}

List<(IconData, String)> _ecosystemNextStepsFor(String title) {
  switch (title) {
    case 'Business Card':
      return const [
        (Icons.add_business_outlined, 'Details'),
        (Icons.qr_code_2_rounded, 'QR'),
        (Icons.share_outlined, 'Share'),
      ];
    case 'B2B Network':
      return const [
        (Icons.search_rounded, 'Find'),
        (Icons.chat_outlined, 'Talk'),
        (Icons.handshake_outlined, 'Close'),
      ];
    case 'Jobs':
      return const [
        (Icons.edit_note_rounded, 'Post'),
        (Icons.people_alt_outlined, 'Match'),
        (Icons.call_outlined, 'Hire'),
      ];
    case 'Winner':
      return const [
        (Icons.card_giftcard_rounded, 'Join'),
        (Icons.notifications_none_rounded, 'Alert'),
        (Icons.emoji_events_outlined, 'Win'),
      ];
    case 'Doctor Booking':
      return const [
        (Icons.medical_services_outlined, 'Doctor'),
        (Icons.schedule_outlined, 'Time'),
        (Icons.location_on_outlined, 'Clinic'),
      ];
    case 'Feed':
      return const [
        (Icons.add_circle_outline, 'Post'),
        (Icons.local_offer_outlined, 'Offer'),
        (Icons.favorite_border, 'Engage'),
      ];
    case 'Plans':
      return const [
        (Icons.compare_arrows_rounded, 'Compare'),
        (Icons.workspace_premium_outlined, 'Select'),
        (Icons.trending_up_rounded, 'Boost'),
      ];
    case 'Dashboard':
      return const [
        (Icons.insights_outlined, 'Views'),
        (Icons.call_outlined, 'Leads'),
        (Icons.tune_rounded, 'Improve'),
      ];
    case 'Admin':
      return const [
        (Icons.verified_user_outlined, 'Review'),
        (Icons.security_outlined, 'Secure'),
        (Icons.publish_outlined, 'Publish'),
      ];
    default:
      return const [
        (Icons.menu_book_outlined, 'Read'),
        (Icons.help_outline_rounded, 'Learn'),
        (Icons.support_agent_outlined, 'Ask'),
      ];
  }
}

List<(String, String)> _ecosystemProgressFor(String title) {
  switch (title) {
    case 'Business Card':
      return const [('3x', 'faster share'), ('24/7', 'profile'), ('1 tap', 'contact')];
    case 'B2B Network':
      return const [('12', 'partners'), ('5', 'leads'), ('Near', 'vendors')];
    case 'Jobs':
      return const [('Quick', 'posts'), ('Local', 'talent'), ('Saved', 'shortlist')];
    case 'Winner':
      return const [('Weekly', 'draw'), ('Gifts', 'live'), ('3', 'alerts')];
    case 'Doctor Booking':
      return const [('Today', 'slots'), ('Near', 'clinics'), ('1 tap', 'request')];
    case 'Feed':
      return const [('New', 'stories'), ('Offers', 'live'), ('More', 'reach')];
    case 'Plans':
      return const [('Boost', 'views'), ('Top', 'listing'), ('Track', 'growth')];
    case 'Dashboard':
      return const [('Views', 'today'), ('Calls', 'leads'), ('Edit', 'listing')];
    case 'Admin':
      return const [('Clean', 'data'), ('Safe', 'access'), ('Live', 'catalog')];
    default:
      return const [('Help', 'guides'), ('Tips', 'daily'), ('Easy', 'steps')];
  }
}

(IconData, String, String) _ecosystemSuggestionFor(String title) {
  switch (title) {
    case 'Business Card':
      return const (
        Icons.auto_awesome_rounded,
        'Make your shop instantly shareable',
        'Add a photo, location, call button and QR so customers can open everything in one tap.',
      );
    case 'B2B Network':
      return const (
        Icons.hub_outlined,
        'Build a trusted local supplier circle',
        'Start with nearby vendors, service providers and shops that match your business category.',
      );
    case 'Jobs':
      return const (
        Icons.person_search_outlined,
        'Turn hiring into a simple local flow',
        'Post short openings and let nearby candidates contact you without a long form.',
      );
    case 'Winner':
      return const (
        Icons.emoji_events_outlined,
        'Keep rewards visible and exciting',
        'Show weekly draws, winners and gifts so users have a reason to come back.',
      );
    case 'Doctor Booking':
      return const (
        Icons.health_and_safety_outlined,
        'Make healthcare access simple',
        'Let users search doctors, see nearby clinics and start a booking without confusion.',
      );
    case 'Feed':
      return const (
        Icons.campaign_outlined,
        'Make every shop update useful',
        'Let shops post offers, arrivals and announcements that can turn into visits.',
      );
    case 'Plans':
      return const (
        Icons.trending_up_rounded,
        'Help businesses pick growth tools',
        'Show simple plans for featured placement, offers and better discovery.',
      );
    case 'Dashboard':
      return const (
        Icons.insights_outlined,
        'Show owners what is working',
        'Highlight views, calls, saved shops and offer clicks so they can improve their listing.',
      );
    case 'Admin':
      return const (
        Icons.admin_panel_settings_outlined,
        'Keep the marketplace clean',
        'Review categories, listings, reports and catalog changes before they reach users.',
      );
    default:
      return const (
        Icons.lightbulb_outline,
        'Guide users with quick answers',
        'Add simple explanations, tips and help paths for every important BNC feature.',
      );
  }
}

List<(IconData, String, String)> _ecosystemQuickActionsFor(String title) {
  switch (title) {
    case 'Business Card':
      return const [
        (Icons.qr_code_2_rounded, 'QR card', 'Share your profile'),
        (Icons.storefront_outlined, 'Catalog', 'Show services'),
        (Icons.call_outlined, 'Contact', 'Calls and WhatsApp'),
        (Icons.location_on_outlined, 'Route', 'Help users visit'),
      ];
    case 'B2B Network':
      return const [
        (Icons.storefront_outlined, 'Suppliers', 'Find local vendors'),
        (Icons.handshake_outlined, 'Partners', 'Connect businesses'),
        (Icons.request_quote_outlined, 'Leads', 'Track requests'),
        (Icons.hub_outlined, 'Network', 'Grow reach'),
      ];
    case 'Jobs':
      return const [
        (Icons.work_outline, 'Openings', 'Nearby job posts'),
        (Icons.person_search_outlined, 'Candidates', 'Find local talent'),
        (Icons.post_add_outlined, 'Post job', 'Hire faster'),
        (Icons.bookmark_border, 'Saved', 'Shortlist people'),
      ];
    case 'Winner':
      return const [
        (Icons.confirmation_number_outlined, 'Join draw', 'Weekly entries'),
        (Icons.card_giftcard_rounded, 'Gifts', 'Reward updates'),
        (Icons.emoji_events_outlined, 'Winners', 'Recent winners'),
        (Icons.notifications_none_rounded, 'Alerts', 'Prize reminders'),
      ];
    case 'Doctor Booking':
      return const [
        (Icons.local_hospital_outlined, 'Clinics', 'Nearby healthcare'),
        (Icons.person_search_outlined, 'Doctors', 'Find specialists'),
        (Icons.calendar_month_outlined, 'Slots', 'Request a visit'),
        (Icons.call_outlined, 'Call', 'Contact clinic'),
      ];
    case 'Feed':
      return const [
        (Icons.article_outlined, 'Stories', 'Local shop news'),
        (Icons.campaign_outlined, 'Promote', 'Boost updates'),
        (Icons.local_offer_outlined, 'Offers', 'Share deals'),
        (Icons.chat_bubble_outline, 'Engage', 'Customer replies'),
      ];
    case 'Plans':
      return const [
        (Icons.workspace_premium_outlined, 'Premium', 'Featured reach'),
        (Icons.bolt_outlined, 'Boosts', 'More visibility'),
        (Icons.receipt_long_outlined, 'Billing', 'Invoices later'),
        (Icons.compare_arrows_rounded, 'Compare', 'Pick a plan'),
      ];
    case 'Dashboard':
      return const [
        (Icons.insights_outlined, 'Insights', 'Views and calls'),
        (Icons.store_mall_directory_outlined, 'Listing', 'Edit profile'),
        (Icons.local_offer_outlined, 'Offers', 'Manage deals'),
        (Icons.image_outlined, 'Photos', 'Update images'),
      ];
    case 'Admin':
      return const [
        (Icons.category_outlined, 'Categories', 'Manage sections'),
        (Icons.storefront_outlined, 'Listings', 'Review shops'),
        (Icons.report_outlined, 'Reports', 'Check issues'),
        (Icons.lock_outline, 'Access', 'Secure admin'),
      ];
    default:
      return const [
        (Icons.menu_book_outlined, 'Guides', 'How BNC works'),
        (Icons.help_outline_rounded, 'FAQs', 'Quick answers'),
        (Icons.support_agent_outlined, 'Support', 'Get help'),
        (Icons.lightbulb_outline, 'Tips', 'Use better'),
      ];
  }
}

List<_BncEcosystemFeature> _ecosystemFeaturesFor(String title) {
  switch (title) {
    case 'Business Card':
      return const [
        _BncEcosystemFeature(
          Icons.qr_code_2_rounded,
          'Instant QR sharing',
          'Let customers scan and open your business profile, calls and location.',
        ),
        _BncEcosystemFeature(
          Icons.storefront_outlined,
          'Show catalog and offers',
          'Feature products, services and live deals from one shareable card.',
        ),
        _BncEcosystemFeature(
          Icons.call_outlined,
          'One tap contact',
          'Add call, WhatsApp, route and website actions for faster enquiries.',
        ),
      ];
    case 'B2B Network':
      return const [
        _BncEcosystemFeature(
          Icons.groups_2_outlined,
          'Find partners',
          'Connect with suppliers, service providers and local shops.',
        ),
        _BncEcosystemFeature(
          Icons.handshake_outlined,
          'Business leads',
          'Track requests and partnership opportunities in one place.',
        ),
      ];
    case 'Jobs':
      return const [
        _BncEcosystemFeature(
          Icons.work_outline,
          'Local openings',
          'Find nearby jobs from shops and service businesses.',
        ),
        _BncEcosystemFeature(
          Icons.person_add_alt_1_outlined,
          'Hire talent',
          'Post simple hiring needs for local candidates.',
        ),
      ];
    case 'Winner':
      return const [
        _BncEcosystemFeature(
          Icons.card_giftcard_rounded,
          'Weekly draw',
          'Join BNC rewards, gifts and local contest updates.',
        ),
        _BncEcosystemFeature(
          Icons.emoji_events_outlined,
          'Winner list',
          'View recent winners and prize announcements.',
        ),
      ];
    case 'Doctor Booking':
      return const [
        _BncEcosystemFeature(
          Icons.local_hospital_outlined,
          'Nearby clinics',
          'Help users discover trusted clinics and doctors around them.',
        ),
        _BncEcosystemFeature(
          Icons.calendar_month_outlined,
          'Easy appointment request',
          'Let users choose a service, call, or start a simple booking flow.',
        ),
        _BncEcosystemFeature(
          Icons.health_and_safety_outlined,
          'Health-first discovery',
          'Keep doctor search, clinic visit and contact actions in one place.',
        ),
      ];
    case 'Feed':
      return const [
        _BncEcosystemFeature(
          Icons.newspaper_rounded,
          'Local updates',
          'Read shop stories, offers and community posts.',
        ),
        _BncEcosystemFeature(
          Icons.campaign_outlined,
          'Promote news',
          'Share announcements from your business profile.',
        ),
      ];
    case 'Plans':
      return const [
        _BncEcosystemFeature(
          Icons.workspace_premium_outlined,
          'Business plans',
          'Compare visibility, featured placement and lead tools.',
        ),
        _BncEcosystemFeature(
          Icons.payment_outlined,
          'Simple billing',
          'Keep future subscriptions and invoices organized.',
        ),
      ];
    case 'Dashboard':
      return const [
        _BncEcosystemFeature(
          Icons.insights_outlined,
          'Performance',
          'Track views, calls, saves and customer interest.',
        ),
        _BncEcosystemFeature(
          Icons.store_mall_directory_outlined,
          'Manage listing',
          'Update business details, images, offers and category.',
        ),
      ];
    case 'Admin':
      return const [
        _BncEcosystemFeature(
          Icons.admin_panel_settings_outlined,
          'Admin tools',
          'Manage users, reports, categories and business listings.',
        ),
        _BncEcosystemFeature(
          Icons.security_outlined,
          'Protected access',
          'Admin features should stay behind secure login.',
        ),
      ];
    default:
      return const [
        _BncEcosystemFeature(
          Icons.menu_book_outlined,
          'Guides',
          'Learn how to use BNC marketplace and business tools.',
        ),
        _BncEcosystemFeature(
          Icons.support_agent_outlined,
          'Support',
          'Find help articles, FAQs and setup resources.',
        ),
      ];
  }
}

String _ecosystemActionLabelFor(String title) {
  switch (title) {
    case 'Business Card':
      return 'Create smart business card';
    case 'B2B Network':
      return 'Open network';
    case 'Jobs':
      return 'Browse jobs';
    case 'Winner':
      return 'View rewards';
    case 'Doctor Booking':
      return 'Book a doctor';
    case 'Feed':
      return 'Open feed';
    case 'Plans':
      return 'View plans';
    case 'Dashboard':
      return 'Open dashboard';
    case 'Admin':
      return 'Open admin';
    default:
      return 'Read guides';
  }
}

class _BncMobileFeatureHeader extends StatelessWidget {
  const _BncMobileFeatureHeader({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.badge,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final String badge;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 8, 14, 18),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [brandNavyDeep, brandNavy, brandNavyBright],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(26)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(
                onPressed: () => Navigator.of(context).pop(),
                visualDensity: VisualDensity.compact,
                icon: const Icon(Icons.arrow_back, color: Colors.white, size: 22),
              ),
              const SizedBox(width: 2),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                decoration: BoxDecoration(
                  color: brandGold,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Row(
                  children: [
                    Icon(
                      icon,
                      color: brandNavy,
                      size: 15,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      badge,
                      style: TextStyle(
                        color: brandNavy,
                        fontSize: 10.5,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            subtitle,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 13,
              height: 1.3,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _BncDealHighlightCard extends StatelessWidget {
  const _BncDealHighlightCard({
    required this.deal,
    this.isSelected = false,
  });

  final _BncDealUiItem deal;
  final bool isSelected;

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 220),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: deal.color,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isSelected ? brandGold : Colors.transparent,
          width: isSelected ? 3 : 0,
        ),
        boxShadow: isSelected
            ? const [
                BoxShadow(
                  color: Color(0x3325A451),
                  blurRadius: 18,
                  offset: Offset(0, 8),
                ),
              ]
            : null,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      deal.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 26,
                        height: 1.05,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      deal.description,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: SizedBox(
                  width: 82,
                  height: 70,
                  child: _AssetImageFill(asset: deal.asset),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.16),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  deal.code,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: FilledButton.icon(
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF0E7A43),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  onPressed: () => _copyDealCode(context, deal.code),
                  icon: const Icon(Icons.content_copy_rounded, size: 16),
                  label: const Text(
                    'Copy code',
                    style: TextStyle(fontWeight: FontWeight.w900),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: BorderSide(
                      color: Colors.white.withValues(alpha: 0.50),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  onPressed: () => _claimDeal(
                    context,
                    deal.code,
                    deal.shopName,
                    targetShop: deal.shop,
                  ),
                  icon: const Icon(Icons.arrow_forward_rounded, size: 16),
                  label: const Text(
                    'Claim',
                    style: TextStyle(fontWeight: FontWeight.w900),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _BncDealsQuickActions extends StatelessWidget {
  const _BncDealsQuickActions();

  @override
  Widget build(BuildContext context) {
    const actions = [
      (Icons.percent_rounded, 'Best deals', 'deals'),
      (Icons.storefront_outlined, 'Near shops', 'shops'),
      (Icons.card_giftcard_outlined, 'Rewards', 'rewards'),
    ];

    return Row(
      children: actions.map((action) {
        return Expanded(
          child: Padding(
            padding: const EdgeInsets.only(right: 8),
            child: InkWell(
              onTap: () => _openDealQuickAction(context, action.$3),
              borderRadius: BorderRadius.circular(14),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 11),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: brandLine),
                ),
                child: Column(
                  children: [
                    Icon(action.$1, color: brandNavy, size: 19),
                    const SizedBox(height: 5),
                    Text(
                      action.$2,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: brandNavy,
                        fontSize: 10.5,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

void _openDealQuickAction(BuildContext context, String action) {
  if (action == 'shops') {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const BncAllShopsPage()),
    );
    return;
  }

  _showDealMessage(
    context,
    action == 'rewards' ? 'Rewards offers selected' : 'Showing best deals',
  );
}

void _showDealMessage(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
  );
}

Future<void> _copyDealCode(BuildContext context, String code) async {
  await Clipboard.setData(ClipboardData(text: code));
  if (!context.mounted) {
    return;
  }

  _showDealMessage(context, '$code copied');
}

Future<void> _claimDeal(
  BuildContext context,
  String code,
  String shopName,
  {
  _BncShopSpec? targetShop,
  }
) async {
  await Clipboard.setData(ClipboardData(text: code));
  if (!context.mounted) {
    return;
  }

  _openDealShop(context, shopName, targetShop: targetShop);
}

void _openDealShop(
  BuildContext context,
  String shopName, {
  _BncShopSpec? targetShop,
}) {
  final shop =
      targetShop ??
      _allBncShops.firstWhere(
        (item) => item.name == shopName,
        orElse: () => _allBncShops.first,
      );

  _openBusinessDetail(context, shop);
}

class _BncOfferListCard extends StatelessWidget {
  const _BncOfferListCard({
    required this.icon,
    required this.title,
    required this.shop,
    required this.code,
    required this.detail,
    required this.asset,
    required this.color,
    this.targetShop,
    this.isSelected = false,
  });

  final IconData icon;
  final String title;
  final String shop;
  final String code;
  final String detail;
  final String asset;
  final Color color;
  final _BncShopSpec? targetShop;
  final bool isSelected;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? color.withValues(alpha: 0.08) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? color : brandLine,
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: color.withValues(alpha: 0.18),
                    blurRadius: 16,
                    offset: const Offset(0, 8),
                  ),
                ]
              : null,
        ),
        child: Column(
          children: [
            Row(
              children: [
                GestureDetector(
                  onTap: () => _openDealShop(context, shop, targetShop: targetShop),
                  child: Container(
                    width: 62,
                    height: 62,
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        _AssetImageFill(asset: asset),
                        DecoratedBox(
                          decoration: BoxDecoration(
                            color: color.withValues(alpha: 0.18),
                          ),
                        ),
                        Icon(icon, color: Colors.white, size: 20),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: brandNavy,
                          fontSize: 13.5,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        shop,
                        style: const TextStyle(
                          color: brandMuted,
                          fontSize: 11.5,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        detail,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: brandMuted,
                          fontSize: 10.5,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEAF1FF),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    code,
                    style: const TextStyle(
                      color: brandNavy,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: _BncDealActionButton(
                    label: 'Copy',
                    icon: Icons.content_copy_rounded,
                    foreground: brandNavy,
                    background: const Color(0xFFEAF1FF),
                    onTap: () => _copyDealCode(context, code),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _BncDealActionButton(
                    label: 'Visit',
                    icon: Icons.storefront_outlined,
                    foreground: color,
                    background: color.withValues(alpha: 0.12),
                    onTap: () => _openDealShop(context, shop, targetShop: targetShop),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _BncDealActionButton extends StatelessWidget {
  const _BncDealActionButton({
    required this.label,
    required this.icon,
    required this.foreground,
    required this.background,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final Color foreground;
  final Color background;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        decoration: BoxDecoration(
          color: background,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: foreground, size: 13),
            const SizedBox(width: 4),
            Flexible(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: foreground,
                  fontSize: 10.5,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BncDealShopVisitRail extends StatelessWidget {
  const _BncDealShopVisitRail();

  @override
  Widget build(BuildContext context) {
    final shops = [
      _allBncShops.firstWhere((shop) => shop.name == 'HomeFix Pro'),
      _allBncShops.firstWhere((shop) => shop.name == 'Maya Beauty Salon'),
      _allBncShops.firstWhere((shop) => shop.name == 'Spice Garden'),
      _allBncShops.firstWhere((shop) => shop.name == 'Quick Mart'),
    ];

    return _BncSlidingRail(
      height: 142,
      itemCount: shops.length,
      itemBuilder: (context, index) {
        return SizedBox(
          width: 210,
          child: _BncDealShopVisitCard(shop: shops[index]),
        );
      },
    );
  }
}

class _BncDealShopVisitCard extends StatelessWidget {
  const _BncDealShopVisitCard({required this.shop});

  final _BncShopSpec shop;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _openBusinessDetail(context, shop),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: brandLine),
        ),
        clipBehavior: Clip.antiAlias,
        child: Row(
          children: [
            SizedBox(
              width: 82,
              height: double.infinity,
              child: _AssetImageFill(asset: shop.asset, imageUrl: shop.imageUrl),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      shop.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: brandNavy,
                        fontSize: 12.5,
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
                        fontSize: 10.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const Spacer(),
                    Row(
                      children: [
                        const Icon(
                          Icons.location_on_outlined,
                          color: brandMuted,
                          size: 13,
                        ),
                        const SizedBox(width: 3),
                        Expanded(
                          child: Text(
                            shop.distance,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: brandMuted,
                              fontSize: 10.5,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 7),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 9,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: brandNavy,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: const Text(
                        'Visit shop',
                        style: TextStyle(
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
      ),
    );
  }
}

class _BncBookingStatusCard extends StatelessWidget {
  const _BncBookingStatusCard();

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _openBookingAction(context, 'home'),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: brandLine),
        ),
        child: Row(
          children: [
            Container(
              width: 70,
              height: 58,
              decoration: BoxDecoration(
                color: const Color(0xFFEAF1FF),
                borderRadius: BorderRadius.circular(18),
              ),
              clipBehavior: Clip.antiAlias,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  const _AssetImageFill(asset: '$_mockupPath/im-electrical.jpg'),
                  DecoratedBox(
                    decoration: BoxDecoration(
                      color: brandNavy.withValues(alpha: 0.18),
                    ),
                  ),
                  const Icon(
                    Icons.event_available_outlined,
                    color: Colors.white,
                    size: 26,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'No active bookings',
                    style: TextStyle(
                      color: brandNavy,
                      fontSize: 15,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  SizedBox(height: 3),
                  Text(
                    'Book a service and track it here.',
                    style: TextStyle(
                      color: brandMuted,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BncBookingActionCard extends StatelessWidget {
  const _BncBookingActionCard({
    required this.icon,
    required this.title,
    required this.text,
    required this.asset,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String text;
  final String asset;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: brandLine),
          ),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: SizedBox(
                  width: 58,
                  height: 54,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      _AssetImageFill(asset: asset),
                      DecoratedBox(
                        decoration: BoxDecoration(
                          color: brandNavy.withValues(alpha: 0.18),
                        ),
                      ),
                      Icon(icon, color: Colors.white, size: 22),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        color: brandNavy,
                        fontSize: 13.5,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      text,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: brandMuted,
                        fontSize: 11.5,
                        height: 1.25,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFEAF1FF),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: const Text(
                  'Visit',
                  style: TextStyle(
                    color: brandNavy,
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BncBookingShopVisitRail extends StatelessWidget {
  const _BncBookingShopVisitRail();

  @override
  Widget build(BuildContext context) {
    final shops = [
      _allBncShops.firstWhere((shop) => shop.name == 'HomeFix Pro'),
      _allBncShops.firstWhere((shop) => shop.name == 'Spice Garden'),
      _allBncShops.firstWhere((shop) => shop.name == 'Maya Beauty Salon'),
    ];

    return _BncSlidingRail(
      height: 142,
      itemCount: shops.length,
      itemBuilder: (context, index) {
        return SizedBox(
          width: 210,
          child: _BncDealShopVisitCard(shop: shops[index]),
        );
      },
    );
  }
}

void _openBookingAction(BuildContext context, String type) {
  final query = switch (type) {
    'home' => 'home services',
    'restaurant' => 'restaurants',
    'salon' => 'beauty salon',
    _ => '',
  };

  if (type == 'doctor') {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const BncDoctorBookingPage()),
    );
    return;
  }

  Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => BncSearchPage(initialQuery: query),
    ),
  );
}

class BncProfilePage extends StatelessWidget {
  const BncProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return _BncPhoneSizedRoute(
      child: Scaffold(
        backgroundColor: brandSurface,
        body: SafeArea(
          child: CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: Container(
                  padding: const EdgeInsets.fromLTRB(12, 8, 14, 22),
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [brandNavyDeep, brandNavy, brandNavyBright],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.vertical(
                      bottom: Radius.circular(28),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          IconButton(
                            onPressed: () => Navigator.of(context).pop(),
                            visualDensity: VisualDensity.compact,
                            icon: const Icon(
                              Icons.arrow_back,
                              color: Colors.white,
                              size: 22,
                            ),
                          ),
                          const Expanded(
                            child: Text(
                              'Profile',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 20,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                          Container(
                            width: 38,
                            height: 38,
                            decoration: BoxDecoration(
                              color: brandGold,
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: const Icon(
                              Icons.person_outline,
                              color: brandNavy,
                              size: 21,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      const _BncProfileHeroCard(),
                    ],
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(14, 14, 14, 94),
                sliver: SliverList(
                  delegate: SliverChildListDelegate(
                    [
                      const _BncProfileStatsRow(),
                      const SizedBox(height: 12),
                      const _BncProfileActionRow(),
                      const SizedBox(height: 10),
                      _BncProfileCreateCardButton(
                        onTap: () => _openProfileDestination(
                          context,
                          'Business card',
                        ),
                      ),
                      const SizedBox(height: 16),
                      const _BncProfileSectionTitle(title: 'Account'),
                      const SizedBox(height: 8),
                      _BncProfileMenuCard(
                        icon: Icons.favorite_border,
                        title: 'Saved shops',
                        text: 'View businesses you want to revisit.',
                        onTap: () => _openProfileDestination(
                          context,
                          'Saved shops',
                        ),
                      ),
                      _BncProfileMenuCard(
                        icon: Icons.location_on_outlined,
                        title: 'Location preferences',
                        text: 'Use automatic location or keep Kozhikode.',
                        onTap: () => _openProfileDestination(
                          context,
                          'Location preferences',
                        ),
                      ),
                      _BncProfileMenuCard(
                        icon: Icons.notifications_none_rounded,
                        title: 'Notifications',
                        text: 'Manage deal alerts and BNC updates.',
                        onTap: () => _openProfileDestination(
                          context,
                          'Notifications',
                        ),
                      ),
                      const SizedBox(height: 8),
                      const _BncProfileSectionTitle(title: 'Business tools'),
                      const SizedBox(height: 8),
                      _BncProfileMenuCard(
                        icon: Icons.badge_outlined,
                        title: 'Business card',
                        text: 'Create and share your BNC digital card.',
                        onTap: () => _openProfileDestination(
                          context,
                          'Business card',
                        ),
                      ),
                      _BncProfileMenuCard(
                        icon: Icons.dashboard_outlined,
                        title: 'Dashboard',
                        text: 'Track business reach and performance.',
                        onTap: () => _openProfileDestination(
                          context,
                          'Dashboard',
                        ),
                      ),
                      _BncProfileMenuCard(
                        icon: Icons.settings_outlined,
                        title: 'Account settings',
                        text: 'Manage profile, alerts, privacy and business tools.',
                        onTap: () => _openProfileDestination(
                          context,
                          'Account settings',
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

void _openProfileDestination(BuildContext context, String title) {
  switch (title) {
    case 'Saved shops':
      Navigator.of(context).push(
        MaterialPageRoute<void>(builder: (_) => const BncFeaturedShopsPage()),
      );
      break;
    case 'Location preferences':
      Navigator.of(context).push(
        MaterialPageRoute<void>(builder: (_) => const BncAllShopsPage()),
      );
      break;
    case 'Notifications':
      Navigator.of(context).push(
        MaterialPageRoute<void>(builder: (_) => const BncNotificationsPage()),
      );
      break;
    case 'Business card':
      Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => _BncEcosystemPage(item: _bncEcosystem[0]),
        ),
      );
      break;
    case 'Dashboard':
      Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => _BncEcosystemPage(item: _bncEcosystem[7]),
        ),
      );
      break;
    case 'Account settings':
      Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => const BncAccountSettingsPage(),
        ),
      );
      break;
  }
}

class BncAccountSettingsPage extends StatefulWidget {
  const BncAccountSettingsPage({super.key});

  @override
  State<BncAccountSettingsPage> createState() => _BncAccountSettingsPageState();
}

class _BncAccountSettingsPageState extends State<BncAccountSettingsPage> {
  bool dealAlerts = true;
  bool bookingAlerts = true;
  bool weeklyRewards = true;
  bool automaticLocation = true;
  bool profileVisible = true;
  bool businessMode = true;
  String memberName = 'BNC Member';
  String memberPhone = '+91 98765 11111';
  String memberEmail = 'member@bnc.local';
  String memberArea = 'Kozhikode, Kerala';

  void _updatePreference(String message, VoidCallback update) {
    setState(update);
    _showBncSnack(context, message);
  }

  Future<void> _openEditProfileSheet() async {
    final nameController = TextEditingController(text: memberName);
    final phoneController = TextEditingController(text: memberPhone);
    final emailController = TextEditingController(text: memberEmail);
    final areaController = TextEditingController(text: memberArea);

    try {
      await showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (sheetContext) {
          return Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(sheetContext).viewInsets.bottom,
            ),
            child: _BncSettingsSheet(
              title: 'Edit profile',
              subtitle: 'Update your public BNC account details.',
              child: Column(
                children: [
                  _BncSettingsTextField(
                    controller: nameController,
                    label: 'Name',
                    icon: Icons.person_outline,
                  ),
                  _BncSettingsTextField(
                    controller: phoneController,
                    label: 'Phone number',
                    icon: Icons.phone_outlined,
                    keyboardType: TextInputType.phone,
                  ),
                  _BncSettingsTextField(
                    controller: emailController,
                    label: 'Email address',
                    icon: Icons.alternate_email_rounded,
                    keyboardType: TextInputType.emailAddress,
                  ),
                  _BncSettingsTextField(
                    controller: areaController,
                    label: 'Location',
                    icon: Icons.location_on_outlined,
                  ),
                  const SizedBox(height: 8),
                  _BncSettingsPrimaryButton(
                    icon: Icons.check_rounded,
                    label: 'Save profile',
                    onTap: () {
                      final nextName = nameController.text.trim();
                      if (nextName.isEmpty) {
                        _showBncSnack(sheetContext, 'Please enter your name.');
                        return;
                      }
                      setState(() {
                        memberName = nextName;
                        memberPhone = phoneController.text.trim();
                        memberEmail = emailController.text.trim();
                        memberArea = areaController.text.trim().isEmpty
                            ? 'Kozhikode, Kerala'
                            : areaController.text.trim();
                      });
                      Navigator.of(sheetContext).pop();
                      _showBncSnack(context, 'Profile details updated.');
                    },
                  ),
                ],
              ),
            ),
          );
        },
      );
    } finally {
      nameController.dispose();
      phoneController.dispose();
      emailController.dispose();
      areaController.dispose();
    }
  }

  Future<void> _openSecureLoginSheet() async {
    final passwordController = TextEditingController();
    final confirmController = TextEditingController();

    try {
      await showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (sheetContext) {
          String? errorText;

          return StatefulBuilder(
            builder: (context, setSheetState) {
              return Padding(
                padding: EdgeInsets.only(
                  bottom: MediaQuery.of(context).viewInsets.bottom,
                ),
                child: _BncSettingsSheet(
                  title: 'Secure login',
                  subtitle: 'Set a simple password for this account.',
                  child: Column(
                    children: [
                      _BncSettingsTextField(
                        controller: passwordController,
                        label: 'New password',
                        icon: Icons.lock_outline,
                        obscureText: true,
                      ),
                      _BncSettingsTextField(
                        controller: confirmController,
                        label: 'Confirm password',
                        icon: Icons.verified_user_outlined,
                        obscureText: true,
                      ),
                      if (errorText != null) ...[
                        const SizedBox(height: 2),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            errorText!,
                            style: const TextStyle(
                              color: Colors.red,
                              fontSize: 11.5,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                      ] else
                        const SizedBox(height: 8),
                      _BncSettingsPrimaryButton(
                        icon: Icons.shield_outlined,
                        label: 'Save secure login',
                        onTap: () {
                          final password = passwordController.text.trim();
                          final confirm = confirmController.text.trim();
                          if (password.length < 4) {
                            setSheetState(() {
                              errorText =
                                  'Use at least 4 characters for password.';
                            });
                            return;
                          }
                          if (password != confirm) {
                            setSheetState(() {
                              errorText = 'Passwords do not match.';
                            });
                            return;
                          }
                          Navigator.of(context).pop();
                          _showBncSnack(
                            this.context,
                            'Secure login setup saved.',
                          );
                        },
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      );
    } finally {
      passwordController.dispose();
      confirmController.dispose();
    }
  }

  @override
  Widget build(BuildContext context) {
    return _BncPhoneSizedRoute(
      child: Scaffold(
        backgroundColor: brandSurface,
        body: SafeArea(
          child: CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: Container(
                  padding: const EdgeInsets.fromLTRB(12, 8, 14, 22),
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [brandNavyDeep, brandNavy, brandNavyBright],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.vertical(
                      bottom: Radius.circular(28),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          IconButton(
                            onPressed: () => Navigator.of(context).pop(),
                            visualDensity: VisualDensity.compact,
                            icon: const Icon(
                              Icons.arrow_back,
                              color: Colors.white,
                              size: 22,
                            ),
                          ),
                          const Expanded(
                            child: Text(
                              'Account Settings',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 20,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                          Container(
                            width: 38,
                            height: 38,
                            decoration: BoxDecoration(
                              color: brandGold,
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: const Icon(
                              Icons.settings_outlined,
                              color: brandNavy,
                              size: 21,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(22),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.12),
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 58,
                              height: 58,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(18),
                              ),
                              child: const Center(
                                child: Text(
                                  'B',
                                  style: TextStyle(
                                    color: brandNavy,
                                    fontSize: 26,
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
                                    memberName,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 17,
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    memberArea,
                                    style: const TextStyle(
                                      color: brandHeroText,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(14, 14, 14, 96),
                sliver: SliverList(
                  delegate: SliverChildListDelegate(
                    [
                      const _BncProfileSectionTitle(title: 'Profile'),
                      const SizedBox(height: 8),
                      _BncSettingsActionCard(
                        icon: Icons.person_outline,
                        title: 'Edit profile details',
                        text: 'Update name, phone number and profile photo.',
                        actionText: 'Edit',
                        onTap: _openEditProfileSheet,
                      ),
                      _BncSettingsActionCard(
                        icon: Icons.badge_outlined,
                        title: 'Business profile',
                        text: 'Manage your business card, catalog and contact actions.',
                        actionText: 'Open',
                        onTap: () => _openProfileDestination(
                          context,
                          'Business card',
                        ),
                      ),
                      const SizedBox(height: 14),
                      const _BncProfileSectionTitle(title: 'Preferences'),
                      const SizedBox(height: 8),
                      _BncSettingsSwitchCard(
                        icon: Icons.location_on_outlined,
                        title: 'Automatic location',
                        text: 'Use nearby location for shops, clinics and offers.',
                        value: automaticLocation,
                        onChanged: (value) => _updatePreference(
                          value
                              ? 'Automatic location enabled.'
                              : 'Automatic location disabled.',
                          () => automaticLocation = value,
                        ),
                      ),
                      _BncSettingsSwitchCard(
                        icon: Icons.notifications_none_rounded,
                        title: 'Deal alerts',
                        text: 'Get local shop offers and discount notifications.',
                        value: dealAlerts,
                        onChanged: (value) => _updatePreference(
                          value ? 'Deal alerts enabled.' : 'Deal alerts muted.',
                          () => dealAlerts = value,
                        ),
                      ),
                      _BncSettingsSwitchCard(
                        icon: Icons.calendar_month_outlined,
                        title: 'Booking reminders',
                        text: 'Receive reminders for doctor and service bookings.',
                        value: bookingAlerts,
                        onChanged: (value) => _updatePreference(
                          value
                              ? 'Booking reminders enabled.'
                              : 'Booking reminders muted.',
                          () => bookingAlerts = value,
                        ),
                      ),
                      _BncSettingsSwitchCard(
                        icon: Icons.card_giftcard_rounded,
                        title: 'Weekly rewards',
                        text: 'Show winner, gifts and weekly draw updates.',
                        value: weeklyRewards,
                        onChanged: (value) => _updatePreference(
                          value
                              ? 'Weekly rewards enabled.'
                              : 'Weekly rewards hidden.',
                          () => weeklyRewards = value,
                        ),
                      ),
                      const SizedBox(height: 14),
                      const _BncProfileSectionTitle(title: 'Privacy & access'),
                      const SizedBox(height: 8),
                      _BncSettingsSwitchCard(
                        icon: Icons.visibility_outlined,
                        title: 'Public business profile',
                        text: 'Allow customers to discover your business card.',
                        value: profileVisible,
                        onChanged: (value) => _updatePreference(
                          value
                              ? 'Public business profile enabled.'
                              : 'Public business profile hidden.',
                          () => profileVisible = value,
                        ),
                      ),
                      _BncSettingsSwitchCard(
                        icon: Icons.storefront_outlined,
                        title: 'Business mode',
                        text: 'Show dashboard, business card and admin shortcuts.',
                        value: businessMode,
                        onChanged: (value) => _updatePreference(
                          value
                              ? 'Business mode enabled.'
                              : 'Business mode disabled.',
                          () => businessMode = value,
                        ),
                      ),
                      _BncSettingsActionCard(
                        icon: Icons.lock_outline,
                        title: 'Password and secure login',
                        text: 'Connect login later for safer account control.',
                        actionText: 'Setup',
                        onTap: _openSecureLoginSheet,
                      ),
                      const SizedBox(height: 14),
                      const _BncProfileSectionTitle(title: 'Support'),
                      const SizedBox(height: 8),
                      _BncSettingsActionCard(
                        icon: Icons.help_outline_rounded,
                        title: 'Help and explanations',
                        text: 'Learn how BNC discovery and business tools work.',
                        actionText: 'View',
                        onTap: () => Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => _BncEcosystemPage(
                              item: _bncEcosystem.last,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BncSettingsSheet extends StatelessWidget {
  const _BncSettingsSheet({
    required this.title,
    required this.subtitle,
    required this.child,
  });

  final String title;
  final String subtitle;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(12),
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
      decoration: BoxDecoration(
        color: brandSurface,
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: brandLine),
        boxShadow: [
          BoxShadow(
            color: brandNavy.withValues(alpha: 0.16),
            blurRadius: 28,
            offset: const Offset(0, -8),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 42,
                  height: 4,
                  decoration: BoxDecoration(
                    color: brandLine,
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                title,
                style: const TextStyle(
                  color: brandNavy,
                  fontSize: 19,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 5),
              Text(
                subtitle,
                style: const TextStyle(
                  color: brandMuted,
                  fontSize: 12,
                  height: 1.35,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 14),
              child,
            ],
          ),
        ),
      ),
    );
  }
}

class _BncSettingsTextField extends StatelessWidget {
  const _BncSettingsTextField({
    required this.controller,
    required this.label,
    required this.icon,
    this.keyboardType,
    this.obscureText = false,
  });

  final TextEditingController controller;
  final String label;
  final IconData icon;
  final TextInputType? keyboardType;
  final bool obscureText;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        obscureText: obscureText,
        style: const TextStyle(
          color: brandNavy,
          fontSize: 13.5,
          fontWeight: FontWeight.w800,
        ),
        decoration: InputDecoration(
          prefixIcon: Icon(icon, color: brandNavy, size: 20),
          labelText: label,
          labelStyle: const TextStyle(
            color: brandMuted,
            fontWeight: FontWeight.w700,
          ),
          filled: true,
          fillColor: Colors.white,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: const BorderSide(color: brandLine),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: const BorderSide(color: brandNavy, width: 1.4),
          ),
        ),
      ),
    );
  }
}

class _BncSettingsPrimaryButton extends StatelessWidget {
  const _BncSettingsPrimaryButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 48,
      child: FilledButton.icon(
        onPressed: onTap,
        icon: Icon(icon, size: 18),
        label: Text(label),
        style: FilledButton.styleFrom(
          backgroundColor: brandNavy,
          foregroundColor: Colors.white,
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w900,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
    );
  }
}

class _BncSettingsSwitchCard extends StatelessWidget {
  const _BncSettingsSwitchCard({
    required this.icon,
    required this.title,
    required this.text,
    required this.value,
    required this.onChanged,
  });

  final IconData icon;
  final String title;
  final String text;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: brandLine),
      ),
      child: Row(
        children: [
          _BncSettingsIcon(icon: icon),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: brandNavy,
                    fontSize: 14.5,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  text,
                  style: const TextStyle(
                    color: brandMuted,
                    fontSize: 11.5,
                    height: 1.25,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            activeThumbColor: brandGold,
            activeTrackColor: brandGold.withValues(alpha: 0.35),
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }
}

class _BncSettingsActionCard extends StatelessWidget {
  const _BncSettingsActionCard({
    required this.icon,
    required this.title,
    required this.text,
    required this.actionText,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String text;
  final String actionText;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(18),
          child: Ink(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: brandLine),
            ),
            child: Row(
              children: [
                _BncSettingsIcon(icon: icon),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          color: brandNavy,
                          fontSize: 14.5,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        text,
                        style: const TextStyle(
                          color: brandMuted,
                          fontSize: 11.5,
                          height: 1.25,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
                  decoration: BoxDecoration(
                    color: brandNavy,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    actionText,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10.5,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _BncSettingsIcon extends StatelessWidget {
  const _BncSettingsIcon({required this.icon});

  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 42,
      height: 42,
      decoration: BoxDecoration(
        color: const Color(0xFFEAF1FF),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Icon(icon, color: brandNavy, size: 21),
    );
  }
}

void _showBncSnack(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message),
      behavior: SnackBarBehavior.floating,
      backgroundColor: brandNavy,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
    ),
  );
}

class _BncProfileHeroCard extends StatelessWidget {
  const _BncProfileHeroCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
      ),
      child: Row(
        children: [
          Container(
            width: 58,
            height: 58,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Center(
              child: Text(
                'B',
                style: TextStyle(
                  color: brandNavy,
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'BNC Member',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 17,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                SizedBox(height: 3),
                Text(
                  'Kozhikode, Kerala',
                  style: TextStyle(
                    color: brandHeroText,
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          Icon(Icons.verified_rounded, color: brandGold, size: 24),
        ],
      ),
    );
  }
}

class _BncProfileStatsRow extends StatelessWidget {
  const _BncProfileStatsRow();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _BncProfileStat(
            value: '12',
            label: 'Saved',
            onTap: () => _openProfileDestination(context, 'Saved shops'),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _BncProfileStat(
            value: '3',
            label: 'Alerts',
            onTap: () => _openProfileDestination(context, 'Notifications'),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _BncProfileStat(
            value: '0',
            label: 'Bookings',
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const BncBookingsPage(),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _BncProfileStat extends StatelessWidget {
  const _BncProfileStat({
    required this.value,
    required this.label,
    required this.onTap,
  });

  final String value;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: brandLine),
          ),
          child: Column(
            children: [
              Text(
                value,
                style: const TextStyle(
                  color: brandNavy,
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                label,
                style: const TextStyle(
                  color: brandMuted,
                  fontSize: 10.5,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BncProfileCreateCardButton extends StatelessWidget {
  const _BncProfileCreateCardButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: brandGold,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                color: brandGold.withValues(alpha: 0.24),
                blurRadius: 18,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: const Row(
            children: [
              Icon(Icons.add_card_outlined, color: brandNavy, size: 21),
              SizedBox(width: 9),
              Expanded(
                child: Text(
                  'Create business card',
                  style: TextStyle(
                    color: brandNavy,
                    fontSize: 13.5,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              Icon(Icons.arrow_forward_rounded, color: brandNavy, size: 20),
            ],
          ),
        ),
      ),
    );
  }
}

class _BncProfileActionRow extends StatelessWidget {
  const _BncProfileActionRow();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _BncProfileActionButton(
            icon: Icons.edit_outlined,
            label: 'Edit profile',
            filled: true,
            onTap: () => _showBncSnack(
              context,
              'Edit profile will be available when login is connected.',
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _BncProfileActionButton(
            icon: Icons.share_outlined,
            label: 'Share card',
            onTap: () => _openProfileDestination(context, 'Business card'),
          ),
        ),
      ],
    );
  }
}

class _BncProfileActionButton extends StatelessWidget {
  const _BncProfileActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
    this.filled = false,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool filled;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: filled ? brandNavy : Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: filled ? brandNavy : brandLine),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: filled ? Colors.white : brandNavy, size: 18),
              const SizedBox(width: 7),
              Text(
                label,
                style: TextStyle(
                  color: filled ? Colors.white : brandNavy,
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BncProfileSectionTitle extends StatelessWidget {
  const _BncProfileSectionTitle({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: const TextStyle(
        color: brandNavy,
        fontSize: 15,
        fontWeight: FontWeight.w900,
      ),
    );
  }
}

class _BncProfileMenuCard extends StatelessWidget {
  const _BncProfileMenuCard({
    required this.icon,
    required this.title,
    required this.text,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String text;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 9),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: brandLine),
            ),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEAF1FF),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(icon, color: brandNavy, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          color: brandNavy,
                          fontSize: 13.5,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        text,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: brandMuted,
                          fontSize: 11.5,
                          height: 1.25,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right_rounded, color: brandMuted),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _BncMobileInfoCard extends StatelessWidget {
  const _BncMobileInfoCard({
    required this.icon,
    required this.title,
    required this.text,
  });

  final IconData icon;
  final String title;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: brandLine),
        ),
        child: Row(
          children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: const Color(0xFFEAF1FF),
                borderRadius: BorderRadius.circular(13),
              ),
              child: Icon(icon, color: brandNavy, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: brandNavy,
                      fontSize: 13.5,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    text,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: brandMuted,
                      fontSize: 11.5,
                      height: 1.25,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
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

class _BncSearchBox extends StatefulWidget {
  const _BncSearchBox({required this.initialQuery, required this.onSearch});

  final String initialQuery;
  final Future<void> Function(String query) onSearch;

  @override
  State<_BncSearchBox> createState() => _BncSearchBoxState();
}

class _BncSearchBoxState extends State<_BncSearchBox> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialQuery);
  }

  @override
  void didUpdateWidget(covariant _BncSearchBox oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.initialQuery != widget.initialQuery &&
        _controller.text != widget.initialQuery) {
      _controller.text = widget.initialQuery;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _submit() {
    return widget.onSearch(_controller.text.trim());
  }

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
          Expanded(
            child: TextField(
              controller: _controller,
              minLines: 1,
              maxLines: 1,
              textInputAction: TextInputAction.search,
              onSubmitted: (_) => _submit(),
              decoration: const InputDecoration(
                border: InputBorder.none,
                isDense: true,
                hintText: 'Search shops, products, services or deals',
                hintStyle: TextStyle(
                  color: brandMuted,
                  fontSize: 13.5,
                  fontWeight: FontWeight.w700,
                ),
              ),
              style: const TextStyle(
                color: brandNavy,
                fontSize: 13.5,
                fontWeight: FontWeight.w800,
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
            onPressed: _submit,
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

class _CatalogStatusBanner extends StatelessWidget {
  const _CatalogStatusBanner({
    required this.isLoading,
    required this.usingFallback,
    required this.error,
    required this.onRetry,
  });

  final bool isLoading;
  final bool usingFallback;
  final String? error;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    final text = isLoading
        ? 'Loading live catalog...'
        : usingFallback
            ? 'Live catalog unavailable. Showing saved sample data.'
            : error ?? '';

    if (text.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
      ),
      child: Row(
        children: [
          if (isLoading)
            const SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(brandGold),
              ),
            )
          else
            const Icon(Icons.cloud_off_outlined, color: brandGold, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          if (!isLoading)
            TextButton(
              onPressed: onRetry,
              style: TextButton.styleFrom(foregroundColor: brandGold),
              child: const Text(
                'Retry',
                style: TextStyle(fontWeight: FontWeight.w900),
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
      _BncHeroAction(Icons.star_rounded, 'Star shops', 'featured'),
      _BncHeroAction(Icons.track_changes_rounded, 'Best matches', 'search'),
      _BncHeroAction(Icons.card_giftcard_rounded, 'Weekly draw', 'alerts'),
      _BncHeroAction(Icons.redeem_rounded, 'Gifts', 'deals'),
    ];

    return Wrap(
      spacing: 10,
      runSpacing: 8,
      children: items.map((item) {
        return InkWell(
          onTap: () => _openHeroAction(context, item.route),
          borderRadius: BorderRadius.circular(999),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 4),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(item.icon, color: brandGold, size: 18),
                const SizedBox(width: 5),
                Text(
                  item.label,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.90),
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _BncHeroAction {
  const _BncHeroAction(this.icon, this.label, this.route);

  final IconData icon;
  final String label;
  final String route;
}

void _openHeroAction(BuildContext context, String route) {
  switch (route) {
    case 'featured':
      Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => const BncFeaturedShopsPage(),
        ),
      );
      return;
    case 'search':
      Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => const BncSearchPage(initialQuery: ''),
        ),
      );
      return;
    case 'alerts':
      _openNotificationsPage(context);
      return;
    case 'deals':
      Navigator.of(context).push(
        MaterialPageRoute<void>(builder: (_) => const BncDealsPage()),
      );
      return;
  }
}

class _BncSectionTitle extends StatelessWidget {
  const _BncSectionTitle({required this.title, this.action, this.onActionTap});

  final String title;
  final String? action;
  final VoidCallback? onActionTap;

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
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onActionTap,
              borderRadius: BorderRadius.circular(999),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      action!,
                      style: const TextStyle(
                        color: brandNavy,
                        fontSize: 12.5,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const Icon(
                      Icons.chevron_right,
                      color: brandNavy,
                      size: 18,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _BncEmptyPanel extends StatelessWidget {
  const _BncEmptyPanel({
    required this.icon,
    required this.title,
    required this.text,
  });

  final IconData icon;
  final String title;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: brandLine),
      ),
      child: Column(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: brandSoft,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: brandNavy),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: brandNavy,
              fontSize: 16,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            text,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: brandMuted,
              fontSize: 12.5,
              height: 1.35,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _BncCategorySkeleton extends StatelessWidget {
  const _BncCategorySkeleton();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 108,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: 5,
        separatorBuilder: (_, _) => const SizedBox(width: 10),
        itemBuilder: (_, _) => const SizedBox(
          width: 86,
          child: _BncSkeletonBox(borderRadius: 14),
        ),
      ),
    );
  }
}

class _BncHorizontalShopSkeleton extends StatelessWidget {
  const _BncHorizontalShopSkeleton();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 238,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: 3,
        separatorBuilder: (_, _) => const SizedBox(width: 12),
        itemBuilder: (_, _) => const SizedBox(
          width: 202,
          child: _BncSkeletonBox(borderRadius: 13),
        ),
      ),
    );
  }
}

class _BncGridSkeleton extends StatelessWidget {
  const _BncGridSkeleton();

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 0.71,
      ),
      itemCount: 4,
      itemBuilder: (_, _) => const _BncSkeletonBox(borderRadius: 13),
    );
  }
}

class _BncRankedSkeleton extends StatelessWidget {
  const _BncRankedSkeleton();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(3, (index) {
        return const Padding(
          padding: EdgeInsets.only(bottom: 10),
          child: SizedBox(
            height: 82,
            child: _BncSkeletonBox(borderRadius: 13),
          ),
        );
      }),
    );
  }
}

class _BncSkeletonBox extends StatelessWidget {
  const _BncSkeletonBox({required this.borderRadius});

  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: const Color(0xFFEFF3FA),
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(color: brandLine),
      ),
      child: const SizedBox.expand(),
    );
  }
}

class _BncCategoryRail extends StatelessWidget {
  const _BncCategoryRail({required this.items, required this.onSelected});

  final List<_BncCategorySpec> items;
  final Future<void> Function(String categorySlug) onSelected;

  @override
  Widget build(BuildContext context) {
    return _BncSlidingRail(
      height: 108,
      itemCount: items.length,
      gap: 10,
      itemBuilder: (context, index) {
        final item = items[index];
        return SizedBox(
          width: 86,
          child: _BncCategoryTile(
            item: item,
            onTap: item.slug.isEmpty
                ? null
                : () {
                    onSelected(item.slug);
                  },
          ),
        );
      },
    );
  }
}

class _BncSlidingRail extends StatefulWidget {
  const _BncSlidingRail({
    required this.height,
    required this.itemCount,
    required this.itemBuilder,
    this.gap = 12,
  });

  final double height;
  final int itemCount;
  final double gap;
  final IndexedWidgetBuilder itemBuilder;

  @override
  State<_BncSlidingRail> createState() => _BncSlidingRailState();
}

class _BncSlidingRailState extends State<_BncSlidingRail> {
  final ScrollController _controller = ScrollController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: widget.height,
      child: ListView.separated(
        controller: _controller,
        physics: const BouncingScrollPhysics(),
        scrollDirection: Axis.horizontal,
        itemCount: widget.itemCount,
        separatorBuilder: (_, _) => SizedBox(width: widget.gap),
        itemBuilder: widget.itemBuilder,
      ),
    );
  }
}

class _BncCategoryTile extends StatelessWidget {
  const _BncCategoryTile({required this.item, required this.onTap});

  final _BncCategorySpec item;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final active = item.isActive;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Ink(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
          decoration: BoxDecoration(
            color: active ? brandNavy : Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: active ? brandNavy : brandLine),
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
                  color: active
                      ? Colors.white.withValues(alpha: 0.14)
                      : item.tint,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(
                  item.icon,
                  color: active ? Colors.white : item.color,
                  size: 25,
                ),
              ),
              const SizedBox(height: 8),
              Expanded(
                child: Center(
                  child: Text(
                    item.label,
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: active ? Colors.white : brandNavy,
                      fontSize: 12,
                      height: 1.12,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BncDealRail extends StatelessWidget {
  const _BncDealRail();

  @override
  Widget build(BuildContext context) {
    return _BncSlidingRail(
      height: 158,
      itemCount: _bncDeals.length,
      itemBuilder: (context, index) {
        return SizedBox(
          width: 304,
          child: _BncDealCard(deal: _bncDeals[index]),
        );
      },
    );
  }
}

class _BncDealCard extends StatelessWidget {
  const _BncDealCard({required this.deal});

  final _BncDealSpec deal;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => BncDealsPage(initialCode: deal.code),
        ),
      ),
      child: Container(
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
      ),
    );
  }
}

class _BncFeaturedRail extends StatelessWidget {
  const _BncFeaturedRail({required this.shops});

  final List<_BncShopSpec> shops;

  @override
  Widget build(BuildContext context) {
    return _BncSlidingRail(
      height: 238,
      itemCount: shops.length,
      itemBuilder: (context, index) {
        return SizedBox(width: 202, child: _BncShopCard(shop: shops[index]));
      },
    );
  }
}

class _BncOfferRail extends StatelessWidget {
  const _BncOfferRail();

  @override
  Widget build(BuildContext context) {
    return _BncSlidingRail(
      height: 142,
      itemCount: _bncOffers.length,
      itemBuilder: (context, index) {
        return SizedBox(
          width: 248,
          child: _BncOfferCard(offer: _bncOffers[index]),
        );
      },
    );
  }
}

class _BncOfferCard extends StatelessWidget {
  const _BncOfferCard({required this.offer});

  final _BncOfferSpec offer;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => BncDealsPage(initialCode: offer.code),
        ),
      ),
      child: Container(
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
      ),
    );
  }
}

class _BncAllShopsSection extends StatefulWidget {
  const _BncAllShopsSection({
    required this.isLoadingCatalog,
    required this.activeQuery,
    required this.allCards,
    this.compact = true,
  });

  final bool isLoadingCatalog;
  final CatalogQuery activeQuery;
  final List<_BncShopSpec> allCards;
  final bool compact;

  @override
  State<_BncAllShopsSection> createState() => _BncAllShopsSectionState();
}

class _BncAllShopsSectionState extends State<_BncAllShopsSection> {
  String _selectedFilter = 'All';

  List<_BncShopSpec> get _filteredShops {
    if (_selectedFilter == 'All') {
      return widget.allCards;
    }

    if (_selectedFilter == 'Other') {
      return widget.allCards.where((shop) {
        return !_matchesShopFilter(shop, 'Restaurant') &&
            !_matchesShopFilter(shop, 'Grocery') &&
            !_matchesShopFilter(shop, 'Mobile') &&
            !_matchesShopFilter(shop, 'Beauty');
      }).toList();
    }

    return widget.allCards
        .where((shop) => _matchesShopFilter(shop, _selectedFilter))
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final shops = _filteredShops;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _BncAllShopsHeader(
          onViewAll: widget.compact
              ? () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => const BncAllShopsPage(),
                    ),
                  )
              : null,
        ),
        const SizedBox(height: 12),
        _BncFilterRail(
          selected: _selectedFilter,
          onSelected: (filter) {
            setState(() {
              _selectedFilter = filter;
            });
          },
        ),
        const SizedBox(height: 14),
        if (widget.isLoadingCatalog && widget.allCards.isEmpty)
          const _BncGridSkeleton()
        else if (shops.isEmpty)
          _BncEmptyPanel(
            icon: Icons.storefront_outlined,
            title: widget.activeQuery.query.isNotEmpty
                ? 'No results found'
                : 'No $_selectedFilter shops yet',
            text: widget.activeQuery.query.isNotEmpty
                ? 'Try another search or clear the search box.'
                : 'Matching businesses will appear here once they are added.',
          )
        else
          _BncShopGrid(shops: widget.compact ? shops.take(6).toList() : shops),
        if (widget.compact && shops.length > 6) ...[
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
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const BncAllShopsPage(),
                ),
              ),
              icon: const Icon(Icons.arrow_forward, size: 18),
              label: const Text(
                'Explore more shops',
                style: TextStyle(fontWeight: FontWeight.w900),
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _BncAllShopsHeader extends StatelessWidget {
  const _BncAllShopsHeader({required this.onViewAll});

  final VoidCallback? onViewAll;

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
        if (onViewAll != null)
          TextButton.icon(
            onPressed: onViewAll,
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
  const _BncFilterRail({
    required this.selected,
    required this.onSelected,
  });

  final String selected;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    const filters = [
      'All',
      'Restaurant',
      'Grocery',
      'Mobile',
      'Beauty',
      'Other',
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: List.generate(filters.length, (index) {
          final label = filters[index];
          final active = label == selected;
          return Padding(
            padding: EdgeInsets.only(
              right: index == filters.length - 1 ? 0 : 8,
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () => onSelected(label),
                borderRadius: BorderRadius.circular(999),
                child: Ink(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                  decoration: BoxDecoration(
                    color: active ? brandNavy : Colors.white,
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: active ? brandNavy : brandLine),
                  ),
                  child: Text(
                    label,
                    style: TextStyle(
                      color: active ? Colors.white : const Color(0xFF405474),
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}

bool _matchesShopFilter(_BncShopSpec shop, String filter) {
  final haystack = '${shop.name} ${shop.category} ${shop.description}'
      .toLowerCase();

  switch (filter) {
    case 'Restaurant':
      return haystack.contains('restaurant') ||
          haystack.contains('cafe') ||
          haystack.contains('food');
    case 'Grocery':
      return haystack.contains('grocery') ||
          haystack.contains('mart') ||
          haystack.contains('basket');
    case 'Mobile':
      return haystack.contains('mobile') ||
          haystack.contains('electronics') ||
          haystack.contains('phone');
    case 'Beauty':
      return haystack.contains('beauty') ||
          haystack.contains('salon') ||
          haystack.contains('spa');
  }

  return true;
}

class _BncShopGrid extends StatelessWidget {
  const _BncShopGrid({required this.shops, this.catalogService});

  final List<_BncShopSpec> shops;
  final CatalogService? catalogService;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 0.71,
      ),
      itemCount: shops.length,
      itemBuilder: (context, index) {
        return _BncShopCard(
          shop: shops[index],
          dense: true,
          catalogService: catalogService,
        );
      },
    );
  }
}

class _BncShopCard extends StatelessWidget {
  const _BncShopCard({
    required this.shop,
    this.dense = false,
    this.catalogService,
  });

  final _BncShopSpec shop;
  final bool dense;
  final CatalogService? catalogService;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(13),
        onTap: () => _openBusinessDetail(
          context,
          shop,
          catalogService: catalogService,
        ),
        child: Ink(
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
          child: ClipRRect(
            borderRadius: BorderRadius.circular(13),
            child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                height: dense ? 112 : 118,
                child: Stack(
              children: [
                Positioned.fill(
                  child: _AssetImageFill(
                    asset: shop.asset,
                    imageUrl: shop.imageUrl,
                    darken: true,
                  ),
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
          ),
        ),
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

class _BncPopularBusinessSection extends StatefulWidget {
  const _BncPopularBusinessSection({
    required this.isLoadingCatalog,
    required this.popularCards,
    required this.allCards,
  });

  final bool isLoadingCatalog;
  final List<_BncShopSpec> popularCards;
  final List<_BncShopSpec> allCards;

  @override
  State<_BncPopularBusinessSection> createState() =>
      _BncPopularBusinessSectionState();
}

class _BncPopularBusinessSectionState
    extends State<_BncPopularBusinessSection> {
  String _selectedFilter = 'Best Match';

  List<_BncShopSpec> get _filteredShops {
    final source = widget.allCards.isNotEmpty
        ? widget.allCards
        : widget.popularCards;

    switch (_selectedFilter) {
      case 'Most Rated':
        return [...source]..sort((left, right) {
            final ratingCompare = _ratingValue(right).compareTo(
              _ratingValue(left),
            );
            if (ratingCompare != 0) {
              return ratingCompare;
            }
            return _reviewValue(right).compareTo(_reviewValue(left));
          });
      case 'Nearby':
        return [...source]..sort(
            (left, right) =>
                _distanceValue(left).compareTo(_distanceValue(right)),
          );
      case 'Offers':
        return source.where(_hasOfferBadge).toList();
      case 'New':
        return source
            .where((shop) => shop.badge.toLowerCase().contains('new'))
            .toList();
      case 'Best Match':
      default:
        return widget.popularCards.isNotEmpty
            ? widget.popularCards
            : _sortByRating(source);
    }
  }

  String get _emptyTitle {
    switch (_selectedFilter) {
      case 'Offers':
        return 'No offers right now';
      case 'New':
        return 'No new businesses yet';
      case 'Nearby':
        return 'No nearby businesses';
      case 'Most Rated':
        return 'No rated businesses';
      default:
        return 'No popular businesses';
    }
  }

  String get _emptyText {
    switch (_selectedFilter) {
      case 'Offers':
        return 'Businesses with offer badges will appear here.';
      case 'New':
        return 'Recently added businesses will appear here.';
      case 'Nearby':
        return 'Businesses with distance details will appear here.';
      case 'Most Rated':
        return 'Businesses with ratings and reviews will appear here.';
      default:
        return 'Popular listings will appear after they are marked in admin.';
    }
  }

  @override
  Widget build(BuildContext context) {
    final shops = _filteredShops;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _BncSectionTitle(title: 'Popular businesses'),
        const SizedBox(height: 10),
        _BncRankingFilters(
          selected: _selectedFilter,
          onSelected: (filter) {
            setState(() {
              _selectedFilter = filter;
            });
          },
        ),
        const SizedBox(height: 12),
        if (widget.isLoadingCatalog && widget.popularCards.isEmpty)
          const _BncRankedSkeleton()
        else if (shops.isEmpty)
          _BncEmptyPanel(
            icon: Icons.trending_up_rounded,
            title: _emptyTitle,
            text: _emptyText,
          )
        else
          _BncRankedList(shops: _rankedSpecsFromShops(shops.take(6).toList())),
      ],
    );
  }
}

class _BncRankingFilters extends StatelessWidget {
  const _BncRankingFilters({
    required this.selected,
    required this.onSelected,
  });

  final String selected;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    const labels = ['Best Match', 'Most Rated', 'Nearby', 'Offers', 'New'];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: List.generate(labels.length, (index) {
          final label = labels[index];
          final active = label == selected;
          return Padding(
            padding: EdgeInsets.only(right: index == labels.length - 1 ? 0 : 8),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () => onSelected(label),
                borderRadius: BorderRadius.circular(999),
                child: Ink(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 13,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: active ? brandNavy : Colors.white,
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: active ? brandNavy : brandLine),
                  ),
                  child: Text(
                    label,
                    style: TextStyle(
                      color: active ? Colors.white : const Color(0xFF405474),
                      fontSize: 11.5,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}

List<_BncShopSpec> _sortByRating(List<_BncShopSpec> shops) {
  return [...shops]..sort((left, right) {
      final ratingCompare = _ratingValue(right).compareTo(_ratingValue(left));
      if (ratingCompare != 0) {
        return ratingCompare;
      }
      return _reviewValue(right).compareTo(_reviewValue(left));
    });
}

bool _hasOfferBadge(_BncShopSpec shop) {
  final badge = shop.badge.toLowerCase();
  return badge.contains('off') ||
      badge.contains('offer') ||
      badge.contains('rs') ||
      badge.contains('b1g1');
}

double _ratingValue(_BncShopSpec shop) {
  return double.tryParse(shop.rating) ?? 0;
}

int _reviewValue(_BncShopSpec shop) {
  return int.tryParse(shop.reviews.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0;
}

double _distanceValue(_BncShopSpec shop) {
  return double.tryParse(shop.distance.replaceAll(RegExp(r'[^0-9.]'), '')) ??
      double.infinity;
}

class _BncRankedList extends StatelessWidget {
  const _BncRankedList({required this.shops});

  final List<_BncRankedSpec> shops;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(shops.length, (index) {
        return Padding(
          padding: EdgeInsets.only(bottom: index == shops.length - 1 ? 0 : 10),
          child: _BncRankedCard(shop: shops[index]),
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
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(13),
        onTap: () => _openBusinessDetail(context, shop.toShopSpec()),
        child: Ink(
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
              child: _AssetImageFill(asset: shop.asset, imageUrl: shop.imageUrl),
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
        ),
      ),
    );
  }
}

extension on _BncRankedSpec {
  _BncShopSpec toShopSpec() {
    return _BncShopSpec(
      slug: slug,
      name: name,
      category: category,
      description: description,
      rating: rating,
      reviews: reviews,
      distance: distance,
      asset: asset,
      imageUrl: imageUrl,
      badge: rank == 1 ? 'Top Rated' : 'Popular',
      badgeColor: rank == 1 ? const Color(0xFFD94842) : const Color(0xFFF4A51C),
      isPopular: true,
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
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 1.05,
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
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) => item.title == 'Doctor Booking'
                ? const BncDoctorBookingPage()
                : _BncEcosystemPage(item: item),
          ),
        ),
        child: Ink(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: brandLine),
            boxShadow: const [
              BoxShadow(
                color: Color(0x0C08204A),
                blurRadius: 12,
                offset: Offset(0, 5),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: const Color(0xFFEDF3FF),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(item.icon, color: brandNavy, size: 24),
                  ),
                  const Spacer(),
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: brandLine),
                    ),
                    child: const Icon(
                      Icons.chevron_right,
                      color: brandNavy,
                      size: 17,
                    ),
                  ),
                ],
              ),
              const Spacer(),
              Text(
                item.title,
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
                item.text,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: brandMuted,
                  fontSize: 10.5,
                  height: 1.2,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BncMobileFooter extends StatefulWidget {
  const _BncMobileFooter();

  @override
  State<_BncMobileFooter> createState() => _BncMobileFooterState();
}

class _BncMobileFooterState extends State<_BncMobileFooter> {
  final TextEditingController _emailController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  void _subscribe() {
    final email = _emailController.text.trim();
    final validEmail = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          validEmail
              ? 'Subscribed with $email'
              : 'Please enter a valid email address.',
        ),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

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
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.16),
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: TextField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.done,
                    onSubmitted: (_) => _subscribe(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                    decoration: InputDecoration(
                      hintText: 'Enter your email',
                      hintStyle: TextStyle(
                        color: Colors.white.withValues(alpha: 0.52),
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                      border: InputBorder.none,
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 12,
                      ),
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
                onPressed: _subscribe,
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
  const _AssetImageFill({
    required this.asset,
    this.imageUrl = '',
    this.darken = false,
  });

  final String asset;
  final String imageUrl;
  final bool darken;

  @override
  Widget build(BuildContext context) {
    final remoteUrl = _catalogImageUrl(imageUrl);

    return Stack(
      fit: StackFit.expand,
      children: [
        if (remoteUrl.isNotEmpty)
          Image.network(
            remoteUrl,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) {
              return _FallbackAssetImage(asset: asset);
            },
          )
        else
          _FallbackAssetImage(asset: asset),
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

class _FallbackAssetImage extends StatelessWidget {
  const _FallbackAssetImage({required this.asset});

  final String asset;

  @override
  Widget build(BuildContext context) {
    return Image.asset(
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
    );
  }
}

String _catalogImageUrl(String imageUrl) {
  final trimmed = imageUrl.trim();
  if (trimmed.isEmpty) {
    return '';
  }

  final uri = Uri.tryParse(trimmed);
  if (uri == null) {
    return '';
  }

  if (uri.hasScheme) {
    return trimmed;
  }

  if (trimmed.startsWith('/mockup/') || trimmed.startsWith('mockup/')) {
    return '';
  }

  if (!trimmed.startsWith('/')) {
    return '';
  }

  return catalogApiUri(trimmed).toString();
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
    return GestureDetector(
      onTap: () => _openNotificationsPage(context),
      child: Stack(
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
      ),
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
      _NavItemData(Icons.notifications_none_rounded, 'Alerts', false),
      _NavItemData(Icons.calendar_today_outlined, 'Bookings', false),
      _NavItemData(Icons.person_outline, 'Profile', false),
    ];

    return Container(
      padding: const EdgeInsets.fromLTRB(10, 10, 10, 14),
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
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: () => _openBottomNavPage(context, data.label),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 2),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Icon(
                  data.icon,
                  color: data.active ? brandNavy : brandMuted,
                  size: 23,
                ),
                if (data.label == 'Alerts')
                  Positioned(
                    right: -5,
                    top: -5,
                    child: Container(
                      width: 15,
                      height: 15,
                      decoration: const BoxDecoration(
                        color: brandGold,
                        shape: BoxShape.circle,
                      ),
                      child: const Center(
                        child: Text(
                          '3',
                          style: TextStyle(
                            color: brandNavy,
                            fontSize: 8,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 7),
            Text(
              data.label,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: data.active ? brandNavy : brandMuted,
                fontSize: 10.5,
                fontWeight: data.active ? FontWeight.w800 : FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

void _openBottomNavPage(BuildContext context, String label) {
  Widget? page;

  switch (label) {
    case 'Home':
      Navigator.of(context).popUntil((route) => route.isFirst);
      return;
    case 'Search':
      page = const BncSearchPage(initialQuery: '');
      break;
    case 'Deals':
      page = const BncDealsPage();
      break;
    case 'Alerts':
      page = const BncNotificationsPage();
      break;
    case 'Bookings':
      page = const BncBookingsPage();
      break;
    case 'Profile':
      page = const BncProfilePage();
      break;
  }

  if (page == null) {
    return;
  }

  Navigator.of(context).push(
    MaterialPageRoute<void>(builder: (_) => page!),
  );
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
      final haystack = '${item.categoryName} ${item.shortDescription} ${item.name}'
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

Color _colorFromHex(String? hex, [Color fallback = const Color(0xFF7183A6)]) {
  final cleaned = (hex ?? '').replaceAll('#', '').trim();
  final normalized = cleaned.length == 6 ? 'FF$cleaned' : cleaned;
  final value = int.tryParse(normalized, radix: 16);
  return value == null ? fallback : Color(value);
}

IconData _iconForSlug(String slug) {
  return switch (slug) {
    'shopping-cart' => Icons.shopping_cart_checkout_outlined,
    'utensils-crossed' => Icons.restaurant_outlined,
    'scissors' => Icons.content_cut_outlined,
    'sparkles' => Icons.auto_awesome_outlined,
    'monitor-smartphone' => Icons.devices_other_outlined,
    'house-plus' => Icons.home_repair_service_outlined,
    'bakery-sweets' => Icons.cake_outlined,
    'pharmacy' => Icons.local_pharmacy_outlined,
    'gifts-stationery' => Icons.card_giftcard_outlined,
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
