import 'package:bnc_mobile/core/config/app_config.dart';
import 'package:bnc_mobile/core/data/app_repository.dart';
import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/core/state/app_state.dart';
import 'package:bnc_mobile/design_system/bnc_theme.dart';
import 'package:bnc_mobile/design_system/components.dart';
import 'package:bnc_mobile/features/saved/presentation/saved_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

final productProvider = FutureProvider.family<Product, String>(
  (ref, id) => ref.watch(appRepositoryProvider).product(id),
);

class ProductDetailScreen extends ConsumerWidget {
  const ProductDetailScreen({required this.id, super.key});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(productProvider(id));
    final authenticated = ref.watch(sessionProvider).authenticated;
    final savedProducts = authenticated
        ? ref.watch(savedProductsProvider).valueOrNull
        : null;
    final isSaved = savedProducts?.any((product) => product.id == id) ?? false;
    final product = state.valueOrNull;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Product'),
        actions: [
          IconButton(
            tooltip: isSaved ? 'Remove from saved' : 'Save product',
            onPressed: () async {
              if (!authenticated) {
                context.push(
                  '/login?returnTo=${Uri.encodeQueryComponent('/product/$id')}',
                );
                return;
              }
              try {
                await ref
                    .read(appRepositoryProvider)
                    .setProductSaved(id, saved: !isSaved);
                ref.invalidate(savedProductsProvider);
              } on Object catch (error) {
                if (context.mounted) {
                  ScaffoldMessenger.of(
                    context,
                  ).showSnackBar(SnackBar(content: Text('$error')));
                }
              }
            },
            icon: Icon(
              isSaved ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
            ),
          ),
          IconButton(
            onPressed: product == null
                ? null
                : () => SharePlus.instance.share(
                    ShareParams(
                      text:
                          '${product.name} on BNC\n'
                          '${AppConfig.siteBaseUrl}/products/${product.id}',
                    ),
                  ),
            icon: const Icon(Icons.ios_share_rounded),
          ),
          IconButton(
            onPressed: () => context.push('/cart'),
            icon: Badge(
              isLabelVisible: ref.watch(cartProvider).isNotEmpty,
              label: Text('${ref.watch(cartProvider).length}'),
              child: const Icon(Icons.shopping_bag_outlined),
            ),
          ),
        ],
      ),
      body: state.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => ErrorState(error: error),
        data: (product) => ListView(
          padding: const EdgeInsets.only(bottom: 110),
          children: [
            AspectRatio(
              aspectRatio: 1.08,
              child: BncNetworkImage(url: product.imageUrl),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 22, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      StatusBadge(
                        label: product.inStock
                            ? 'Available nearby'
                            : 'Out of stock',
                        color: product.inStock
                            ? BncColors.brand
                            : BncColors.muted,
                      ),
                      if (product.discountPrice != null) ...[
                        const SizedBox(width: 7),
                        const StatusBadge(
                          label: 'Local deal',
                          color: BncColors.brand,
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 14),
                  Text(
                    product.category.toUpperCase(),
                    style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: BncColors.muted,
                      letterSpacing: .9,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    product.name,
                    style: Theme.of(context).textTheme.headlineLarge,
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    crossAxisAlignment: WrapCrossAlignment.center,
                    spacing: 10,
                    children: [
                      Text(
                        formatCurrency(product.effectivePrice),
                        style: Theme.of(context).textTheme.headlineMedium
                            ?.copyWith(color: BncColors.deepBlue),
                      ),
                      if (product.discountPrice != null)
                        Text(
                          formatCurrency(product.price),
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(
                                color: BncColors.muted,
                                decoration: TextDecoration.lineThrough,
                              ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'About this product',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    product.description.isEmpty
                        ? 'A quality product available from a trusted local BNC seller. Contact the business for current variants and availability.'
                        : product.description,
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  if (product.minimumOrderQty > 1 ||
                      product.homeDeliveryAvailable) ...[
                    const SizedBox(height: 22),
                    Text(
                      'Purchase details',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 9),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        if (product.minimumOrderQty > 1)
                          Chip(
                            avatar: const Icon(
                              Icons.inventory_2_outlined,
                              size: 17,
                            ),
                            label: Text('Minimum ${product.minimumOrderQty}'),
                          ),
                        if (product.homeDeliveryAvailable)
                          Chip(
                            avatar: const Icon(
                              Icons.local_shipping_outlined,
                              size: 17,
                            ),
                            label: Text(
                              product.courierDeliveryAvailable
                                  ? 'Courier available'
                                  : 'Home delivery available',
                            ),
                          ),
                      ],
                    ),
                  ],
                  if (product.businessName.isNotEmpty) ...[
                    const SizedBox(height: 22),
                    Card(
                      color: const Color(0xFFEAF2FF),
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Sold by',
                              style: Theme.of(context).textTheme.labelMedium
                                  ?.copyWith(color: BncColors.muted),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              product.businessName,
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                if (product.businessSlug.isNotEmpty)
                                  Expanded(
                                    child: OutlinedButton.icon(
                                      onPressed: () => context.push(
                                        '/business/${product.businessSlug}',
                                      ),
                                      icon: const Icon(
                                        Icons.storefront_outlined,
                                      ),
                                      label: const Text('View seller'),
                                    ),
                                  ),
                                if (product.businessSlug.isNotEmpty)
                                  const SizedBox(width: 9),
                                Expanded(
                                  child: OutlinedButton.icon(
                                    onPressed: product.businessId.isEmpty
                                        ? null
                                        : () =>
                                              _startChat(context, ref, product),
                                    icon: const Icon(Icons.chat_outlined),
                                    label: const Text('BNC chat'),
                                  ),
                                ),
                              ],
                            ),
                            if (product.businessPhone.isNotEmpty) ...[
                              const SizedBox(height: 9),
                              SizedBox(
                                width: double.infinity,
                                child: OutlinedButton.icon(
                                  onPressed: () =>
                                      _callSeller(context, product),
                                  icon: const Icon(Icons.phone_outlined),
                                  label: const Text('Call seller'),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ],
                  _RelatedProducts(current: product),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: state.valueOrNull == null
          ? null
          : SafeArea(
              child: Container(
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  border: Border(
                    top: BorderSide(color: Theme.of(context).dividerColor),
                  ),
                ),
                child: Row(
                  children: [
                    OutlinedButton(
                      onPressed: () => context.push(
                        '/enquiry',
                        extra: {'product': state.requireValue},
                      ),
                      child: const Text('Ask seller'),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed:
                            state.requireValue.inStock &&
                                state.requireValue.businessId.isNotEmpty
                            ? () {
                                ref
                                    .read(cartProvider.notifier)
                                    .add(state.requireValue);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: const Text('Added to your cart'),
                                    action: SnackBarAction(
                                      label: 'View cart',
                                      onPressed: () => context.push('/cart'),
                                    ),
                                  ),
                                );
                              }
                            : null,
                        icon: const Icon(Icons.add_shopping_cart_rounded),
                        label: const Text('Add to cart'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Future<void> _startChat(
    BuildContext context,
    WidgetRef ref,
    Product product,
  ) async {
    if (!ref.read(sessionProvider).authenticated) {
      context.push(
        '/login?returnTo=${Uri.encodeQueryComponent('/product/${product.id}')}',
      );
      return;
    }
    try {
      final conversationId = await ref
          .read(appRepositoryProvider)
          .startBusinessConversation(
            product.businessId,
            'Hi, is ${product.name} currently available?',
          );
      if (context.mounted) context.push('/messages/$conversationId');
    } on Object catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$error')));
      }
    }
  }

  Future<void> _callSeller(BuildContext context, Product product) async {
    final phone = product.businessPhone.replaceAll(RegExp(r'[^0-9+]'), '');
    final launched =
        phone.isNotEmpty && await launchUrl(Uri(scheme: 'tel', path: phone));
    if (!launched && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('The seller phone could not be opened.')),
      );
    }
  }
}

class _RelatedProducts extends ConsumerWidget {
  const _RelatedProducts({required this.current});

  final Product current;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final related =
        (ref.watch(productsProvider).valueOrNull ?? const <Product>[])
            .where(
              (item) =>
                  item.id != current.id &&
                  (item.businessId == current.businessId ||
                      item.category == current.category),
            )
            .take(4)
            .toList();
    if (related.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 26),
        Row(
          children: [
            Expanded(
              child: Text(
                'More local products',
                style: Theme.of(context).textTheme.titleLarge,
              ),
            ),
            TextButton(
              onPressed: () => context.push('/products'),
              child: const Text('View all'),
            ),
          ],
        ),
        const SizedBox(height: 7),
        for (final item in related)
          Padding(
            padding: const EdgeInsets.only(bottom: 9),
            child: Card(
              child: ListTile(
                onTap: () => context.push('/product/${item.id}'),
                leading: SizedBox.square(
                  dimension: 48,
                  child: BncNetworkImage(
                    url: item.imageUrl,
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                title: Text(item.name),
                subtitle: Text(formatCurrency(item.effectivePrice)),
                trailing: const Icon(Icons.chevron_right_rounded),
              ),
            ),
          ),
      ],
    );
  }
}
