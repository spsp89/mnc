import 'package:flutter/material.dart';

void main() {
  runApp(const NearuApp());
}

class NearuApp extends StatelessWidget {
  const NearuApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Nearu',
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFFF5F7FB),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFFFBE2E),
          brightness: Brightness.light,
        ),
        fontFamily: 'Segoe UI',
      ),
      home: const NearuHomePage(),
    );
  }
}

class NearuHomePage extends StatelessWidget {
  const NearuHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final usePreviewShell = constraints.maxWidth > 500;
        final phoneWidth = usePreviewShell ? 430.0 : constraints.maxWidth;

        Widget screen = _MobileHomeScreen(shellMode: usePreviewShell);

        if (usePreviewShell) {
          screen = Center(
            child: Container(
              width: phoneWidth,
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
          backgroundColor: usePreviewShell
              ? const Color(0xFFF1F4FA)
              : const Color(0xFFF5F7FB),
          body: SafeArea(top: !usePreviewShell, bottom: false, child: screen),
        );
      },
    );
  }
}

class _MobileHomeScreen extends StatelessWidget {
  const _MobileHomeScreen({required this.shellMode});

  final bool shellMode;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: Column(
                  children: [
                    _HeroSection(shellMode: shellMode),
                    Transform.translate(
                      offset: const Offset(0, -28),
                      child: const _ContentSection(),
                    ),
                  ],
                ),
              ),
            ],
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
  const _HeroSection({required this.shellMode});

  final bool shellMode;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF041B4A), Color(0xFF0C2E72)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Padding(
        padding: EdgeInsets.fromLTRB(22, shellMode ? 8 : 14, 22, 48),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const _StatusRow(),
            const SizedBox(height: 16),
            const Row(
              children: [
                Icon(Icons.location_on, color: Colors.white, size: 23),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Kozhikode, Kerala',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                Icon(Icons.keyboard_arrow_down, color: Colors.white, size: 22),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _titleLine('Discover'),
                      _titleLine('the best'),
                      const SizedBox(height: 6),
                      _highlightLine('products & services'),
                      _highlightLine('near you', showPin: true),
                      const SizedBox(height: 18),
                      const Text(
                        'From local favorites to trusted professionals -',
                        style: TextStyle(
                          color: Color(0xFFE7EEFF),
                          fontSize: 15,
                          height: 1.45,
                        ),
                      ),
                      const Text(
                        'everything you need, all in one place.',
                        style: TextStyle(
                          color: Color(0xFFE7EEFF),
                          fontSize: 15,
                          height: 1.45,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                const _HeroGraphic(),
              ],
            ),
            const SizedBox(height: 22),
            const _SearchBar(),
            const SizedBox(height: 16),
            const _StatsPanel(),
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
            fontSize: 36,
            height: 0.95,
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
                color: Color(0xFFFFBE2E),
                fontSize: 32,
                height: 0.98,
                fontWeight: FontWeight.w900,
              ),
            ),
            if (showPin) ...[
              const SizedBox(width: 4),
              const Icon(Icons.location_on, color: Color(0xFFFFBE2E), size: 25),
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
    return Row(
      children: [
        const Text(
          '9:41',
          style: TextStyle(
            color: Colors.white,
            fontSize: 19,
            fontWeight: FontWeight.w800,
          ),
        ),
        const Spacer(),
        Container(
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
        ),
        const Spacer(),
        const Icon(Icons.signal_cellular_alt, color: Colors.white, size: 18),
        const SizedBox(width: 8),
        const Icon(Icons.wifi, color: Colors.white, size: 18),
        const SizedBox(width: 8),
        const Icon(Icons.battery_full, color: Colors.white, size: 20),
      ],
    );
  }
}

class _HeroGraphic extends StatelessWidget {
  const _HeroGraphic();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 158,
      height: 180,
      child: Stack(
        children: [
          Positioned(
            right: 0,
            top: 0,
            child: Row(
              children: [
                Stack(
                  clipBehavior: Clip.none,
                  children: [
                    const Icon(
                      Icons.notifications_none,
                      color: Colors.white,
                      size: 31,
                    ),
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
                const SizedBox(width: 12),
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.3),
                    ),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: Image.network(
                      profileImageUrl,
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
                ),
              ],
            ),
          ),
          const Positioned(right: 6, bottom: 18, child: _PinBagArt()),
        ],
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
                color: const Color(0xFFFFBE2E),
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
  const _SearchBar();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Row(
        children: [
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 12),
            child: Icon(Icons.search, color: Color(0xFF7082A3), size: 30),
          ),
          const Expanded(
            child: Text(
              'Search products, shops or services',
              style: TextStyle(
                color: Color(0xFF7082A3),
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 18),
            decoration: BoxDecoration(
              color: const Color(0xFFFFBE2E),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Text(
              'Search',
              style: TextStyle(
                color: Color(0xFF102C60),
                fontSize: 16,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatsPanel extends StatelessWidget {
  const _StatsPanel();

  @override
  Widget build(BuildContext context) {
    const items = [
      _StatItem(Icons.dashboard_customize_outlined, '320+', 'Categories'),
      _StatItem(Icons.storefront_outlined, '1.2K+', 'Shops & Pros'),
      _StatItem(Icons.sentiment_satisfied_alt_outlined, '10K+', 'Happy Users'),
      _StatItem(Icons.verified_user_outlined, 'Trusted', '& Verified'),
    ];

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
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
        Icon(item.icon, color: const Color(0xFFFFBE2E), size: 24),
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
                  color: Color(0xFFD7E2FF),
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
  const _ContentSection();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 18, 16, 110),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const _CategoryRow(),
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
                itemCount: featuredBusinesses.length,
                separatorBuilder: (_, _) => const SizedBox(width: 12),
                itemBuilder: (context, index) =>
                    _FeaturedCard(data: featuredBusinesses[index]),
              ),
            ),
            const SizedBox(height: 20),
            const _SectionHeader(title: 'Popular near you'),
            const SizedBox(height: 12),
            const _FilterChips(),
            const SizedBox(height: 14),
            Column(
              children: List.generate(
                popularBusinesses.length,
                (index) => Padding(
                  padding: EdgeInsets.only(
                    bottom: index == popularBusinesses.length - 1 ? 0 : 12,
                  ),
                  child: _PopularCard(data: popularBusinesses[index]),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CategoryRow extends StatelessWidget {
  const _CategoryRow();

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
            child: _CategoryCard(data: category),
          );
        }),
      ),
    );
  }
}

class _CategoryCard extends StatelessWidget {
  const _CategoryCard({required this.data});

  final _CategoryData data;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 84,
      child: Column(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: data.active
                  ? const Color(0xFF0B285E)
                  : data.color.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(
              data.icon,
              color: data.active ? Colors.white : data.color,
              size: 28,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            data.label,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Color(0xFF0B285E),
              fontSize: 13,
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
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: const Color(0xFFF5F7FB),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0xFFE5EBF3)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                color: const Color(0xFF07245D),
                borderRadius: BorderRadius.circular(999),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.shopping_bag_outlined,
                    color: Colors.white,
                    size: 20,
                  ),
                  SizedBox(width: 8),
                  Text(
                    'Products',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
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
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.handyman_outlined,
                    color: Color(0xFF7082A3),
                    size: 20,
                  ),
                  SizedBox(width: 8),
                  Text(
                    'Services',
                    style: TextStyle(
                      color: Color(0xFF7082A3),
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
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
      padding: const EdgeInsets.fromLTRB(18, 18, 12, 18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: const LinearGradient(
          colors: [Color(0xFFFFF7E8), Color(0xFFFFF2D7), Color(0xFFFFF8EC)],
        ),
        border: Border.all(color: const Color(0xFFF4DF9F)),
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
                    color: Color(0xFF0B285E),
                    fontSize: 22,
                    height: 1.05,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                SizedBox(height: 10),
                Text(
                  'Exclusive offers on top products\n& services near you.',
                  style: TextStyle(
                    color: Color(0xFF38517B),
                    fontSize: 15,
                    height: 1.45,
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
            style: const TextStyle(
              color: Color(0xFF0B285E),
              fontSize: 18,
              fontWeight: FontWeight.w900,
            ),
          ),
        ),
        if (action != null)
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                action!,
                style: const TextStyle(
                  color: Color(0xFF7082A3),
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(width: 4),
              const Icon(Icons.chevron_right, color: Color(0xFF7082A3)),
            ],
          ),
      ],
    );
  }
}

class _FeaturedCard extends StatelessWidget {
  const _FeaturedCard({required this.data});

  final _BusinessData data;

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
                    child: _BusinessPhoto(data: data, showDarkOverlay: true),
                  ),
                  if (data.badge != null)
                    Positioned(
                      left: 10,
                      top: 10,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: data.badgeColor,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          data.badge!,
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
                    color: Color(0xFF0B285E),
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${data.category} - ${data.location}',
                  style: const TextStyle(
                    color: Color(0xFF7082A3),
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 10,
                  runSpacing: 6,
                  children: [
                    _MetaPill(
                      icon: Icons.star,
                      color: const Color(0xFFFFB11B),
                      text: '${data.rating} (${data.reviews})',
                    ),
                    _MetaPill(
                      icon: Icons.location_on_outlined,
                      color: const Color(0xFF7C8CAB),
                      text: data.distance,
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
  const _FilterChips();

  @override
  Widget build(BuildContext context) {
    const labels = [
      'All',
      'Restaurants',
      'Grocery',
      'Beauty',
      'Tailors',
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
                color: active
                    ? const Color(0xFF07245D)
                    : const Color(0xFFF4F7FC),
                borderRadius: BorderRadius.circular(999),
                border: label == 'Filters'
                    ? Border.all(color: const Color(0xFFE1E7F1))
                    : null,
              ),
              child: Row(
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      color: active ? Colors.white : const Color(0xFF223A67),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  if (label == 'Filters') ...[
                    const SizedBox(width: 8),
                    const Icon(Icons.tune, size: 18, color: Color(0xFF223A67)),
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

  final _BusinessData data;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE6ECF4)),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: SizedBox(
              width: 88,
              height: 78,
              child: _BusinessPhoto(data: data),
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
                          color: Color(0xFF0B285E),
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    const Icon(
                      Icons.favorite_border,
                      color: Color(0xFF7082A3),
                      size: 20,
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  data.category,
                  style: const TextStyle(
                    color: Color(0xFF7082A3),
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 10,
                  runSpacing: 6,
                  children: [
                    _MetaPill(
                      icon: Icons.star,
                      color: const Color(0xFFFFB11B),
                      text: '${data.rating} (${data.reviews})',
                    ),
                    _MetaPill(
                      icon: Icons.location_on_outlined,
                      color: const Color(0xFF7C8CAB),
                      text: data.distance,
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
        Text(
          text,
          style: const TextStyle(color: Color(0xFF5D6F92), fontSize: 13),
        ),
      ],
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
        color: const Color(0xFF0B285E),
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
                color: const Color(0xFFFFBE2E),
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
          Positioned(
            left: 59,
            bottom: 0,
            child: Container(
              width: 10,
              height: 50,
              color: const Color(0xFFF35D24),
            ),
          ),
          Positioned(
            left: 38,
            bottom: 20,
            child: Container(
              width: 52,
              height: 10,
              color: const Color(0xFFF35D24),
            ),
          ),
          Positioned(
            left: 44,
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
        Icon(
          data.icon,
          color: data.active
              ? const Color(0xFF07245D)
              : const Color(0xFF7A8AA8),
          size: 26,
        ),
        const SizedBox(height: 8),
        Text(
          data.label,
          textAlign: TextAlign.center,
          style: TextStyle(
            color: data.active
                ? const Color(0xFF07245D)
                : const Color(0xFF7A8AA8),
            fontSize: 12,
            fontWeight: data.active ? FontWeight.w800 : FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

class _BusinessArt extends StatelessWidget {
  const _BusinessArt({required this.variant});

  final String variant;

  @override
  Widget build(BuildContext context) {
    switch (variant) {
      case 'plate':
        return Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF24160D), Color(0xFF5A4638)],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
          ),
          child: Center(
            child: Container(
              width: 104,
              height: 60,
              decoration: BoxDecoration(
                color: const Color(0xFFDDE5E7),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  _circle(34, 22, const Color(0xFFD18C47)),
                  _circle(52, 16, const Color(0xFFDDA252)),
                  _circle(68, 25, const Color(0xFFBB773F)),
                  Positioned(
                    top: 34,
                    child: Container(
                      width: 42,
                      height: 12,
                      decoration: BoxDecoration(
                        color: const Color(0xFF7BAF4D),
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      case 'suit':
        return Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF18100A), Color(0xFF59442F)],
            ),
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              Positioned(
                top: 16,
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: const BoxDecoration(
                    color: Color(0xFFD5B189),
                    shape: BoxShape.circle,
                  ),
                ),
              ),
              Positioned(
                top: 46,
                child: Container(
                  width: 78,
                  height: 66,
                  decoration: BoxDecoration(
                    color: const Color(0xFF0B1C38),
                    borderRadius: BorderRadius.circular(18),
                  ),
                ),
              ),
              Positioned(
                top: 54,
                child: Container(width: 12, height: 56, color: Colors.white),
              ),
            ],
          ),
        );
      case 'basket':
        return Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF4D3118), Color(0xFF7B5730)],
            ),
          ),
          child: Center(
            child: Container(
              width: 110,
              height: 56,
              decoration: BoxDecoration(
                color: const Color(0xFFB67B37),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Stack(
                children: [
                  _fruit(12, 10, const Color(0xFFE44F40)),
                  _fruit(34, 8, const Color(0xFFFFB92E)),
                  _fruit(56, 10, const Color(0xFF77C14A)),
                  _fruit(78, 10, const Color(0xFFEADA4D)),
                  _fruit(50, 22, const Color(0xFFDA8F48)),
                ],
              ),
            ),
          ),
        );
      case 'salon':
        return Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF433126), Color(0xFF705944)],
            ),
          ),
          child: Stack(
            children: [
              Positioned(
                left: 14,
                right: 14,
                bottom: 12,
                child: Container(
                  height: 40,
                  decoration: BoxDecoration(
                    color: const Color(0xFF241C17),
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
              Positioned(
                left: 32,
                top: 12,
                child: Container(
                  width: 40,
                  height: 62,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF0CCA0),
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ],
          ),
        );
      case 'shelf':
        return Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFFDDB26E), Color(0xFFB77C2E)],
            ),
          ),
          child: CustomPaint(painter: _ShelfPainter()),
        );
      case 'phone':
        return Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF06111A), Color(0xFF1F447A)],
            ),
          ),
          child: Center(
            child: Transform.rotate(
              angle: -0.35,
              child: Container(
                width: 30,
                height: 58,
                decoration: BoxDecoration(
                  color: const Color(0xFF13243D),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.white70),
                ),
              ),
            ),
          ),
        );
      case 'worker':
        return Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF447AA5), Color(0xFF0A2D5E)],
            ),
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              Positioned(
                top: 12,
                child: Container(
                  width: 32,
                  height: 32,
                  decoration: const BoxDecoration(
                    color: Color(0xFFD8B18B),
                    shape: BoxShape.circle,
                  ),
                ),
              ),
              Positioned(
                top: 38,
                child: Container(
                  width: 54,
                  height: 46,
                  decoration: BoxDecoration(
                    color: const Color(0xFF123661),
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
            ],
          ),
        );
      default:
        return Container(color: const Color(0xFF173152));
    }
  }

  Widget _circle(double left, double top, Color color) {
    return Positioned(
      left: left,
      top: top,
      child: Container(
        width: 20,
        height: 20,
        decoration: BoxDecoration(color: color, shape: BoxShape.circle),
      ),
    );
  }

  Widget _fruit(double left, double top, Color color) {
    return Positioned(
      left: left,
      top: top,
      child: Container(
        width: 22,
        height: 22,
        decoration: BoxDecoration(color: color, shape: BoxShape.circle),
      ),
    );
  }
}

class _BusinessPhoto extends StatelessWidget {
  const _BusinessPhoto({required this.data, this.showDarkOverlay = false});

  final _BusinessData data;
  final bool showDarkOverlay;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        _BusinessArt(variant: data.variant),
        Image.network(
          data.imageUrl,
          fit: BoxFit.cover,
          loadingBuilder: (context, child, progress) {
            if (progress == null) {
              return child;
            }

            return _BusinessArt(variant: data.variant);
          },
          errorBuilder: (context, error, stackTrace) {
            return _BusinessArt(variant: data.variant);
          },
        ),
        if (showDarkOverlay)
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.black.withValues(alpha: 0.08),
                  Colors.transparent,
                  Colors.black.withValues(alpha: 0.12),
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
        clockwise: true,
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
      Paint()..color = const Color(0xFF0B285E),
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _ShelfPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final shelfPaint = Paint()..color = const Color(0xFF7A4A18);
    for (double y = 14; y < size.height; y += 18) {
      canvas.drawRect(Rect.fromLTWH(0, y, size.width, 5), shelfPaint);
    }

    final colors = [
      const Color(0xFFE34F43),
      const Color(0xFF3E72E8),
      const Color(0xFF58B05F),
      const Color(0xFFFFBE2E),
    ];

    for (int column = 0; column < 4; column++) {
      for (double y = 6; y < size.height; y += 18) {
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            Rect.fromLTWH(8 + column * 14, y, 8, 10),
            const Radius.circular(2),
          ),
          Paint()..color = colors[column],
        );
      }
    }
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

class _CategoryData {
  const _CategoryData(this.icon, this.label, this.color, this.active);

  final IconData icon;
  final String label;
  final Color color;
  final bool active;
}

class _BusinessData {
  const _BusinessData({
    required this.name,
    required this.category,
    required this.location,
    required this.rating,
    required this.reviews,
    required this.distance,
    required this.variant,
    required this.imageUrl,
    this.badge,
    this.badgeColor = const Color(0xFF2961F0),
  });

  final String name;
  final String category;
  final String location;
  final double rating;
  final int reviews;
  final String distance;
  final String variant;
  final String imageUrl;
  final String? badge;
  final Color badgeColor;
}

const profileImageUrl =
    'https://images.pexels.com/photos/20882062/pexels-photo-20882062.jpeg?auto=compress&cs=tinysrgb&w=300';

class _NavItemData {
  const _NavItemData(this.icon, this.label, this.active);

  final IconData icon;
  final String label;
  final bool active;
}

const categories = [
  _CategoryData(
    Icons.shopping_cart_checkout_outlined,
    'Grocery',
    Color(0xFFFF5A4C),
    false,
  ),
  _CategoryData(
    Icons.restaurant_outlined,
    'Restaurants',
    Color(0xFFFFB01E),
    false,
  ),
  _CategoryData(Icons.content_cut_outlined, 'Tailors', Color(0xFFFFFFFF), true),
  _CategoryData(Icons.face_2_outlined, 'Beauty', Color(0xFFFF7186), false),
  _CategoryData(
    Icons.devices_other_outlined,
    'Electronics',
    Color(0xFF6A66FF),
    false,
  ),
  _CategoryData(
    Icons.home_work_outlined,
    'Home\nServices',
    Color(0xFF4AB64B),
    false,
  ),
  _CategoryData(Icons.apps_outlined, 'More', Color(0xFF7183A6), false),
];

const featuredBusinesses = [
  _BusinessData(
    name: 'Spice Garden',
    category: 'Restaurant',
    location: 'Calicut',
    rating: 4.6,
    reviews: 126,
    distance: '1.2 km',
    variant: 'plate',
    imageUrl:
        'https://images.pexels.com/photos/20418288/pexels-photo-20418288.jpeg?auto=compress&cs=tinysrgb&w=1200',
    badge: '20% OFF',
    badgeColor: Color(0xFF2961F0),
  ),
  _BusinessData(
    name: 'Royale Tailors',
    category: 'Tailor',
    location: 'Calicut',
    rating: 4.7,
    reviews: 89,
    distance: '1.5 km',
    variant: 'suit',
    imageUrl:
        'https://images.pexels.com/photos/6766299/pexels-photo-6766299.jpeg?auto=compress&cs=tinysrgb&w=1200',
    badge: 'Popular',
    badgeColor: Color(0xFFFFA91C),
  ),
  _BusinessData(
    name: 'Fresh Basket',
    category: 'Grocery',
    location: 'Calicut',
    rating: 4.5,
    reviews: 162,
    distance: '2.1 km',
    variant: 'basket',
    imageUrl:
        'https://images.pexels.com/photos/9070106/pexels-photo-9070106.jpeg?auto=compress&cs=tinysrgb&w=1200',
    badge: '10% OFF',
    badgeColor: Color(0xFF35B44A),
  ),
];

const popularBusinesses = [
  _BusinessData(
    name: 'Quick Mart',
    category: 'Grocery Store',
    location: 'Calicut',
    rating: 4.6,
    reviews: 98,
    distance: '1.2 km',
    variant: 'shelf',
    imageUrl:
        'https://images.pexels.com/photos/16211537/pexels-photo-16211537.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ),
  _BusinessData(
    name: 'Maya Beauty Salon',
    category: 'Beauty Salon',
    location: 'Calicut',
    rating: 4.7,
    reviews: 76,
    distance: '1.3 km',
    variant: 'salon',
    imageUrl:
        'https://images.pexels.com/photos/13068359/pexels-photo-13068359.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ),
  _BusinessData(
    name: 'Tech Hub',
    category: 'Electronics Store',
    location: 'Calicut',
    rating: 4.5,
    reviews: 124,
    distance: '1.6 km',
    variant: 'phone',
    imageUrl:
        'https://images.pexels.com/photos/2818118/pexels-photo-2818118.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ),
];
