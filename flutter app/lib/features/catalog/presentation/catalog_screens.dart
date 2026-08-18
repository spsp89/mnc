import 'package:bnc_mobile/core/data/app_repository.dart';
import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/core/state/app_state.dart';
import 'package:bnc_mobile/core/storage/app_preferences.dart';
import 'package:bnc_mobile/design_system/bnc_theme.dart';
import 'package:bnc_mobile/design_system/components.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class CategoriesScreen extends ConsumerWidget {
  const CategoriesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(categoriesProvider);
    final categoryCount = state.valueOrNull?.length;
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        statusBarBrightness: Brightness.dark,
        systemNavigationBarColor: Color(0xFFF7F9FE),
        systemNavigationBarIconBrightness: Brightness.dark,
      ),
      child: Scaffold(
        backgroundColor: const Color(0xFFF7F9FE),
        body: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: _CategoriesHero(categoryCount: categoryCount),
            ),
            ...state.when(
              loading: () => const [
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(child: CircularProgressIndicator()),
                ),
              ],
              error: (error, stack) => [
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: ErrorState(
                    error: error,
                    onRetry: () => ref.invalidate(categoriesProvider),
                  ),
                ),
              ],
              data: (categories) => categories.isEmpty
                  ? const [
                      SliverFillRemaining(
                        hasScrollBody: false,
                        child: EmptyState(
                          icon: Icons.category_outlined,
                          title: 'No categories yet',
                          body: 'New ways to explore will appear here.',
                        ),
                      ),
                    ]
                  : [
                      SliverPadding(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                        sliver: SliverGrid(
                          gridDelegate:
                              const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                mainAxisExtent: 82,
                                mainAxisSpacing: 10,
                                crossAxisSpacing: 10,
                              ),
                          delegate: SliverChildBuilderDelegate(
                            (context, index) => _CategoryDestinationCard(
                              category: categories[index],
                              productCount: categories[index].productCount,
                              onTap: () => context.push(
                                '/products?category=${Uri.encodeQueryComponent(categories[index].slug)}',
                              ),
                            ),
                            childCount: categories.length,
                          ),
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

class _CategoriesHero extends StatelessWidget {
  const _CategoriesHero({required this.categoryCount});

  final int? categoryCount;

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.paddingOf(context).top;
    return DecoratedBox(
      key: const ValueKey('categories-header'),
      decoration: const BoxDecoration(color: BncColors.brand),
      child: Padding(
        padding: EdgeInsets.fromLTRB(16, topPadding + 8, 20, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                IconButton(
                  onPressed: () => context.pop(),
                  style: IconButton.styleFrom(
                    foregroundColor: Colors.white,
                    backgroundColor: Colors.white.withValues(alpha: .12),
                  ),
                  icon: const Icon(Icons.arrow_back_rounded),
                  tooltip: 'Back',
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Categories',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
                if (categoryCount != null)
                  Text(
                    '$categoryCount categories',
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      color: Colors.white.withValues(alpha: .72),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 24),
            Text(
              'Explore categories',
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                letterSpacing: -.7,
              ),
            ),
            const SizedBox(height: 7),
            Text(
              'Choose what you need and discover trusted local options.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.white.withValues(alpha: .76),
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CategoryDestinationCard extends StatelessWidget {
  const _CategoryDestinationCard({
    required this.category,
    required this.productCount,
    required this.onTap,
  });

  final Category category;
  final int productCount;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final name = Localizations.localeOf(context).languageCode == 'ml'
        ? category.nameMl
        : category.name;
    return Semantics(
      button: true,
      label:
          '$name, $productCount '
          '${productCount == 1 ? 'product' : 'products'}',
      child: DecoratedBox(
        key: ValueKey('category-card-${category.slug}'),
        decoration: BoxDecoration(
          color: BncColors.deepBlue,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF8CB8F4)),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF163D91).withValues(alpha: .05),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onTap,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  BncNetworkImage(url: categoryImageUrl(category.slug)),
                  const DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Color(0x4D031C58), Color(0xF0021239)],
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 11,
                      vertical: 10,
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: .17),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.white30),
                          ),
                          child: Icon(
                            _categoryIcon(category.icon),
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            name,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.titleSmall
                                ?.copyWith(
                                  color: Colors.white,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w900,
                                  height: 1.15,
                                ),
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

class CategoryScreen extends ConsumerWidget {
  const CategoryScreen({required this.slug, super.key});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(appSettingsProvider);
    final categories = ref.watch(categoriesProvider).valueOrNull ?? const [];
    final category = categories.where((item) => item.slug == slug).firstOrNull;
    final query = category?.name ?? slug.replaceAll('-', ' ');
    final discovery = (
      slug: slug,
      query: query,
      location: settings.apiLocation,
      latitude: settings.apiLatitude,
      longitude: settings.apiLongitude,
      radiusKm: settings.searchRadiusKm,
    );
    final results = ref.watch(_categoryBusinessesProvider(discovery));
    final products = ref.watch(_categoryProductsProvider(discovery));
    return Scaffold(
      appBar: AppBar(title: Text(category?.name ?? query)),
      body: results.when(
        loading: () => ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: 4,
          separatorBuilder: (_, index) => const SizedBox(height: 12),
          itemBuilder: (_, index) => const BncSkeleton(height: 128),
        ),
        error: (error, stack) => ErrorState(error: error),
        data: (items) => products.when(
          loading: () => ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: 4,
            separatorBuilder: (_, index) => const SizedBox(height: 12),
            itemBuilder: (_, index) => const BncSkeleton(height: 128),
          ),
          error: (error, stack) => ErrorState(error: error),
          data: (categoryProducts) => items.isEmpty && categoryProducts.isEmpty
              ? const EmptyState(
                  icon: Icons.storefront_outlined,
                  title: 'Nothing listed yet',
                  body: 'Try exploring nearby businesses instead.',
                )
              : ListView(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 30),
                  children: [
                    if (categoryProducts.isNotEmpty) ...[
                      Text(
                        'Products in this category',
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 270,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: categoryProducts.length,
                          separatorBuilder: (_, index) =>
                              const SizedBox(width: 12),
                          itemBuilder: (context, index) =>
                              ProductCard(product: categoryProducts[index]),
                        ),
                      ),
                    ],
                    if (items.isNotEmpty) ...[
                      SizedBox(height: categoryProducts.isEmpty ? 4 : 28),
                      Text(
                        'Local businesses',
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      const SizedBox(height: 12),
                      for (var index = 0; index < items.length; index++) ...[
                        BusinessCard(business: items[index], compact: true),
                        if (index != items.length - 1)
                          const SizedBox(height: 12),
                      ],
                    ],
                  ],
                ),
        ),
      ),
    );
  }
}

typedef _CategoryDiscovery = ({
  String slug,
  String query,
  String location,
  double? latitude,
  double? longitude,
  int radiusKm,
});

final _categoryBusinessesProvider =
    FutureProvider.family<List<Business>, _CategoryDiscovery>((
      ref,
      input,
    ) async {
      final result = await ref
          .watch(appRepositoryProvider)
          .searchBusinesses(
            SearchFilters(
              query: input.query,
              location: input.location,
              latitude: input.latitude,
              longitude: input.longitude,
              radiusKm: input.radiusKm,
            ),
          );
      return result.items;
    });

final _categoryProductsProvider =
    FutureProvider.family<List<Product>, _CategoryDiscovery>((ref, input) {
      return ref.watch(appRepositoryProvider).products(category: input.slug);
    });

class ProductsScreen extends ConsumerWidget {
  const ProductsScreen({
    super.key,
    this.initialQuery,
    this.initialCategory,
    this.initialStock,
    this.initialLocation,
    this.initialConstituency,
    this.initialDistrict,
    this.initialState,
    this.initialLatitude,
    this.initialLongitude,
    this.initialRadiusKm,
    this.initialCourier = false,
    this.initialSort,
  });

  final String? initialQuery;
  final String? initialCategory;
  final String? initialStock;
  final String? initialLocation;
  final String? initialConstituency;
  final String? initialDistrict;
  final String? initialState;
  final double? initialLatitude;
  final double? initialLongitude;
  final int? initialRadiusKm;
  final bool initialCourier;
  final String? initialSort;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(appSettingsProvider);
    final requestedLocation = initialLocation?.trim();
    final hasExplicitLocationContext =
        initialLocation != null ||
        initialConstituency != null ||
        initialDistrict != null ||
        initialState != null ||
        initialLatitude != null ||
        initialLongitude != null;
    final preciseLocation =
        requestedLocation == currentAreaLocation ||
        requestedLocation == 'Current location' ||
        requestedLocation == 'Pinned location';
    final location = !hasExplicitLocationContext
        ? settings.apiLocation
        : preciseLocation
        ? ''
        : requestedLocation ?? '';
    final latitude = !hasExplicitLocationContext
        ? settings.apiLatitude
        : initialLatitude;
    final longitude = !hasExplicitLocationContext
        ? settings.apiLongitude
        : initialLongitude;
    final radiusKm = initialRadiusKm ?? settings.searchRadiusKm;
    final administrativeLabel =
        [initialConstituency, initialDistrict, initialState]
            .whereType<String>()
            .map((value) => value.trim())
            .firstWhere((value) => value.isNotEmpty, orElse: () => '');
    final state =
        initialQuery == null &&
            initialCategory == null &&
            initialStock == null &&
            initialLocation == null &&
            initialConstituency == null &&
            initialDistrict == null &&
            initialState == null &&
            initialLatitude == null &&
            initialLongitude == null &&
            initialRadiusKm == null &&
            !initialCourier &&
            initialSort == null
        ? ref.watch(productsProvider)
        : ref.watch(
            catalogueProductsProvider((
              query: initialQuery ?? '',
              category: initialCategory ?? '',
              stock: initialStock ?? '',
              city: location,
              constituency: initialConstituency ?? '',
              district: initialDistrict ?? '',
              state: initialState ?? '',
              latitude: latitude,
              longitude: longitude,
              radiusKm: radiusKm,
              courier: initialCourier,
              sort: initialSort ?? '',
            )),
          );
    final cartCount = ref.watch(
      cartProvider.select(
        (lines) => lines.fold(0, (total, line) => total + line.quantity),
      ),
    );
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        statusBarBrightness: Brightness.dark,
        systemNavigationBarColor: Color(0xFFF7F9FE),
        systemNavigationBarIconBrightness: Brightness.dark,
      ),
      child: Scaffold(
        backgroundColor: const Color(0xFFF7F9FE),
        body: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: _ProductsHero(
                productCount: state.valueOrNull?.length,
                cartCount: cartCount,
                onCart: () => context.push('/cart'),
              ),
            ),
            ...state.when(
              loading: () => const [
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(child: CircularProgressIndicator()),
                ),
              ],
              error: (error, stack) => [
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: ErrorState(error: error),
                ),
              ],
              data: (products) => products.isEmpty
                  ? const [
                      SliverFillRemaining(
                        hasScrollBody: false,
                        child: EmptyState(
                          icon: Icons.inventory_2_outlined,
                          title: 'No products yet',
                          body: 'Local products will appear here soon.',
                        ),
                      ),
                    ]
                  : [
                      SliverToBoxAdapter(
                        child: _ProductDirectoryContent(
                          products: products,
                          initialQuery: initialQuery,
                          selectedCategoryLabel: _selectedCategoryLabel(
                            ref.watch(categoriesProvider).valueOrNull ??
                                const <Category>[],
                          ),
                          selectedStock: initialStock ?? '',
                          selectedSort: initialSort ?? 'recommended',
                          courierOnly: initialCourier,
                          locationLabel: location.isEmpty
                              ? administrativeLabel.isEmpty
                                    ? currentAreaLocation
                                    : administrativeLabel
                              : location,
                          radiusKm: radiusKm,
                          wideDiscovery: initialCourier,
                          onSearch: (query) =>
                              context.go(_routeWith(query: query)),
                          onFilters: () => _showProductFilters(context, ref),
                        ),
                      ),
                    ],
            ),
          ],
        ),
      ),
    );
  }

  String _selectedCategoryLabel(List<Category> categories) {
    final selected = initialCategory?.trim() ?? '';
    if (selected.isEmpty) return '';
    for (final category in categories) {
      if (category.slug == selected) return category.name;
    }
    return selected.replaceAll('-', ' ');
  }

  String _routeWith({
    String? query,
    String? category,
    String? stock,
    bool? courier,
    String? sort,
  }) {
    final parameters = <String, String>{};

    void add(String key, Object? value) {
      final text = value?.toString().trim() ?? '';
      if (text.isNotEmpty) parameters[key] = text;
    }

    add('q', query ?? initialQuery);
    add('category', category ?? initialCategory);
    add('status', stock ?? initialStock);
    add('location', initialLocation);
    add('constituency', initialConstituency);
    add('district', initialDistrict);
    add('state', initialState);
    add('latitude', initialLatitude);
    add('longitude', initialLongitude);
    add('radius', initialRadiusKm);
    if (courier ?? initialCourier) parameters['courier'] = 'true';
    final selectedSort = sort ?? initialSort ?? 'recommended';
    if (selectedSort != 'recommended') parameters['sort'] = selectedSort;
    return Uri(path: '/products', queryParameters: parameters).toString();
  }

  Future<void> _showProductFilters(BuildContext context, WidgetRef ref) async {
    final categories = ref.read(categoriesProvider).valueOrNull ?? const [];
    final result = await showModalBottomSheet<_ProductFilterSelection>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (context) => _ProductFilterSheet(
        categories: categories,
        initial: _ProductFilterSelection(
          category: initialCategory ?? '',
          stock: initialStock ?? '',
          courier: initialCourier,
          sort: initialSort ?? 'recommended',
        ),
      ),
    );
    if (result == null || !context.mounted) return;
    context.go(
      _routeWith(
        category: result.category,
        stock: result.stock,
        courier: result.courier,
        sort: result.sort,
      ),
    );
  }
}

class _ProductDirectoryContent extends StatefulWidget {
  const _ProductDirectoryContent({
    required this.products,
    this.initialQuery,
    required this.selectedCategoryLabel,
    required this.selectedStock,
    required this.selectedSort,
    required this.courierOnly,
    required this.locationLabel,
    required this.radiusKm,
    required this.onSearch,
    required this.onFilters,
    this.wideDiscovery = false,
  });

  final List<Product> products;
  final String? initialQuery;
  final String selectedCategoryLabel;
  final String selectedStock;
  final String selectedSort;
  final bool courierOnly;
  final String locationLabel;
  final int radiusKm;
  final ValueChanged<String> onSearch;
  final VoidCallback onFilters;
  final bool wideDiscovery;

  @override
  State<_ProductDirectoryContent> createState() =>
      _ProductDirectoryContentState();
}

class _ProductDirectoryContentState extends State<_ProductDirectoryContent> {
  late final TextEditingController _query = TextEditingController(
    text: widget.initialQuery,
  );
  String _category = 'All';

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(covariant _ProductDirectoryContent oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.initialQuery != widget.initialQuery &&
        _query.text != (widget.initialQuery ?? '')) {
      _query.text = widget.initialQuery ?? '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final categories = {
      for (final product in widget.products)
        if (product.category.trim().isNotEmpty) product.category.trim(),
    }.toList()..sort();
    final needle = _query.text.trim().toLowerCase();
    final filtered = widget.products.where((product) {
      final matchesCategory =
          _category == 'All' || product.category == _category;
      final searchable = [
        product.name,
        product.brand,
        product.category,
        product.businessName,
        product.description,
      ].join(' ').toLowerCase();
      return matchesCategory && (needle.isEmpty || searchable.contains(needle));
    }).toList();

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 36),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: _query,
            onChanged: (_) => setState(() {}),
            onSubmitted: widget.onSearch,
            textInputAction: TextInputAction.search,
            decoration: InputDecoration(
              hintText: 'Search products, brands or local sellers',
              prefixIcon: const Icon(Icons.search_rounded),
              suffixIcon: needle.isEmpty
                  ? null
                  : IconButton(
                      onPressed: () {
                        _query.clear();
                        setState(() {});
                      },
                      icon: const Icon(Icons.close_rounded),
                    ),
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ActionChip(
                avatar: const Icon(Icons.tune_rounded, size: 18),
                label: Text(
                  _activeFilterCount == 0
                      ? 'Filter & sort'
                      : 'Filter & sort · $_activeFilterCount',
                ),
                onPressed: widget.onFilters,
              ),
              ActionChip(
                avatar: const Icon(Icons.location_on_outlined, size: 18),
                label: Text(
                  widget.wideDiscovery
                      ? 'Courier delivery · beyond nearby'
                      : '${widget.locationLabel} · ${widget.radiusKm} km radius',
                ),
                onPressed: () => context.push('/locations'),
              ),
              if (widget.selectedCategoryLabel.isNotEmpty)
                Chip(
                  avatar: const Icon(Icons.category_outlined, size: 17),
                  label: Text(widget.selectedCategoryLabel),
                ),
              if (widget.selectedStock.isNotEmpty)
                Chip(
                  avatar: const Icon(Icons.inventory_2_outlined, size: 17),
                  label: Text(_productStockLabel(widget.selectedStock)),
                ),
              if (widget.selectedSort != 'recommended')
                Chip(
                  avatar: const Icon(Icons.sort_rounded, size: 17),
                  label: Text(_productSortLabel(widget.selectedSort)),
                ),
            ],
          ),
          const SizedBox(height: 10),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                for (final category in ['All', ...categories])
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(category),
                      selected: _category == category,
                      onSelected: (_) => setState(() => _category = category),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Text(
            '${filtered.length} ${filtered.length == 1 ? 'product' : 'products'}',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 12),
          if (filtered.isEmpty)
            const SizedBox(
              height: 340,
              child: EmptyState(
                icon: Icons.search_off_rounded,
                title: 'No matching products',
                body: 'Try another product, brand, seller or category.',
              ),
            )
          else
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: filtered.length,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: .66,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
              ),
              itemBuilder: (context, index) => _MarketplaceProductCard(
                product: filtered[index],
                onTap: () => context.push('/product/${filtered[index].id}'),
              ),
            ),
        ],
      ),
    );
  }

  int get _activeFilterCount =>
      (widget.selectedCategoryLabel.isEmpty ? 0 : 1) +
      (widget.selectedStock.isEmpty ? 0 : 1) +
      (widget.courierOnly ? 1 : 0) +
      (widget.selectedSort == 'recommended' ? 0 : 1);
}

class _ProductFilterSelection {
  const _ProductFilterSelection({
    required this.category,
    required this.stock,
    required this.courier,
    required this.sort,
  });

  final String category;
  final String stock;
  final bool courier;
  final String sort;
}

class _ProductFilterSheet extends StatefulWidget {
  const _ProductFilterSheet({required this.categories, required this.initial});

  final List<Category> categories;
  final _ProductFilterSelection initial;

  @override
  State<_ProductFilterSheet> createState() => _ProductFilterSheetState();
}

class _ProductFilterSheetState extends State<_ProductFilterSheet> {
  late String _category = widget.initial.category;
  late String _stock = widget.initial.stock;
  late bool _courier = widget.initial.courier;
  late String _sort = widget.initial.sort;

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    return SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(20, 12, 20, 24 + bottomInset),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 42,
              height: 4,
              decoration: BoxDecoration(
                color: const Color(0xFFD6DEEC),
                borderRadius: BorderRadius.circular(99),
              ),
            ),
          ),
          const SizedBox(height: 18),
          Text(
            'Filter local products',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 5),
          Text(
            'These filters use the same live catalogue rules as the BNC website.',
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: BncColors.muted),
          ),
          const SizedBox(height: 20),
          DropdownButtonFormField<String>(
            initialValue: _category,
            decoration: const InputDecoration(
              labelText: 'Category',
              prefixIcon: Icon(Icons.category_outlined),
            ),
            items: [
              const DropdownMenuItem(value: '', child: Text('All categories')),
              for (final category in widget.categories)
                DropdownMenuItem(
                  value: category.slug,
                  child: Text(category.name),
                ),
            ],
            onChanged: (value) => setState(() => _category = value ?? ''),
          ),
          const SizedBox(height: 14),
          DropdownButtonFormField<String>(
            initialValue: _stock,
            decoration: const InputDecoration(
              labelText: 'Availability',
              prefixIcon: Icon(Icons.inventory_2_outlined),
            ),
            items: const [
              DropdownMenuItem(value: '', child: Text('Any status')),
              DropdownMenuItem(value: 'IN_STOCK', child: Text('In stock')),
              DropdownMenuItem(value: 'LOW_STOCK', child: Text('Low stock')),
              DropdownMenuItem(
                value: 'MADE_TO_ORDER',
                child: Text('Made to order'),
              ),
              DropdownMenuItem(
                value: 'OUT_OF_STOCK',
                child: Text('Out of stock'),
              ),
            ],
            onChanged: (value) => setState(() => _stock = value ?? ''),
          ),
          const SizedBox(height: 14),
          DropdownButtonFormField<String>(
            initialValue: _sort,
            decoration: const InputDecoration(
              labelText: 'Sort by',
              prefixIcon: Icon(Icons.sort_rounded),
            ),
            items: const [
              DropdownMenuItem(
                value: 'recommended',
                child: Text('Recommended'),
              ),
              DropdownMenuItem(
                value: 'best-selling',
                child: Text('Best selling'),
              ),
              DropdownMenuItem(value: 'nearest', child: Text('Nearest')),
              DropdownMenuItem(value: 'newest', child: Text('Newest first')),
              DropdownMenuItem(
                value: 'price-low',
                child: Text('Price: low to high'),
              ),
              DropdownMenuItem(
                value: 'price-high',
                child: Text('Price: high to low'),
              ),
              DropdownMenuItem(value: 'name', child: Text('Product name')),
              DropdownMenuItem(value: 'category', child: Text('Category')),
              DropdownMenuItem(value: 'location', child: Text('Location')),
              DropdownMenuItem(
                value: 'status',
                child: Text('Availability status'),
              ),
            ],
            onChanged: (value) =>
                setState(() => _sort = value ?? 'recommended'),
          ),
          const SizedBox(height: 10),
          SwitchListTile.adaptive(
            contentPadding: EdgeInsets.zero,
            value: _courier,
            onChanged: (value) => setState(() => _courier = value),
            secondary: const Icon(Icons.local_shipping_outlined),
            title: const Text('Courier available'),
            subtitle: const Text('Include products delivered across Kerala'),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => setState(() {
                    _category = '';
                    _stock = '';
                    _courier = false;
                    _sort = 'recommended';
                  }),
                  child: const Text('Reset'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                flex: 2,
                child: FilledButton.icon(
                  onPressed: () => Navigator.of(context).pop(
                    _ProductFilterSelection(
                      category: _category,
                      stock: _stock,
                      courier: _courier,
                      sort: _sort,
                    ),
                  ),
                  icon: const Icon(Icons.tune_rounded),
                  label: const Text('Apply filters'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

String _productStockLabel(String value) => switch (value) {
  'IN_STOCK' => 'In stock',
  'LOW_STOCK' => 'Low stock',
  'OUT_OF_STOCK' => 'Out of stock',
  'MADE_TO_ORDER' => 'Made to order',
  _ => value.replaceAll('_', ' ').toLowerCase(),
};

String _productSortLabel(String value) => switch (value) {
  'best-selling' => 'Best selling',
  'nearest' => 'Nearest',
  'newest' => 'Newest first',
  'price-low' => 'Price: low to high',
  'price-high' => 'Price: high to low',
  'name' => 'Product name',
  'category' => 'Category',
  'location' => 'Location',
  'status' => 'Availability status',
  _ => 'Recommended',
};

class _ProductsHero extends StatelessWidget {
  const _ProductsHero({
    required this.productCount,
    required this.cartCount,
    required this.onCart,
  });

  final int? productCount;
  final int cartCount;
  final VoidCallback onCart;

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.paddingOf(context).top;
    return DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF04164F), Color(0xFF0738B8), Color(0xFF0A82F8)],
          stops: [0, .54, 1],
        ),
      ),
      child: Stack(
        children: [
          Positioned(
            right: -100,
            top: 12,
            child: Container(
              width: 236,
              height: 236,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    Colors.white.withValues(alpha: .14),
                    Colors.white.withValues(alpha: 0),
                  ],
                ),
              ),
            ),
          ),
          const Positioned(
            right: 38,
            bottom: 40,
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: BncColors.golden,
                shape: BoxShape.circle,
              ),
              child: SizedBox.square(dimension: 11),
            ),
          ),
          Padding(
            padding: EdgeInsets.fromLTRB(16, topPadding + 8, 20, 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    IconButton(
                      onPressed: () => context.pop(),
                      style: IconButton.styleFrom(
                        foregroundColor: Colors.white,
                        backgroundColor: Colors.white.withValues(alpha: .11),
                        side: BorderSide(
                          color: Colors.white.withValues(alpha: .16),
                        ),
                      ),
                      icon: const Icon(Icons.arrow_back_rounded),
                      tooltip: 'Back',
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Local products',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Semantics(
                      label: productCount == null
                          ? 'Discover products'
                          : '$productCount products',
                      child: Container(
                        width: 42,
                        height: 32,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: .1),
                          borderRadius: BorderRadius.circular(99),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: .16),
                          ),
                        ),
                        child: productCount == null
                            ? const Icon(
                                Icons.inventory_2_outlined,
                                color: Colors.white,
                                size: 16,
                              )
                            : Text(
                                '$productCount',
                                style: Theme.of(context).textTheme.labelMedium
                                    ?.copyWith(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w900,
                                    ),
                              ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    _MarketplaceCartButton(count: cartCount, onTap: onCart),
                  ],
                ),
                const SizedBox(height: 28),
                Text(
                  'Made nearby,\nworth discovering',
                  style: Theme.of(context).textTheme.displaySmall?.copyWith(
                    color: Colors.white,
                    fontSize: 34,
                    height: 1,
                    letterSpacing: -1.2,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  'Shop useful finds and local favourites from sellers across Kerala.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.white.withValues(alpha: .76),
                    height: 1.4,
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

class _MarketplaceCartButton extends StatelessWidget {
  const _MarketplaceCartButton({required this.count, required this.onTap});

  final int count;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: onTap,
      style: IconButton.styleFrom(
        foregroundColor: Colors.white,
        backgroundColor: Colors.white.withValues(alpha: .11),
        side: BorderSide(color: Colors.white.withValues(alpha: .16)),
      ),
      icon: Badge(
        isLabelVisible: count > 0,
        label: Text('$count'),
        backgroundColor: BncColors.golden,
        textColor: BncColors.deepBlue,
        child: const Icon(Icons.shopping_bag_outlined),
      ),
      tooltip: 'Cart',
    );
  }
}

class _MarketplaceProductCard extends StatelessWidget {
  const _MarketplaceProductCard({required this.product, required this.onTap});

  final Product product;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFD9E4F7)),
        boxShadow: [
          BoxShadow(
            color: BncColors.deepBlue.withValues(alpha: .07),
            blurRadius: 18,
            offset: const Offset(0, 9),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(24),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  flex: 6,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      BncNetworkImage(url: product.imageUrl),
                      const DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [Colors.black12, Colors.transparent],
                          ),
                        ),
                      ),
                      if (product.unitsSold > 0 ||
                          product.sponsored ||
                          product.discountPrice != null)
                        Positioned(
                          left: 10,
                          top: 10,
                          child: Wrap(
                            direction: Axis.vertical,
                            spacing: 5,
                            children: [
                              if (product.unitsSold > 0)
                                const StatusBadge(
                                  label: 'Best seller',
                                  color: Color(0xFF146C43),
                                ),
                              if (product.sponsored)
                                StatusBadge(
                                  label:
                                      'Sponsored${product.planName.isEmpty ? '' : ' · ${product.planName}'}',
                                  color: BncColors.deepBlue,
                                ),
                              if (product.discountPrice != null)
                                const StatusBadge(
                                  label: 'Local deal',
                                  color: BncColors.brand,
                                ),
                            ],
                          ),
                        ),
                      Positioned(
                        right: 10,
                        top: 10,
                        child: Container(
                          width: 31,
                          height: 31,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: .92),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.arrow_outward_rounded,
                            color: BncColors.brand,
                            size: 17,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  flex: 5,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(13, 12, 13, 13),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          product.category.toUpperCase(),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.labelSmall
                              ?.copyWith(
                                color: BncColors.brand,
                                fontSize: 9,
                                fontWeight: FontWeight.w900,
                                letterSpacing: .75,
                              ),
                        ),
                        const SizedBox(height: 5),
                        Text(
                          product.name,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.titleSmall
                              ?.copyWith(
                                color: BncColors.ink,
                                fontWeight: FontWeight.w900,
                                height: 1.15,
                              ),
                        ),
                        if (product.businessName.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            product.businessName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.labelSmall
                                ?.copyWith(color: BncColors.muted),
                          ),
                        ],
                        if (product.courierDeliveryAvailable ||
                            product.homeDeliveryAvailable) ...[
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(
                                Icons.local_shipping_outlined,
                                size: 13,
                                color: BncColors.brand,
                              ),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  product.courierDeliveryAvailable
                                      ? 'Courier available'
                                      : 'Home delivery available',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: Theme.of(context).textTheme.labelSmall
                                      ?.copyWith(color: BncColors.brand),
                                ),
                              ),
                            ],
                          ),
                        ],
                        const Spacer(),
                        if (product.distanceKm != null ||
                            product.businessCity.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 5),
                            child: Text(
                              product.distanceKm != null
                                  ? '${product.distanceKm!.toStringAsFixed(1)} km away'
                                  : product.businessCity,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.labelSmall
                                  ?.copyWith(color: BncColors.muted),
                            ),
                          ),
                        Wrap(
                          crossAxisAlignment: WrapCrossAlignment.center,
                          spacing: 7,
                          children: [
                            Text(
                              formatCurrency(product.effectivePrice),
                              style: Theme.of(context).textTheme.titleMedium
                                  ?.copyWith(
                                    color: BncColors.deepBlue,
                                    fontWeight: FontWeight.w900,
                                  ),
                            ),
                            if (product.discountPrice != null)
                              Text(
                                formatCurrency(product.price),
                                style: Theme.of(context).textTheme.bodySmall
                                    ?.copyWith(
                                      color: BncColors.muted,
                                      decoration: TextDecoration.lineThrough,
                                    ),
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
        ),
      ),
    );
  }
}

class ServicesScreen extends ConsumerWidget {
  const ServicesScreen({
    super.key,
    this.initialQuery,
    this.initialLocation,
    this.initialConstituency,
    this.initialDistrict,
    this.initialState,
    this.initialLatitude,
    this.initialLongitude,
    this.initialRadiusKm,
    this.initialSort,
  });

  final String? initialQuery;
  final String? initialLocation;
  final String? initialConstituency;
  final String? initialDistrict;
  final String? initialState;
  final double? initialLatitude;
  final double? initialLongitude;
  final int? initialRadiusKm;
  final String? initialSort;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(appSettingsProvider);
    final requestedLocation = initialLocation?.trim();
    final hasExplicitLocationContext =
        initialLocation != null ||
        initialConstituency != null ||
        initialDistrict != null ||
        initialState != null ||
        initialLatitude != null ||
        initialLongitude != null;
    final preciseLocation =
        requestedLocation == currentAreaLocation ||
        requestedLocation == 'Current location' ||
        requestedLocation == 'Pinned location';
    final location = !hasExplicitLocationContext
        ? settings.apiLocation
        : preciseLocation
        ? ''
        : requestedLocation ?? '';
    final latitude = !hasExplicitLocationContext
        ? settings.apiLatitude
        : initialLatitude;
    final longitude = !hasExplicitLocationContext
        ? settings.apiLongitude
        : initialLongitude;
    final radiusKm = initialRadiusKm ?? settings.searchRadiusKm;
    final administrativeLabel =
        [initialConstituency, initialDistrict, initialState]
            .whereType<String>()
            .map((value) => value.trim())
            .firstWhere((value) => value.isNotEmpty, orElse: () => '');
    final state =
        initialQuery == null &&
            initialLocation == null &&
            initialConstituency == null &&
            initialDistrict == null &&
            initialState == null &&
            initialLatitude == null &&
            initialLongitude == null &&
            initialRadiusKm == null &&
            initialSort == null
        ? ref.watch(servicesListProvider)
        : ref.watch(
            catalogueServicesProvider((
              query: initialQuery ?? '',
              category: '',
              stock: '',
              city: location,
              constituency: initialConstituency ?? '',
              district: initialDistrict ?? '',
              state: initialState ?? '',
              latitude: latitude,
              longitude: longitude,
              radiusKm: radiusKm,
              courier: false,
              sort: initialSort ?? '',
            )),
          );
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        statusBarBrightness: Brightness.dark,
        systemNavigationBarColor: Color(0xFFF7F9FE),
        systemNavigationBarIconBrightness: Brightness.dark,
      ),
      child: Scaffold(
        backgroundColor: const Color(0xFFF7F9FE),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () => context.push('/enquiry'),
          backgroundColor: BncColors.brand,
          foregroundColor: Colors.white,
          elevation: 8,
          icon: const Icon(Icons.auto_awesome_rounded),
          label: const Text('Get matched'),
        ),
        body: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: _ServicesHero(serviceCount: state.valueOrNull?.length),
            ),
            ...state.when(
              loading: () => const [
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(child: CircularProgressIndicator()),
                ),
              ],
              error: (error, stack) => [
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: ErrorState(error: error),
                ),
              ],
              data: (services) => services.isEmpty
                  ? const [
                      SliverFillRemaining(
                        hasScrollBody: false,
                        child: EmptyState(
                          icon: Icons.handyman_outlined,
                          title: 'No services yet',
                          body: 'Local services will appear here soon.',
                        ),
                      ),
                    ]
                  : [
                      SliverToBoxAdapter(
                        child: _ServiceDirectoryContent(
                          services: services,
                          initialQuery: initialQuery,
                          locationLabel: location.isEmpty
                              ? administrativeLabel.isEmpty
                                    ? currentAreaLocation
                                    : administrativeLabel
                              : location,
                          radiusKm: radiusKm,
                          wideDiscovery: initialSort == 'top-rated',
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

class _ServiceDirectoryContent extends StatefulWidget {
  const _ServiceDirectoryContent({
    required this.services,
    this.initialQuery,
    required this.locationLabel,
    required this.radiusKm,
    this.wideDiscovery = false,
  });

  final List<Service> services;
  final String? initialQuery;
  final String locationLabel;
  final int radiusKm;
  final bool wideDiscovery;

  @override
  State<_ServiceDirectoryContent> createState() =>
      _ServiceDirectoryContentState();
}

class _ServiceDirectoryContentState extends State<_ServiceDirectoryContent> {
  late final TextEditingController _query = TextEditingController(
    text: widget.initialQuery,
  );
  bool _homeServiceOnly = false;

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final needle = _query.text.trim().toLowerCase();
    final filtered = widget.services.where((service) {
      final searchable = [
        service.name,
        service.description,
        service.businessName,
        service.category,
      ].join(' ').toLowerCase();
      return (!_homeServiceOnly || service.homeService) &&
          (needle.isEmpty || searchable.contains(needle));
    }).toList();
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 112),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: _query,
            onChanged: (_) => setState(() {}),
            decoration: InputDecoration(
              hintText: 'Search services, professionals or businesses',
              prefixIcon: const Icon(Icons.search_rounded),
              suffixIcon: needle.isEmpty
                  ? null
                  : IconButton(
                      onPressed: () {
                        _query.clear();
                        setState(() {});
                      },
                      icon: const Icon(Icons.close_rounded),
                    ),
            ),
          ),
          const SizedBox(height: 10),
          ActionChip(
            avatar: const Icon(Icons.location_on_outlined, size: 18),
            label: Text(
              widget.wideDiscovery
                  ? 'Top rated · provider location shown'
                  : '${widget.locationLabel} · ${widget.radiusKm} km radius',
            ),
            onPressed: () => context.push('/locations'),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              FilterChip(
                avatar: const Icon(Icons.home_work_outlined, size: 17),
                label: const Text('Home service'),
                selected: _homeServiceOnly,
                onSelected: (value) => setState(() => _homeServiceOnly = value),
              ),
              const Spacer(),
              Text(
                '${filtered.length} ${filtered.length == 1 ? 'service' : 'services'}',
                style: Theme.of(context).textTheme.labelLarge,
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (filtered.isEmpty)
            const SizedBox(
              height: 340,
              child: EmptyState(
                icon: Icons.search_off_rounded,
                title: 'No matching services',
                body: 'Try another service, professional or business.',
              ),
            )
          else
            for (var index = 0; index < filtered.length; index++)
              Padding(
                padding: EdgeInsets.only(
                  bottom: index == filtered.length - 1 ? 0 : 12,
                ),
                child: _ServiceDestinationCard(
                  service: filtered[index],
                  onTap: () => context.push('/services/${filtered[index].id}'),
                ),
              ),
        ],
      ),
    );
  }
}

class _ServicesHero extends StatelessWidget {
  const _ServicesHero({required this.serviceCount});

  final int? serviceCount;

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.paddingOf(context).top;
    return DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF04164F), Color(0xFF0738B8), Color(0xFF0A82F8)],
          stops: [0, .54, 1],
        ),
      ),
      child: Stack(
        children: [
          Positioned(
            right: -100,
            top: 12,
            child: Container(
              width: 236,
              height: 236,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    Colors.white.withValues(alpha: .14),
                    Colors.white.withValues(alpha: 0),
                  ],
                ),
              ),
            ),
          ),
          const Positioned(
            right: 38,
            bottom: 40,
            child: DecoratedBox(
              decoration: BoxDecoration(
                color: BncColors.golden,
                shape: BoxShape.circle,
              ),
              child: SizedBox.square(dimension: 11),
            ),
          ),
          Padding(
            padding: EdgeInsets.fromLTRB(16, topPadding + 8, 20, 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    IconButton(
                      onPressed: () => context.pop(),
                      style: IconButton.styleFrom(
                        foregroundColor: Colors.white,
                        backgroundColor: Colors.white.withValues(alpha: .11),
                        side: BorderSide(
                          color: Colors.white.withValues(alpha: .16),
                        ),
                      ),
                      icon: const Icon(Icons.arrow_back_rounded),
                      tooltip: 'Back',
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Local services',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Semantics(
                      label: serviceCount == null
                          ? 'Discover services'
                          : '$serviceCount services',
                      child: Container(
                        width: 42,
                        height: 32,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: .1),
                          borderRadius: BorderRadius.circular(99),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: .16),
                          ),
                        ),
                        child: serviceCount == null
                            ? const Icon(
                                Icons.handyman_outlined,
                                color: Colors.white,
                                size: 16,
                              )
                            : Text(
                                '$serviceCount',
                                style: Theme.of(context).textTheme.labelMedium
                                    ?.copyWith(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w900,
                                    ),
                              ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 28),
                Text(
                  'Skilled experts,\nready when you are',
                  style: Theme.of(context).textTheme.displaySmall?.copyWith(
                    color: Colors.white,
                    fontSize: 34,
                    height: 1,
                    letterSpacing: -1.2,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  'Book trusted local help for your home, work, health and events.',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.white.withValues(alpha: .76),
                    height: 1.4,
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

class _ServiceDestinationCard extends StatelessWidget {
  const _ServiceDestinationCard({required this.service, required this.onTap});

  final Service service;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final price = service.startingPrice == 0
        ? 'Free consultation'
        : 'From ${formatCurrency(service.startingPrice)} · ${service.pricingUnit}';
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Colors.white, Color(0xFFF5F8FF)],
        ),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFD9E4F7)),
        boxShadow: [
          BoxShadow(
            color: BncColors.deepBlue.withValues(alpha: .06),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(22),
          child: Padding(
            padding: const EdgeInsets.all(15),
            child: Row(
              children: [
                Container(
                  width: 54,
                  height: 54,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFF092B86), Color(0xFF0D59E7)],
                    ),
                    borderRadius: BorderRadius.circular(17),
                    boxShadow: [
                      BoxShadow(
                        color: BncColors.brand.withValues(alpha: .18),
                        blurRadius: 12,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Icon(
                    _serviceIcon(service.name),
                    color: Colors.white,
                    size: 25,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        service.name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w900),
                      ),
                      if (service.businessName.isNotEmpty) ...[
                        const SizedBox(height: 3),
                        Text(
                          service.businessName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: BncColors.muted),
                        ),
                      ],
                      const SizedBox(height: 7),
                      Wrap(
                        spacing: 7,
                        runSpacing: 6,
                        children: [
                          _ServiceMetaChip(
                            icon: Icons.payments_outlined,
                            label: price,
                            color: BncColors.brand,
                          ),
                          if (service.duration.isNotEmpty)
                            _ServiceMetaChip(
                              icon: Icons.schedule_rounded,
                              label: service.duration,
                              color: BncColors.muted,
                            ),
                          if (service.homeService)
                            const _ServiceMetaChip(
                              icon: Icons.home_work_outlined,
                              label: 'At your doorstep',
                              color: BncColors.verified,
                            ),
                          if (service.distanceKm != null ||
                              service.businessCity.isNotEmpty)
                            _ServiceMetaChip(
                              icon: Icons.location_on_outlined,
                              label: service.distanceKm != null
                                  ? '${service.distanceKm!.toStringAsFixed(1)} km'
                                  : service.businessCity,
                              color: BncColors.muted,
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 9),
                Container(
                  width: 36,
                  height: 36,
                  alignment: Alignment.center,
                  decoration: const BoxDecoration(
                    color: BncColors.sky,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.arrow_forward_rounded,
                    color: BncColors.brand,
                    size: 19,
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

class _ServiceMetaChip extends StatelessWidget {
  const _ServiceMetaChip({
    required this.icon,
    required this.label,
    required this.color,
  });

  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .08),
        borderRadius: BorderRadius.circular(99),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: color),
          const SizedBox(width: 4),
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: color,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

IconData _serviceIcon(String serviceName) {
  final name = serviceName.toLowerCase();
  if (name.contains('table') || name.contains('catering')) {
    return Icons.restaurant_rounded;
  }
  if (name.contains('laptop') || name.contains('screen')) {
    return Icons.devices_rounded;
  }
  if (name.contains('wedding') || name.contains('photography')) {
    return Icons.camera_alt_rounded;
  }
  if (name.contains('design')) return Icons.palette_rounded;
  if (name.contains('doctor')) return Icons.health_and_safety_rounded;
  if (name.contains('hair')) return Icons.content_cut_rounded;
  return Icons.handyman_rounded;
}

final servicesListProvider = FutureProvider<List<Service>>((ref) {
  final settings = ref.watch(appSettingsProvider);
  return ref
      .watch(appRepositoryProvider)
      .services(
        city: settings.apiLocation,
        latitude: settings.apiLatitude,
        longitude: settings.apiLongitude,
        radiusKm: settings.searchRadiusKm,
      );
});

typedef _CatalogueSearch = ({
  String query,
  String category,
  String stock,
  String city,
  String constituency,
  String district,
  String state,
  double? latitude,
  double? longitude,
  int radiusKm,
  bool courier,
  String sort,
});

final catalogueProductsProvider =
    FutureProvider.family<List<Product>, _CatalogueSearch>(
      (ref, search) => ref
          .watch(appRepositoryProvider)
          .products(
            query: search.query,
            category: search.category,
            stock: search.stock,
            city: search.city,
            constituency: search.constituency,
            district: search.district,
            state: search.state,
            latitude: search.latitude,
            longitude: search.longitude,
            radiusKm: search.radiusKm,
            courier: search.courier,
            sort: search.sort,
          ),
    );

final catalogueServicesProvider =
    FutureProvider.family<List<Service>, _CatalogueSearch>(
      (ref, search) => ref
          .watch(appRepositoryProvider)
          .services(
            query: search.query,
            city: search.city,
            constituency: search.constituency,
            district: search.district,
            state: search.state,
            latitude: search.latitude,
            longitude: search.longitude,
            radiusKm: search.radiusKm,
            sort: search.sort,
          ),
    );

class OffersScreen extends ConsumerWidget {
  const OffersScreen({super.key, this.city});

  final String? city;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = city == null
        ? ref.watch(offersProvider)
        : ref.watch(offersForCityProvider(city!));
    return Scaffold(
      appBar: AppBar(
        title: Text(city == null ? 'Offers near you' : 'Offers in $city'),
      ),
      body: state.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => ErrorState(error: error),
        data: (offers) => offers.isEmpty
            ? const EmptyState(
                icon: Icons.local_offer_outlined,
                title: 'No active offers',
                body: 'Current offers from live businesses will appear here.',
              )
            : _OffersDirectoryContent(offers: offers),
      ),
    );
  }
}

class _OffersDirectoryContent extends StatefulWidget {
  const _OffersDirectoryContent({required this.offers});

  final List<Offer> offers;

  @override
  State<_OffersDirectoryContent> createState() =>
      _OffersDirectoryContentState();
}

class _OffersDirectoryContentState extends State<_OffersDirectoryContent> {
  final _query = TextEditingController();

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final needle = _query.text.trim().toLowerCase();
    final filtered = widget.offers.where((offer) {
      final searchable = [
        offer.title,
        offer.description,
        offer.businessName,
        offer.discount,
        offer.code ?? '',
      ].join(' ').toLowerCase();
      return needle.isEmpty || searchable.contains(needle);
    }).toList();
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 30),
      children: [
        TextField(
          controller: _query,
          onChanged: (_) => setState(() {}),
          decoration: InputDecoration(
            hintText: 'Search offers, businesses or codes',
            prefixIcon: const Icon(Icons.search_rounded),
            suffixIcon: needle.isEmpty
                ? null
                : IconButton(
                    onPressed: () {
                      _query.clear();
                      setState(() {});
                    },
                    icon: const Icon(Icons.close_rounded),
                  ),
          ),
        ),
        const SizedBox(height: 12),
        Text(
          '${filtered.length} active ${filtered.length == 1 ? 'offer' : 'offers'}',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 12),
        if (filtered.isEmpty)
          const SizedBox(
            height: 360,
            child: EmptyState(
              icon: Icons.search_off_rounded,
              title: 'No matching offers',
              body: 'Try another offer, business name or coupon code.',
            ),
          )
        else
          for (var index = 0; index < filtered.length; index++) ...[
            _OfferDirectoryCard(offer: filtered[index]),
            if (index != filtered.length - 1) const SizedBox(height: 12),
          ],
      ],
    );
  }
}

class _OfferDirectoryCard extends ConsumerStatefulWidget {
  const _OfferDirectoryCard({required this.offer});

  final Offer offer;

  @override
  ConsumerState<_OfferDirectoryCard> createState() =>
      _OfferDirectoryCardState();
}

class _OfferDirectoryCardState extends ConsumerState<_OfferDirectoryCard> {
  bool _openingChat = false;

  Offer get offer => widget.offer;

  @override
  Widget build(BuildContext context) => Card(
    clipBehavior: Clip.antiAlias,
    child: InkWell(
      onTap: offer.businessSlug.isEmpty
          ? null
          : () => context.push('/business/${offer.businessSlug}'),
      child: Padding(
        padding: const EdgeInsets.all(19),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 58,
              height: 58,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: BncColors.brand,
                borderRadius: BorderRadius.circular(18),
              ),
              child: const Icon(Icons.local_offer_rounded, color: Colors.white),
            ),
            const SizedBox(width: 15),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    offer.discount,
                    style: Theme.of(
                      context,
                    ).textTheme.titleLarge?.copyWith(color: BncColors.brand),
                  ),
                  Text(
                    offer.title,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  if (offer.businessName.isNotEmpty)
                    Text(
                      offer.businessName,
                      style: Theme.of(
                        context,
                      ).textTheme.labelMedium?.copyWith(color: BncColors.brand),
                    ),
                  const SizedBox(height: 5),
                  Text(
                    offer.description,
                    style: Theme.of(
                      context,
                    ).textTheme.bodySmall?.copyWith(color: BncColors.muted),
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: [
                      if (offer.code != null)
                        ActionChip(
                          avatar: const Icon(
                            Icons.content_copy_rounded,
                            size: 15,
                          ),
                          label: Text(offer.code!),
                          onPressed: () async {
                            await Clipboard.setData(
                              ClipboardData(text: offer.code!),
                            );
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Offer code copied.'),
                                ),
                              );
                            }
                          },
                        ),
                      if (offer.businessId.isNotEmpty)
                        ActionChip(
                          avatar: _openingChat
                              ? const SizedBox.square(
                                  dimension: 15,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                )
                              : const Icon(Icons.forum_outlined, size: 15),
                          label: Text(
                            _openingChat ? 'Opening chat…' : 'Check in chat',
                          ),
                          onPressed: _openingChat ? null : _startChat,
                        ),
                      if (offer.businessLocality.isNotEmpty ||
                          offer.businessCity.isNotEmpty)
                        Chip(
                          avatar: const Icon(
                            Icons.location_on_outlined,
                            size: 15,
                          ),
                          label: Text(
                            [
                              offer.businessLocality,
                              offer.businessCity,
                            ].where((value) => value.isNotEmpty).join(', '),
                          ),
                        ),
                      Chip(label: Text('Until ${_shortDate(offer.expiresAt)}')),
                      if (offer.minimumSpend case final spend?)
                        Chip(label: Text('Min ${formatCurrency(spend)}')),
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

  Future<void> _startChat() async {
    if (!ref.read(sessionProvider).authenticated) {
      final returnTo = GoRouterState.of(context).uri.toString();
      context.push('/login?returnTo=${Uri.encodeQueryComponent(returnTo)}');
      return;
    }
    setState(() => _openingChat = true);
    try {
      final conversationId = await ref
          .read(appRepositoryProvider)
          .startBusinessConversation(
            offer.businessId,
            'Hi, I found the “${offer.title}” offer on BNC. Is it available?',
          );
      if (mounted) context.push('/messages/$conversationId');
    } on Object catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$error')));
      }
    } finally {
      if (mounted) setState(() => _openingChat = false);
    }
  }
}

final offersForCityProvider = FutureProvider.family<List<Offer>, String>(
  (ref, city) => ref.watch(appRepositoryProvider).offers(city: city),
);

String _shortDate(String value) {
  final date = DateTime.tryParse(value)?.toLocal();
  if (date == null) return value;
  return '${date.day.toString().padLeft(2, '0')}/'
      '${date.month.toString().padLeft(2, '0')}/${date.year}';
}

IconData _categoryIcon(String icon) => switch (icon) {
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

extension<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
