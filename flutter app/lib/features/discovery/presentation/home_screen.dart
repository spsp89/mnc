import 'dart:async';

import 'package:bnc_mobile/core/data/app_repository.dart';
import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/core/state/app_state.dart';
import 'package:bnc_mobile/core/storage/app_preferences.dart';
import 'package:bnc_mobile/design_system/bnc_theme.dart';
import 'package:bnc_mobile/design_system/components.dart';
import 'package:bnc_mobile/features/community/presentation/community_screens.dart';
import 'package:bnc_mobile/features/jobs/presentation/jobs_screens.dart';
import 'package:bnc_mobile/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

part 'home_sections.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final strings = AppLocalizations.of(context);
    final selectedRadius = ref.watch(
      appSettingsProvider.select((settings) => settings.searchRadiusKm),
    );
    final categories = ref.watch(categoriesProvider);
    final businesses = ref.watch(featuredBusinessesProvider);
    final products = ref.watch(productsProvider);
    final bestSellers = ref.watch(bestSellerProductsProvider);
    final topServices = ref.watch(topServicesProvider);
    final offers = ref.watch(offersProvider);
    final cities = ref.watch(liveCitiesProvider);
    final bookableServices = ref.watch(bookableServicesProvider);
    final jobs = ref.watch(liveJobsProvider);
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFE),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(categoriesProvider);
          ref.invalidate(featuredBusinessesProvider);
          ref.invalidate(productsProvider);
          ref.invalidate(bestSellerProductsProvider);
          ref.invalidate(topServicesProvider);
          ref.invalidate(offersProvider);
          ref.invalidate(liveCitiesProvider);
          ref.invalidate(bookableServicesProvider);
          ref.invalidate(liveJobsProvider);
          await ref.read(featuredBusinessesProvider.future);
        },
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: _HomePromotionCarousel(
                businesses: businesses,
                onOpen: (slug) => context.push('/business/$slug'),
              ),
            ),
            SliverToBoxAdapter(
              child: _ImmersiveHomeHeader(
                searchHint: strings.searchHint,
                onSearch: () => context.go('/search'),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(18, 18, 18, 0),
                child: _DealsSection(
                  offers: offers,
                  onViewAll: () => context.push('/offers'),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: _PopularSearches(
                onSearch: (query) =>
                    context.go('/search?q=${Uri.encodeQueryComponent(query)}'),
              ),
            ),
            SliverToBoxAdapter(
              child: _WebsiteFeatureShortcuts(
                onBusinesses: () => context.push('/businesses'),
                onProducts: () => context.push('/products'),
                onServices: () => context.push('/services'),
                onOffers: () => context.push('/offers'),
                onJobs: () => context.push('/jobs'),
                onBookings: () => context.push('/bookings'),
                onWeeklyDraw: () => context.push('/weekly-draw'),
                onLocations: () => context.push('/locations'),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(18, 24, 18, 0),
              sliver: SliverToBoxAdapter(
                child: SectionHeader(
                  title: strings.popularCategories,
                  actionLabel: strings.viewAll,
                  onAction: () => context.push('/categories'),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: categories.when(
                loading: () => _AutoScrollingList(
                  height: 128,
                  padding: const EdgeInsets.fromLTRB(18, 12, 18, 2),
                  itemCount: 5,
                  step: 118,
                  separatorBuilder: (_, index) => const SizedBox(width: 10),
                  itemBuilder: (_, index) =>
                      const BncSkeleton(width: 108, height: 112),
                ),
                error: (error, stack) => _HomeSectionNotice(
                  icon: Icons.category_outlined,
                  title: 'Categories are temporarily unavailable',
                  body: 'Try again to reload nearby categories.',
                  actionLabel: strings.tryAgain,
                  onAction: () => ref.invalidate(categoriesProvider),
                ),
                data: (items) => items.isEmpty
                    ? _HomeSectionNotice(
                        icon: Icons.category_outlined,
                        title: 'More categories are coming',
                        body: 'Browse all local listings in the meantime.',
                        actionLabel: strings.viewAll,
                        onAction: () => context.push('/categories'),
                      )
                    : _AutoScrollingList(
                        height: 128,
                        padding: const EdgeInsets.fromLTRB(18, 12, 18, 2),
                        itemCount: items.length,
                        step: 118,
                        separatorBuilder: (_, index) =>
                            const SizedBox(width: 10),
                        itemBuilder: (context, index) =>
                            _CategoryCard(category: items[index]),
                      ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(18, 22, 18, 0),
                child: _DiscoveryPaths(
                  onMarketplace: () => context.push('/products'),
                  onServices: () => context.push('/services'),
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(18, 28, 18, 10),
              sliver: SliverToBoxAdapter(
                child: SectionHeader(
                  eyebrow: 'Within your radius',
                  title: strings.nearYou,
                  actionLabel: strings.viewAll,
                  onAction: () => context.go('/search?radius=$selectedRadius'),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: _NearbyFilters(
                selectedRadius: selectedRadius,
                onRadius: (radius) => unawaited(
                  ref
                      .read(appSettingsProvider.notifier)
                      .setSearchRadius(radius),
                ),
                onOpenNow: () =>
                    context.go('/search?openNow=true&radius=$selectedRadius'),
                onOffers: () =>
                    context.go('/search?offers=true&radius=$selectedRadius'),
                onMap: () =>
                    context.go('/search?view=map&radius=$selectedRadius'),
              ),
            ),
            SliverToBoxAdapter(
              child: businesses.when(
                loading: () => _AutoScrollingList(
                  height: 246,
                  padding: const EdgeInsets.fromLTRB(18, 12, 18, 4),
                  itemCount: 3,
                  step: 312,
                  separatorBuilder: (_, index) => const SizedBox(width: 12),
                  itemBuilder: (_, index) =>
                      const BncSkeleton(width: 300, height: 230, radius: 22),
                ),
                error: (error, stack) => _HomeSectionNotice(
                  icon: Icons.storefront_outlined,
                  title: 'Nearby businesses could not be loaded',
                  body: 'Check again or explore all businesses in Kochi.',
                  actionLabel: strings.tryAgain,
                  onAction: () => ref.invalidate(featuredBusinessesProvider),
                ),
                data: (items) => items.isEmpty
                    ? _HomeSectionNotice(
                        icon: Icons.location_searching_rounded,
                        title: 'No businesses found in this radius',
                        body: 'Expand the search to see more local options.',
                        actionLabel: 'Expand',
                        onAction: () => context.go('/search?radius=25'),
                      )
                    : _AutoScrollingList(
                        height: 246,
                        padding: const EdgeInsets.fromLTRB(18, 12, 18, 4),
                        itemCount: items.length,
                        step: 312,
                        separatorBuilder: (_, index) =>
                            const SizedBox(width: 12),
                        itemBuilder: (context, index) =>
                            _NearbyBusinessCard(business: items[index]),
                      ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(18, 30, 0, 0),
                child: _HomeBookingSection(
                  state: bookableServices,
                  onViewAll: () => context.push('/bookings'),
                  onBook: (service) => context.push(
                    '/bookings?service=${Uri.encodeQueryComponent(service.id)}',
                  ),
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(18, 30, 18, 12),
              sliver: SliverToBoxAdapter(
                child: SectionHeader(
                  eyebrow: 'Local marketplace',
                  title: strings.featuredProducts,
                  actionLabel: strings.viewAll,
                  onAction: () => context.push('/products'),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: products.when(
                loading: () => _AutoScrollingList(
                  height: 270,
                  padding: const EdgeInsets.symmetric(horizontal: 18),
                  itemCount: 3,
                  step: 202,
                  separatorBuilder: (_, index) => const SizedBox(width: 12),
                  itemBuilder: (_, index) =>
                      const BncSkeleton(width: 190, height: 260),
                ),
                error: (error, stack) => _HomeSectionNotice(
                  icon: Icons.shopping_bag_outlined,
                  title: 'Products are temporarily unavailable',
                  body: 'Try again to reload the local marketplace.',
                  actionLabel: strings.tryAgain,
                  onAction: () => ref.invalidate(productsProvider),
                ),
                data: (items) => items.isEmpty
                    ? _HomeSectionNotice(
                        icon: Icons.inventory_2_outlined,
                        title: 'No products to show yet',
                        body: 'Explore local shops while sellers add products.',
                        actionLabel: strings.viewAll,
                        onAction: () => context.push('/products'),
                      )
                    : _AutoScrollingList(
                        height: 270,
                        padding: const EdgeInsets.symmetric(horizontal: 18),
                        itemCount: items.length,
                        step: 202,
                        separatorBuilder: (_, index) =>
                            const SizedBox(width: 12),
                        itemBuilder: (context, index) =>
                            ProductCard(product: items[index]),
                      ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(18, 30, 18, 8),
              sliver: SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SectionHeader(
                      eyebrow: 'Delivered across Kerala',
                      title: 'Best sellers that courier to you',
                      actionLabel: strings.viewAll,
                      onAction: () => context.push(
                        '/products?sort=best-selling&courier=true',
                      ),
                    ),
                    const SizedBox(height: 5),
                    Text(
                      'These courier-enabled products may be outside your selected nearby radius.',
                      style: Theme.of(
                        context,
                      ).textTheme.bodySmall?.copyWith(color: BncColors.muted),
                    ),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: bestSellers.when(
                loading: () => _AutoScrollingList(
                  height: 270,
                  padding: const EdgeInsets.symmetric(horizontal: 18),
                  itemCount: 3,
                  step: 202,
                  separatorBuilder: (_, index) => const SizedBox(width: 12),
                  itemBuilder: (_, index) =>
                      const BncSkeleton(width: 190, height: 260),
                ),
                error: (error, stack) => _HomeSectionNotice(
                  icon: Icons.local_shipping_outlined,
                  title: 'Courier best sellers are temporarily unavailable',
                  body:
                      'Try again to load products delivered from farther away.',
                  actionLabel: strings.tryAgain,
                  onAction: () => ref.invalidate(bestSellerProductsProvider),
                ),
                data: (items) => items.isEmpty
                    ? _HomeSectionNotice(
                        icon: Icons.local_shipping_outlined,
                        title: 'No courier best sellers yet',
                        body:
                            'Products appear after confirmed sales and courier delivery are available.',
                        actionLabel: strings.viewAll,
                        onAction: () => context.push(
                          '/products?sort=best-selling&courier=true',
                        ),
                      )
                    : _AutoScrollingList(
                        height: 270,
                        padding: const EdgeInsets.symmetric(horizontal: 18),
                        itemCount: items.length,
                        step: 202,
                        separatorBuilder: (_, index) =>
                            const SizedBox(width: 12),
                        itemBuilder: (context, index) =>
                            ProductCard(product: items[index]),
                      ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(18, 30, 18, 8),
              sliver: SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SectionHeader(
                      eyebrow: 'Trusted beyond nearby',
                      title: 'Top-rated services',
                      actionLabel: strings.viewAll,
                      onAction: () => context.push('/services?sort=top-rated'),
                    ),
                    const SizedBox(height: 5),
                    Text(
                      'Provider location is shown; confirm remote or travel coverage before booking.',
                      style: Theme.of(
                        context,
                      ).textTheme.bodySmall?.copyWith(color: BncColors.muted),
                    ),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: topServices.when(
                loading: () => _AutoScrollingList(
                  height: 258,
                  padding: const EdgeInsets.symmetric(horizontal: 18),
                  itemCount: 3,
                  step: 312,
                  separatorBuilder: (_, index) => const SizedBox(width: 12),
                  itemBuilder: (_, index) =>
                      const BncSkeleton(width: 300, height: 248),
                ),
                error: (error, stack) => _HomeSectionNotice(
                  icon: Icons.workspace_premium_outlined,
                  title: 'Top services are temporarily unavailable',
                  body: 'Try again to load highly rated verified providers.',
                  actionLabel: strings.tryAgain,
                  onAction: () => ref.invalidate(topServicesProvider),
                ),
                data: (items) => items.isEmpty
                    ? _HomeSectionNotice(
                        icon: Icons.workspace_premium_outlined,
                        title: 'No top-rated services yet',
                        body:
                            'Verified provider ratings and reviews determine this list.',
                        actionLabel: strings.viewAll,
                        onAction: () =>
                            context.push('/services?sort=top-rated'),
                      )
                    : _AutoScrollingList(
                        height: 258,
                        padding: const EdgeInsets.symmetric(horizontal: 18),
                        itemCount: items.length,
                        step: 312,
                        separatorBuilder: (_, index) =>
                            const SizedBox(width: 12),
                        itemBuilder: (context, index) =>
                            _TopServiceCard(service: items[index]),
                      ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(18, 30, 0, 0),
                child: _HomeJobsSection(
                  state: jobs,
                  onViewAll: () => context.push('/jobs'),
                  onOpen: (id) => context.push('/jobs/$id'),
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(18, 30, 18, 12),
              sliver: SliverToBoxAdapter(
                child: SectionHeader(
                  eyebrow: 'Across Kerala',
                  title: strings.cities,
                  actionLabel: strings.viewAll,
                  onAction: () => context.push('/locations'),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: cities.when(
                loading: () => const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 18),
                  child: BncSkeleton(height: 104),
                ),
                error: (error, stack) => _HomeSectionNotice(
                  icon: Icons.location_city_outlined,
                  title: 'Locations are temporarily unavailable',
                  body: 'Try again to load active marketplace cities.',
                  actionLabel: strings.tryAgain,
                  onAction: () => ref.invalidate(liveCitiesProvider),
                ),
                data: (items) => items.isEmpty
                    ? const SizedBox.shrink()
                    : _AutoScrollingList(
                        height: 128,
                        padding: const EdgeInsets.fromLTRB(18, 0, 18, 24),
                        itemCount: items.length,
                        step: 245,
                        separatorBuilder: (_, index) =>
                            const SizedBox(width: 10),
                        itemBuilder: (context, index) => _CityCard(
                          city: items[index],
                          onTap: () => context.push(
                            '/search?location=${Uri.encodeQueryComponent(items[index].string('city'))}',
                          ),
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ImmersiveHomeHeader extends StatelessWidget {
  const _ImmersiveHomeHeader({
    required this.searchHint,
    required this.onSearch,
  });

  final String searchHint;
  final VoidCallback onSearch;

  @override
  Widget build(BuildContext context) {
    return ClipRect(
      child: DecoratedBox(
        key: const ValueKey('home-hero-background'),
        decoration: const BoxDecoration(color: BncColors.brand),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Find shops, services\n& deals near you',
                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                  color: Colors.white,
                  fontSize: 34,
                  height: .98,
                  letterSpacing: -1.35,
                ),
              ),
              const SizedBox(height: 18),
              _HeaderSearchBar(hint: searchHint, onTap: onSearch),
            ],
          ),
        ),
      ),
    );
  }
}

class _HeaderSearchBar extends StatelessWidget {
  const _HeaderSearchBar({required this.hint, required this.onTap});

  final String hint;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      elevation: 0,
      shadowColor: Colors.black.withValues(alpha: .2),
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 6, 6, 6),
          child: Row(
            children: [
              const Icon(
                Icons.search_rounded,
                color: BncColors.deepBlue,
                size: 22,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  hint,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(color: BncColors.muted),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 18,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(13),
                  border: Border.all(color: const Color(0xFFD4E2FA)),
                  boxShadow: [
                    BoxShadow(
                      color: BncColors.deepBlue.withValues(alpha: .08),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Text(
                  'Search',
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: BncColors.deepBlue,
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

class _CategoryCard extends StatelessWidget {
  const _CategoryCard({required this.category});

  final Category category;

  IconData get icon => switch (category.icon) {
    'restaurant' || 'restaurants' => Icons.restaurant_rounded,
    'home_repair' || 'home-services' => Icons.home_repair_service_rounded,
    'health' || 'doctors-clinics' => Icons.health_and_safety_rounded,
    'camera' || 'event-services' => Icons.camera_alt_rounded,
    'devices' || 'electronics' => Icons.devices_rounded,
    'spa' || 'beauty-wellness' => Icons.spa_rounded,
    'car' || 'automobile' => Icons.directions_car_filled_rounded,
    'school' || 'education' => Icons.school_rounded,
    'grocery' => Icons.local_grocery_store_rounded,
    'hotels-stays' => Icons.hotel_rounded,
    'bakery-sweets' => Icons.bakery_dining_rounded,
    'fashion' => Icons.checkroom_rounded,
    'real-estate' => Icons.apartment_rounded,
    'sports-fitness' => Icons.fitness_center_rounded,
    'professional-services' => Icons.business_center_rounded,
    'insurance' => Icons.health_and_safety_rounded,
    _ => Icons.storefront_rounded,
  };

  @override
  Widget build(BuildContext context) {
    final malayalam = Localizations.localeOf(context).languageCode == 'ml';
    return SizedBox(
      width: 108,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: BncColors.brand,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFF4775E0)),
          boxShadow: [
            BoxShadow(
              color: BncColors.brand.withValues(alpha: .12),
              blurRadius: 12,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () => context.push(
                '/products?category=${Uri.encodeQueryComponent(category.slug)}',
              ),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  BncNetworkImage(url: categoryImageUrl(category.slug)),
                  const DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Color(0x33031C58), Color(0xF2021239)],
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(13),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 43,
                          height: 43,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: .17),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: Colors.white30),
                          ),
                          child: Icon(icon, color: Colors.white, size: 22),
                        ),
                        const Spacer(),
                        Text(
                          malayalam ? category.nameMl : category.name,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.labelLarge
                              ?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                                height: 1.16,
                              ),
                        ),
                      ],
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
