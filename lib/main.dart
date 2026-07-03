import 'dart:async';

import 'package:flutter/material.dart';

import 'src/catalog_models.dart';
import 'src/catalog_seed.dart';
import 'src/catalog_service.dart';

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
const categoryPalette = [brandGold, brandNavy, brandGoldDeep, brandNavyBright];

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
  bool _isSyncing = true;
  bool _usingFallback = false;
  DateTime? _lastSynced;

  @override
  void initState() {
    super.initState();
    _refreshCatalog();
  }

  Future<void> _refreshCatalog() async {
    if (mounted) {
      setState(() {
        _isSyncing = true;
      });
    }

    try {
      final catalog = await _catalogService.fetchCatalog();
      if (!mounted) {
        return;
      }

      setState(() {
        _catalog = catalog;
        _isSyncing = false;
        _usingFallback = false;
        _lastSynced = DateTime.now();
      });
    } catch (_) {
      if (!mounted) {
        return;
      }

      setState(() {
        _catalog = fallbackCatalog;
        _isSyncing = false;
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
          isSyncing: _isSyncing,
          usingFallback: _usingFallback,
          lastSynced: _lastSynced,
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
    required this.isSyncing,
    required this.usingFallback,
    required this.lastSynced,
    required this.onRefresh,
    required this.showPreviewChrome,
  });

  final CatalogData catalog;
  final bool isSyncing;
  final bool usingFallback;
  final DateTime? lastSynced;
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
                        isSyncing: isSyncing,
                        usingFallback: usingFallback,
                        lastSynced: lastSynced,
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
    required this.isSyncing,
    required this.usingFallback,
    required this.lastSynced,
    required this.onRefresh,
    required this.showPreviewChrome,
  });

  final CatalogData catalog;
  final bool isSyncing;
  final bool usingFallback;
  final DateTime? lastSynced;
  final Future<void> Function() onRefresh;
  final bool showPreviewChrome;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [brandNavyDeep, brandNavy],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Padding(
        padding: EdgeInsets.fromLTRB(20, showPreviewChrome ? 14 : 10, 20, 42),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (showPreviewChrome) ...[
              const _StatusRow(),
              const SizedBox(height: 14),
            ],
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
            const SizedBox(height: 12),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _SyncChip(
                        isSyncing: isSyncing,
                        usingFallback: usingFallback,
                      ),
                      if (lastSynced != null && !isSyncing)
                        _InfoChip(label: _formatTime(lastSynced!)),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                _RefreshButton(onTap: onRefresh),
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
                const _HeroGraphic(),
              ],
            ),
            const SizedBox(height: 16),
            _SearchBar(onTap: onRefresh),
            const SizedBox(height: 14),
            _StatsPanel(stats: catalog.stats),
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

class _StatusRow extends StatelessWidget {
  const _StatusRow();

  @override
  Widget build(BuildContext context) {
    return const Row(
      children: [
        Text(
          '9:41',
          style: TextStyle(
            color: Colors.white,
            fontSize: 19,
            fontWeight: FontWeight.w800,
          ),
        ),
        Spacer(),
        _DynamicIsland(),
        Spacer(),
        Icon(Icons.signal_cellular_alt, color: Colors.white, size: 18),
        SizedBox(width: 8),
        Icon(Icons.wifi, color: Colors.white, size: 18),
        SizedBox(width: 8),
        Icon(Icons.battery_full, color: Colors.white, size: 20),
      ],
    );
  }
}

class _DynamicIsland extends StatelessWidget {
  const _DynamicIsland();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 120,
      height: 34,
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Align(
        alignment: Alignment.centerRight,
        child: Container(
          width: 24,
          height: 24,
          margin: const EdgeInsets.only(right: 12),
          decoration: const BoxDecoration(
            color: Color(0xFF111C2A),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.camera_alt,
            size: 12,
            color: Color(0xFF20418C),
          ),
        ),
      ),
    );
  }
}

class _SyncChip extends StatelessWidget {
  const _SyncChip({required this.isSyncing, required this.usingFallback});

  final bool isSyncing;
  final bool usingFallback;

  @override
  Widget build(BuildContext context) {
    final background = isSyncing
        ? Colors.white.withValues(alpha: 0.12)
        : usingFallback
        ? const Color(0x33FF8A65)
        : const Color(0x3327D07D);

    final iconColor = isSyncing
        ? const Color(0xFFFFE4A6)
        : usingFallback
        ? const Color(0xFFFFC0A9)
        : const Color(0xFFB8FFD8);

    final label = isSyncing
        ? 'Syncing server...'
        : usingFallback
        ? 'Offline fallback'
        : 'Server connected';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (isSyncing)
            const SizedBox(
              width: 12,
              height: 12,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation(Color(0xFFFFE4A6)),
              ),
            )
          else
            Icon(Icons.cloud_done_rounded, size: 14, color: iconColor),
          const SizedBox(width: 8),
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.92),
              fontSize: 11.5,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: Colors.white.withValues(alpha: 0.85),
          fontSize: 11.5,
          fontWeight: FontWeight.w600,
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

class _RefreshButton extends StatelessWidget {
  const _RefreshButton({required this.onTap});

  final Future<void> Function() onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: () => onTap(),
      child: Container(
        width: 42,
        height: 42,
        decoration: BoxDecoration(
          color: const Color(0x26FFBE2E),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0x40FFBE2E)),
        ),
        child: const Icon(
          Icons.refresh_rounded,
          size: 20,
          color: Color(0xFFFFD670),
        ),
      ),
    );
  }
}

class _HeroGraphic extends StatelessWidget {
  const _HeroGraphic();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 124,
      height: 132,
      child: Stack(
        children: [
          Positioned(
            left: 4,
            right: 0,
            bottom: 4,
            child: Container(
              height: 34,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(999),
                gradient: LinearGradient(
                  colors: [
                    Colors.white.withValues(alpha: 0.10),
                    brandNavyBright.withValues(alpha: 0.40),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            right: -8,
            bottom: 8,
            child: Transform.scale(scale: 0.84, child: const _PinBagArt()),
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

class _PinBagArt extends StatelessWidget {
  const _PinBagArt();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 145,
      height: 110,
      child: Stack(
        children: [
          Positioned(
            left: 10,
            right: 0,
            bottom: 0,
            child: Container(
              height: 34,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(999),
                gradient: const LinearGradient(
                  colors: [Color(0xFF1D4B9E), Color(0xFF275CB7)],
                ),
              ),
            ),
          ),
          Positioned(
            left: 32,
            bottom: 28,
            child: CustomPaint(
              size: const Size(54, 76),
              painter: _PinPainter(),
            ),
          ),
          Positioned(
            right: 22,
            bottom: 25,
            child: Container(
              width: 46,
              height: 58,
              decoration: BoxDecoration(
                color: brandGold,
                borderRadius: BorderRadius.circular(8),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x441A0E00),
                    blurRadius: 10,
                    offset: Offset(0, 6),
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            right: 30,
            top: 18,
            child: Container(
              width: 24,
              height: 18,
              decoration: BoxDecoration(
                border: Border.all(color: const Color(0xFF153F8E), width: 3),
                borderRadius: BorderRadius.circular(999),
              ),
            ),
          ),
          Positioned(
            right: 78,
            bottom: 18,
            child: Container(
              width: 18,
              height: 18,
              decoration: BoxDecoration(
                color: const Color(0xFFC58A35),
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
          Positioned(
            right: 64,
            bottom: 32,
            child: Container(
              width: 14,
              height: 14,
              decoration: BoxDecoration(
                color: const Color(0xFFD5A04A),
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
          Positioned(
            right: 0,
            bottom: 16,
            child: Container(
              width: 18,
              height: 26,
              decoration: BoxDecoration(
                color: const Color(0xFF6CB63A),
                borderRadius: BorderRadius.circular(6),
              ),
            ),
          ),
        ],
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

class _StatsPanel extends StatelessWidget {
  const _StatsPanel({required this.stats});

  final CatalogStats stats;

  @override
  Widget build(BuildContext context) {
    final items = [
      _StatItem(
        Icons.dashboard_customize_outlined,
        _formatCount(stats.categories),
        'Categories',
      ),
      _StatItem(
        Icons.storefront_outlined,
        _formatCount(stats.businesses),
        'Shops & Pros',
      ),
      _StatItem(
        Icons.sentiment_satisfied_alt_outlined,
        stats.happyUsers,
        'Happy Users',
      ),
      _StatItem(
        Icons.verified_user_outlined,
        _formatCount(stats.trusted),
        'Trusted Pros',
      ),
    ];

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
      ),
      child: Row(
        children: List.generate(items.length, (index) {
          final item = items[index];
          return Expanded(
            child: Row(
              children: [
                if (index != 0)
                  Container(
                    width: 1,
                    height: 38,
                    margin: const EdgeInsets.only(right: 12),
                    color: Colors.white.withValues(alpha: 0.16),
                  ),
                Expanded(child: _StatCell(item: item)),
              ],
            ),
          );
        }),
      ),
    );
  }
}

class _StatCell extends StatelessWidget {
  const _StatCell({required this.item});

  final _StatItem item;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(item.icon, color: brandGold, size: 24),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                item.value,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w900,
                ),
              ),
              Text(
                item.label,
                style: const TextStyle(
                  color: brandHeroText,
                  fontSize: 12,
                  height: 1.2,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ContentSection extends StatelessWidget {
  const _ContentSection({required this.catalog});

  final CatalogData catalog;

  @override
  Widget build(BuildContext context) {
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
            _CategoryRail(categories: catalog.categories),
            const SizedBox(height: 18),
            const _SegmentControl(),
            const SizedBox(height: 18),
            const _DealBanner(),
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
              right: index == categories.length - 1 ? 0 : 12,
            ),
            child: _CategoryCard(category: category, index: index),
          );
        }),
      ),
    );
  }
}

class _CategoryCard extends StatelessWidget {
  const _CategoryCard({required this.category, required this.index});

  final CategoryItem category;
  final int index;

  @override
  Widget build(BuildContext context) {
    final accentColor = categoryPalette[index % categoryPalette.length];
    final iconColor = category.isActive ? Colors.white : accentColor;
    final backgroundColor = category.isActive
        ? brandNavy
        : accentColor.withValues(alpha: 0.12);

    return Container(
      width: 98,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 16),
      decoration: BoxDecoration(
        color: brandSurface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: brandLine),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0F08204A),
            blurRadius: 18,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: backgroundColor,
              borderRadius: BorderRadius.circular(18),
            ),
            child: Icon(
              _iconForSlug(category.icon),
              color: iconColor,
              size: 28,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            category.name,
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: brandNavy,
              fontSize: 14,
              height: 1.15,
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
      padding: const EdgeInsets.all(5),
      decoration: BoxDecoration(
        color: brandSoft,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: brandLine),
      ),
      child: Row(
        children: [
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 14),
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
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 14),
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
  const _DealBanner();

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
          const SizedBox(width: 8),
          const _GiftArt(),
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

class _GiftArt extends StatelessWidget {
  const _GiftArt();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 130,
      height: 92,
      child: Stack(
        children: [
          Positioned(
            left: 38,
            bottom: 0,
            child: Container(
              width: 52,
              height: 50,
              decoration: BoxDecoration(
                color: brandGold,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
          Positioned(
            left: 59,
            bottom: 0,
            child: Container(width: 10, height: 50, color: brandGoldDeep),
          ),
          Positioned(
            left: 38,
            bottom: 20,
            child: Container(width: 52, height: 10, color: brandGoldDeep),
          ),
          Positioned(
            left: 44,
            top: 8,
            child: Container(
              width: 18,
              height: 18,
              decoration: BoxDecoration(
                border: Border.all(color: brandGoldDeep, width: 5),
                borderRadius: BorderRadius.circular(999),
              ),
            ),
          ),
          Positioned(
            left: 66,
            top: 8,
            child: Container(
              width: 18,
              height: 18,
              decoration: BoxDecoration(
                border: Border.all(color: const Color(0xFFF35D24), width: 5),
                borderRadius: BorderRadius.circular(999),
              ),
            ),
          ),
          Positioned(
            right: 6,
            bottom: 0,
            child: Container(
              width: 34,
              height: 46,
              decoration: BoxDecoration(
                color: const Color(0xFF163F8E),
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
          Positioned(
            right: 13,
            top: 10,
            child: Container(
              width: 20,
              height: 10,
              decoration: BoxDecoration(
                border: Border.all(color: const Color(0xFF163F8E), width: 3),
                borderRadius: BorderRadius.circular(999),
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

class _PinPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..shader = const LinearGradient(
        colors: [Color(0xFFFFD14D), Color(0xFFF1A900)],
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
      ).createShader(Offset.zero & size);

    final path = Path()
      ..moveTo(size.width * 0.5, size.height)
      ..quadraticBezierTo(
        size.width * 0.84,
        size.height * 0.58,
        size.width * 0.84,
        size.height * 0.33,
      )
      ..arcToPoint(
        Offset(size.width * 0.16, size.height * 0.33),
        radius: Radius.circular(size.width * 0.34),
      )
      ..quadraticBezierTo(
        size.width * 0.16,
        size.height * 0.58,
        size.width * 0.5,
        size.height,
      );

    canvas.drawPath(path, paint);
    canvas.drawCircle(
      Offset(size.width * 0.5, size.height * 0.34),
      size.width * 0.14,
      Paint()..color = brandNavy,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _StatItem {
  const _StatItem(this.icon, this.value, this.label);

  final IconData icon;
  final String value;
  final String label;
}

class _NavItemData {
  const _NavItemData(this.icon, this.label, this.active);

  final IconData icon;
  final String label;
  final bool active;
}

String _formatCount(int count) {
  if (count >= 1000) {
    final formatted = count >= 10000
        ? (count / 1000).toStringAsFixed(0)
        : (count / 1000).toStringAsFixed(1);
    return '${formatted}K+';
  }

  return '$count+';
}

String _formatTime(DateTime time) {
  final hour = time.hour == 0
      ? 12
      : (time.hour > 12 ? time.hour - 12 : time.hour);
  final minute = time.minute.toString().padLeft(2, '0');
  final period = time.hour >= 12 ? 'PM' : 'AM';
  return '$hour:$minute $period';
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
