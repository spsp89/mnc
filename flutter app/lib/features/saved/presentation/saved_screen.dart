import 'package:bnc_mobile/core/data/app_repository.dart';
import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/core/state/app_state.dart';
import 'package:bnc_mobile/design_system/components.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

final savedBusinessesProvider = FutureProvider<List<Business>>((ref) async {
  ref.watch(savedProvider);
  return ref.watch(appRepositoryProvider).savedBusinesses();
});

final savedProductsProvider = FutureProvider<List<Product>>(
  (ref) => ref.watch(appRepositoryProvider).savedProducts(),
);
final savedRecentBusinessesProvider = FutureProvider<List<Business>>(
  (ref) => ref.watch(appRepositoryProvider).recentBusinesses(),
);

class SavedScreen extends ConsumerWidget {
  const SavedScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (!ref.watch(sessionProvider).authenticated) {
      return Scaffold(
        appBar: AppBar(title: const Text('Saved')),
        body: EmptyState(
          icon: Icons.bookmark_border_rounded,
          title: 'Sign in to see saved items',
          body:
              'Saved businesses and products stay connected to your BNC account.',
          action: () => context.push(
            '/login?returnTo=${Uri.encodeQueryComponent('/saved')}',
          ),
          actionLabel: 'Sign in',
        ),
      );
    }
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Saved'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Businesses'),
              Tab(text: 'Products'),
              Tab(text: 'Recent'),
            ],
          ),
        ),
        body: const TabBarView(
          children: [_SavedBusinesses(), _SavedProducts(), _RecentBusinesses()],
        ),
      ),
    );
  }
}

class _SavedBusinesses extends ConsumerWidget {
  const _SavedBusinesses();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(savedBusinessesProvider);
    return state.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => ErrorState(
        error: error,
        onRetry: () => ref.invalidate(savedBusinessesProvider),
      ),
      data: (items) => items.isEmpty
          ? EmptyState(
              icon: Icons.bookmark_border_rounded,
              title: 'Keep good local finds close',
              body:
                  'Save businesses while you browse, then compare or contact them later.',
              action: () => context.go('/search'),
              actionLabel: 'Explore businesses',
            )
          : RefreshIndicator(
              onRefresh: () async =>
                  ref.refresh(savedBusinessesProvider.future),
              child: ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                itemCount: items.length,
                separatorBuilder: (_, index) => const SizedBox(height: 12),
                itemBuilder: (context, index) =>
                    BusinessCard(business: items[index], compact: true),
              ),
            ),
    );
  }
}

class _SavedProducts extends ConsumerWidget {
  const _SavedProducts();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(savedProductsProvider);
    return state.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => ErrorState(
        error: error,
        onRetry: () => ref.invalidate(savedProductsProvider),
      ),
      data: (items) => items.isEmpty
          ? const EmptyState(
              icon: Icons.shopping_bag_outlined,
              title: 'No saved products',
              body: 'Products you save from the live marketplace appear here.',
            )
          : RefreshIndicator(
              onRefresh: () async => ref.refresh(savedProductsProvider.future),
              child: GridView.builder(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisExtent: 270,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                ),
                itemCount: items.length,
                itemBuilder: (context, index) => Stack(
                  children: [
                    ProductCard(product: items[index], width: double.infinity),
                    Positioned(
                      right: 8,
                      top: 8,
                      child: IconButton.filled(
                        tooltip: 'Remove from saved',
                        onPressed: () async {
                          await ref
                              .read(appRepositoryProvider)
                              .setProductSaved(items[index].id, saved: false);
                          ref.invalidate(savedProductsProvider);
                        },
                        icon: const Icon(Icons.bookmark_remove_rounded),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}

class _RecentBusinesses extends ConsumerWidget {
  const _RecentBusinesses();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(savedRecentBusinessesProvider);
    return state.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => ErrorState(
        error: error,
        onRetry: () => ref.invalidate(savedRecentBusinessesProvider),
      ),
      data: (items) => items.isEmpty
          ? const EmptyState(
              icon: Icons.history_rounded,
              title: 'No recently viewed businesses',
              body: 'Business profiles you open will appear here.',
            )
          : RefreshIndicator(
              onRefresh: () async =>
                  ref.refresh(savedRecentBusinessesProvider.future),
              child: ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                itemCount: items.length,
                separatorBuilder: (_, _) => const SizedBox(height: 12),
                itemBuilder: (context, index) =>
                    BusinessCard(business: items[index], compact: true),
              ),
            ),
    );
  }
}
