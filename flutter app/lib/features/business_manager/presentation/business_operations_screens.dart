import 'package:bnc_mobile/core/data/app_repository.dart';
import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/core/state/app_state.dart';
import 'package:bnc_mobile/design_system/bnc_theme.dart';
import 'package:bnc_mobile/design_system/components.dart';
import 'package:bnc_mobile/features/business_manager/presentation/business_dashboard_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

class BusinessLeadsScreen extends ConsumerWidget {
  const BusinessLeadsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(leadsProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Local leads'),
        actions: [
          IconButton(
            onPressed: () => _leadInfo(context),
            icon: const Icon(Icons.info_outline_rounded),
          ),
        ],
      ),
      body: state.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => ErrorState(
          error: error,
          onRetry: () => ref.invalidate(leadsProvider),
        ),
        data: (items) => items.isEmpty
            ? const EmptyState(
                icon: Icons.bolt_outlined,
                title: 'No active leads',
                body:
                    'Relevant consented customer needs will appear here when matched.',
              )
            : RefreshIndicator(
                onRefresh: () async => ref.refresh(leadsProvider.future),
                child: ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                  itemCount: items.length,
                  separatorBuilder: (_, index) => const SizedBox(height: 11),
                  itemBuilder: (context, index) =>
                      _LeadCard(initialLead: items[index]),
                ),
              ),
      ),
    );
  }

  Future<void> _leadInfo(BuildContext context) async {
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) => const Padding(
        padding: EdgeInsets.fromLTRB(20, 4, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'How BNC protects customer contact',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
            ),
            SizedBox(height: 10),
            Text(
              'Before acceptance you see the requirement and approximate location only. Accepting atomically checks assignment status, quota and customer consent before decrypting contact details.',
            ),
          ],
        ),
      ),
    );
  }
}

class _LeadCard extends ConsumerStatefulWidget {
  const _LeadCard({required this.initialLead});

  final Lead initialLead;

  @override
  ConsumerState<_LeadCard> createState() => _LeadCardState();
}

class _LeadCardState extends ConsumerState<_LeadCard> {
  late Lead lead = widget.initialLead;
  bool busy = false;

  Future<void> _accept() async {
    setState(() => busy = true);
    try {
      lead = await ref
          .read(appRepositoryProvider)
          .acceptLead(lead.assignmentId);
      setState(() {});
    } on Object catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$error')));
      }
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> _decline() async {
    await ref.read(appRepositoryProvider).declineLead(lead.assignmentId);
    ref.invalidate(leadsProvider);
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: const EdgeInsets.all(17),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                StatusBadge(
                  label: lead.status,
                  color: lead.status == 'ACCEPTED'
                      ? BncColors.verified
                      : BncColors.offer,
                ),
                const Spacer(),
                Text(
                  lead.createdAt,
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: BncColors.muted),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Text(
              lead.category,
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                color: BncColors.brand,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              lead.requirement,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 11),
            Row(
              children: [
                const Icon(
                  Icons.location_on_outlined,
                  color: BncColors.muted,
                  size: 18,
                ),
                const SizedBox(width: 5),
                Text('${lead.locality} · Approximate area'),
              ],
            ),
            const SizedBox(height: 15),
            if (lead.contactRevealed)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(15),
                decoration: BoxDecoration(
                  color: BncColors.verified.withValues(alpha: .08),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Contact released after acceptance',
                      style: TextStyle(
                        color: BncColors.verified,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 7),
                    Text(
                      lead.contactName!,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    Text(lead.contactPhone!),
                  ],
                ),
              )
            else
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: BncColors.sky,
                  borderRadius: BorderRadius.circular(15),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.lock_outline_rounded, color: BncColors.verified),
                    SizedBox(width: 9),
                    Expanded(
                      child: Text(
                        'Contact is hidden until you accept and the server confirms consent and quota.',
                      ),
                    ),
                  ],
                ),
              ),
            if (!lead.contactRevealed) ...[
              const SizedBox(height: 15),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: busy ? null : _decline,
                      child: const Text('Decline'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton.icon(
                      onPressed: busy ? null : _accept,
                      icon: busy
                          ? const SizedBox.square(
                              dimension: 17,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : const Icon(Icons.lock_open_rounded),
                      label: const Text('Accept & reveal'),
                    ),
                  ),
                ],
              ),
            ] else ...[
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => context.push('/business/messages'),
                  icon: const Icon(Icons.chat_bubble_outline_rounded),
                  label: const Text('Open conversation'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class BusinessCatalogueScreen extends ConsumerStatefulWidget {
  const BusinessCatalogueScreen({super.key});

  @override
  ConsumerState<BusinessCatalogueScreen> createState() =>
      _BusinessCatalogueScreenState();
}

class _BusinessCatalogueScreenState
    extends ConsumerState<BusinessCatalogueScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final businessState = ref.watch(activeManagedBusinessProvider);
    final business = businessState.valueOrNull;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Catalogue'),
        bottom: TabBar(
          controller: _tabs,
          tabs: const [
            Tab(text: 'Products'),
            Tab(text: 'Services'),
            Tab(text: 'Offers'),
          ],
        ),
      ),
      floatingActionButton: business == null
          ? null
          : FloatingActionButton.extended(
              onPressed: () {
                if (_tabs.index == 0 &&
                    business.productLimit > 0 &&
                    business.products.length >= business.productLimit) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        '${business.planName} allows ${business.productLimit} products. Archive a product or upgrade the plan.',
                      ),
                    ),
                  );
                  return;
                }
                switch (_tabs.index) {
                  case 0:
                    _productEditor(context, ref, business);
                  case 1:
                    _addService(context, ref, business);
                  default:
                    _addOffer(context, ref, business);
                }
              },
              icon: const Icon(Icons.add_rounded),
              label: const Text('Add'),
            ),
      body: businessState.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => ErrorState(error: error),
        data: (business) => business == null
            ? const EmptyState(
                icon: Icons.inventory_2_outlined,
                title: 'Create a business first',
                body: 'A catalogue belongs to a managed BNC business.',
              )
            : TabBarView(
                controller: _tabs,
                children: [
                  _ProductsManager(business: business),
                  _ServicesManager(business: business),
                  _OffersManager(business: business),
                ],
              ),
      ),
    );
  }
}

class _ProductsManager extends ConsumerWidget {
  const _ProductsManager({required this.business});

  final Business business;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final products = business.products;
    if (products.isEmpty) {
      return const EmptyState(
        icon: Icons.inventory_2_outlined,
        title: 'No products yet',
        body: 'Add products customers can discover and order locally.',
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 100),
      itemCount: products.length,
      separatorBuilder: (_, index) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final product = products[index];
        return Card(
          child: ListTile(
            minTileHeight: 82,
            leading: SizedBox(
              width: 58,
              height: 58,
              child: BncNetworkImage(
                url: product.imageUrl,
                borderRadius: BorderRadius.circular(13),
              ),
            ),
            title: Text(product.name),
            subtitle: Text(
              '${formatCurrency(product.effectivePrice)} · ${product.stockStatus.replaceAll('_', ' ')} · ${product.status.replaceAll('_', ' ')}',
            ),
            trailing: PopupMenuButton<String>(
              onSelected: (value) async {
                try {
                  if (value == 'edit') {
                    await _productEditor(
                      context,
                      ref,
                      business,
                      product: product,
                    );
                  } else if (value == 'submit') {
                    await ref
                        .read(appRepositoryProvider)
                        .submitProduct(product.id);
                    ref.invalidate(myBusinessesProvider);
                    ref.invalidate(activeManagedBusinessProvider);
                  } else if (value == 'delete') {
                    await ref
                        .read(appRepositoryProvider)
                        .deleteProduct(product.id);
                    ref.invalidate(myBusinessesProvider);
                    ref.invalidate(activeManagedBusinessProvider);
                  }
                } on Object catch (error) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(
                      context,
                    ).showSnackBar(SnackBar(content: Text('$error')));
                  }
                }
              },
              itemBuilder: (context) => [
                if (['DRAFT', 'REJECTED', 'PUBLISHED'].contains(product.status))
                  const PopupMenuItem(value: 'edit', child: Text('Edit')),
                if (['DRAFT', 'REJECTED'].contains(product.status))
                  const PopupMenuItem(
                    value: 'submit',
                    child: Text('Submit for review'),
                  ),
                const PopupMenuItem(value: 'delete', child: Text('Archive')),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _ServicesManager extends ConsumerWidget {
  const _ServicesManager({required this.business});

  final Business business;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final services = business.services;
    if (services.isEmpty) {
      return const EmptyState(
        icon: Icons.handyman_outlined,
        title: 'No services yet',
        body: 'Explain what your team offers and how pricing works.',
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 100),
      itemCount: services.length,
      separatorBuilder: (_, index) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final service = services[index];
        return Card(
          child: ListTile(
            minTileHeight: 78,
            leading: Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: BncColors.brand.withValues(alpha: .09),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(Icons.handyman_rounded, color: BncColors.brand),
            ),
            title: Text(service.name),
            subtitle: Text(
              service.startingPrice == 0
                  ? 'Quote based'
                  : 'From ${formatCurrency(service.startingPrice)}',
            ),
            trailing: PopupMenuButton<String>(
              onSelected: (value) async {
                if (value == 'delete') {
                  await ref
                      .read(appRepositoryProvider)
                      .deleteService(service.id);
                  ref.invalidate(myBusinessesProvider);
                }
              },
              itemBuilder: (context) => const [
                PopupMenuItem(value: 'edit', child: Text('Edit')),
                PopupMenuItem(value: 'delete', child: Text('Archive')),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _OffersManager extends ConsumerWidget {
  const _OffersManager({required this.business});

  final Business business;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final offers = business.offer == null ? <Offer>[] : [business.offer!];
    if (offers.isEmpty) {
      return const EmptyState(
        icon: Icons.local_offer_outlined,
        title: 'No active offers',
        body: 'Create useful, time-bound value without misleading claims.',
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 100),
      itemCount: offers.length,
      separatorBuilder: (_, index) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final offer = offers[index];
        return Card(
          color: const Color(0xFFFFF8F3),
          child: Padding(
            padding: const EdgeInsets.all(17),
            child: Row(
              children: [
                const Icon(Icons.local_offer_rounded, color: BncColors.offer),
                const SizedBox(width: 13),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        offer.discount,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: BncColors.offer,
                        ),
                      ),
                      Text(offer.title),
                      Text(
                        'Ends ${offer.expiresAt}',
                        style: Theme.of(
                          context,
                        ).textTheme.bodySmall?.copyWith(color: BncColors.muted),
                      ),
                    ],
                  ),
                ),
                PopupMenuButton<String>(
                  itemBuilder: (context) => const [
                    PopupMenuItem(value: 'pause', child: Text('Pause offer')),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

Future<void> _productEditor(
  BuildContext context,
  WidgetRef ref,
  Business business, {
  Product? product,
}) async {
  final name = TextEditingController(text: product?.name);
  final brand = TextEditingController(text: product?.brand);
  final description = TextEditingController(text: product?.description);
  final price = TextEditingController(
    text: product == null ? '' : product.price.toStringAsFixed(2),
  );
  final discountPrice = TextEditingController(
    text: product?.discountPrice?.toStringAsFixed(2),
  );
  final minimumOrderQty = TextEditingController(
    text: '${product?.minimumOrderQty ?? 1}',
  );
  final categories = ref.read(categoriesProvider).valueOrNull ?? const [];
  final categoryOptions = _flattenCategories(
    categories,
  ).where((category) => business.categoryIds.contains(category.id)).toList();
  var categoryId = product?.categoryId.isNotEmpty == true
      ? product!.categoryId
      : categoryOptions.firstOrNull?.id ?? '';
  var stockStatus = product?.stockStatus ?? 'IN_STOCK';
  var homeDelivery =
      product?.deliveryOptions.contains('home_delivery') ?? false;
  var selectedImages = <XFile>[];
  var busy = false;
  String? validationMessage;
  final saved = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (sheetContext) => StatefulBuilder(
      builder: (context, setState) => Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          12,
          20,
          MediaQuery.viewInsetsOf(context).bottom + 20,
        ),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      product == null ? 'Add a product' : 'Edit product',
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                  ),
                  IconButton(
                    onPressed: busy ? null : () => Navigator.pop(sheetContext),
                    icon: const Icon(Icons.close_rounded),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              TextField(
                controller: name,
                textCapitalization: TextCapitalization.words,
                maxLength: 160,
                decoration: const InputDecoration(labelText: 'Product name'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: brand,
                maxLength: 100,
                decoration: const InputDecoration(
                  labelText: 'Brand (optional)',
                ),
              ),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                initialValue: categoryId.isEmpty ? null : categoryId,
                decoration: const InputDecoration(labelText: 'Category'),
                items: categoryOptions
                    .map(
                      (category) => DropdownMenuItem(
                        value: category.id,
                        child: Text(
                          category.label,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    )
                    .toList(),
                onChanged: (value) => categoryId = value ?? categoryId,
              ),
              const SizedBox(height: 10),
              TextField(
                controller: description,
                minLines: 3,
                maxLines: 6,
                maxLength: 5000,
                decoration: const InputDecoration(labelText: 'Description'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: price,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                decoration: const InputDecoration(
                  labelText: 'Regular price',
                  prefixText: '₹ ',
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: discountPrice,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                decoration: const InputDecoration(
                  labelText: 'Offer price (optional)',
                  prefixText: '₹ ',
                ),
              ),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                initialValue: stockStatus,
                decoration: const InputDecoration(labelText: 'Stock status'),
                items: const [
                  DropdownMenuItem(value: 'IN_STOCK', child: Text('In stock')),
                  DropdownMenuItem(
                    value: 'LOW_STOCK',
                    child: Text('Low stock'),
                  ),
                  DropdownMenuItem(
                    value: 'OUT_OF_STOCK',
                    child: Text('Out of stock'),
                  ),
                  DropdownMenuItem(
                    value: 'MADE_TO_ORDER',
                    child: Text('Made to order'),
                  ),
                ],
                onChanged: (value) => stockStatus = value ?? stockStatus,
              ),
              const SizedBox(height: 10),
              TextField(
                controller: minimumOrderQty,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Minimum order quantity',
                ),
              ),
              const SizedBox(height: 8),
              if (business.deliveryEnabled)
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  value: homeDelivery,
                  onChanged: busy
                      ? null
                      : (value) => setState(() => homeDelivery = value),
                  title: const Text('Home delivery available'),
                  subtitle: const Text(
                    'The customer label is shown only when this is enabled.',
                  ),
                )
              else
                const ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Icon(Icons.lock_outline_rounded),
                  title: Text('Delivery integration not included'),
                  subtitle: Text(
                    'Choose Platinum, Diamond or Ruby to add delivery options.',
                  ),
                ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: busy
                    ? null
                    : () async {
                        final images = await ImagePicker().pickMultiImage(
                          maxWidth: 1920,
                          maxHeight: 1920,
                          imageQuality: 82,
                          limit: 6,
                        );
                        if (images.isNotEmpty) {
                          setState(
                            () => selectedImages = images.take(6).toList(),
                          );
                        }
                      },
                icon: const Icon(Icons.add_photo_alternate_outlined),
                label: Text(
                  selectedImages.isEmpty
                      ? product?.imageUrl.isNotEmpty == true
                            ? 'Replace product photos'
                            : 'Add product photos'
                      : '${selectedImages.length} photo${selectedImages.length == 1 ? '' : 's'} selected',
                ),
              ),
              const SizedBox(height: 5),
              const Text(
                'Up to 6 photos. Images are automatically resized to 1920 px and compressed before upload.',
              ),
              if (validationMessage != null) ...[
                const SizedBox(height: 10),
                Text(
                  validationMessage!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ],
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: busy
                      ? null
                      : () async {
                          final regular = double.tryParse(price.text);
                          final discount = double.tryParse(discountPrice.text);
                          final minimum = int.tryParse(minimumOrderQty.text);
                          if (name.text.trim().length < 2 ||
                              description.text.trim().length < 10 ||
                              regular == null ||
                              regular < 0 ||
                              (discount != null && discount > regular) ||
                              minimum == null ||
                              minimum < 1 ||
                              categoryId.isEmpty) {
                            setState(() {
                              validationMessage =
                                  'Complete the name, category, description, valid prices and quantity.';
                            });
                            return;
                          }
                          setState(() {
                            busy = true;
                            validationMessage = null;
                          });
                          try {
                            List<Json>? media;
                            if (selectedImages.isNotEmpty) {
                              media = [];
                              for (
                                var index = 0;
                                index < selectedImages.length;
                                index++
                              ) {
                                final image = selectedImages[index];
                                final bytes = await image.readAsBytes();
                                final contentType =
                                    image.mimeType ??
                                    _imageContentType(image.name);
                                final objectKey = await ref
                                    .read(appRepositoryProvider)
                                    .uploadPrivateImage(
                                      bytes: bytes,
                                      fileName: image.name,
                                      contentType: contentType,
                                      purpose: 'product_image',
                                      businessId: business.id,
                                    );
                                media.add({
                                  'objectKey': objectKey,
                                  'mediaType': 'image',
                                  'altText':
                                      '${name.text.trim()} product image ${index + 1}',
                                  'sortOrder': index,
                                  'variant': 'gallery',
                                });
                              }
                            }
                            final payload = <String, dynamic>{
                              'categoryId': categoryId,
                              'name': name.text.trim(),
                              'slug': product?.slug.isNotEmpty == true
                                  ? product!.slug
                                  : '${_slug(name.text)}-${DateTime.now().millisecondsSinceEpoch.toRadixString(36)}',
                              'brand': brand.text.trim().isEmpty
                                  ? null
                                  : brand.text.trim(),
                              'description': description.text.trim(),
                              'price': regular,
                              'discountPrice': discount,
                              'stockStatus': stockStatus,
                              'minimumOrderQty': minimum,
                              'deliveryOptions': homeDelivery
                                  ? ['home_delivery']
                                  : <String>[],
                              if (media != null) 'media': media,
                            };
                            if (product == null) {
                              await ref
                                  .read(appRepositoryProvider)
                                  .createProduct({
                                    ...payload,
                                    'businessId': business.id,
                                  });
                            } else {
                              await ref
                                  .read(appRepositoryProvider)
                                  .updateProduct(product.id, payload);
                            }
                            if (sheetContext.mounted) {
                              Navigator.pop(sheetContext, true);
                            }
                          } on Object catch (error) {
                            setState(() {
                              busy = false;
                              validationMessage = '$error';
                            });
                          }
                        },
                  icon: busy
                      ? const SizedBox.square(
                          dimension: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.save_outlined),
                  label: Text(busy ? 'Saving…' : 'Save product'),
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
  name.dispose();
  brand.dispose();
  description.dispose();
  price.dispose();
  discountPrice.dispose();
  minimumOrderQty.dispose();
  if (saved == true) {
    ref.invalidate(myBusinessesProvider);
    ref.invalidate(activeManagedBusinessProvider);
  }
}

typedef _CategoryChoice = ({String id, String label});

List<_CategoryChoice> _flattenCategories(
  List<Category> categories, [
  List<String> parents = const [],
]) => categories.expand((category) {
  final path = [...parents, category.name];
  return <_CategoryChoice>[
    (id: category.id, label: path.join(' › ')),
    ..._flattenCategories(category.children, path),
  ];
}).toList();

String _imageContentType(String fileName) {
  final lower = fileName.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

Future<void> _addService(
  BuildContext context,
  WidgetRef ref,
  Business business,
) async {
  final name = TextEditingController();
  final description = TextEditingController();
  final price = TextEditingController();
  final categories = ref.read(categoriesProvider).valueOrNull ?? const [];
  final categoryOptions = _flattenCategories(
    categories,
  ).where((category) => business.categoryIds.contains(category.id)).toList();
  var categoryId = categoryOptions.firstOrNull?.id ?? '';
  final saved = await _entitySheet(
    context,
    title: 'Add a service',
    fields: [
      TextField(
        controller: name,
        decoration: const InputDecoration(labelText: 'Service name'),
      ),
      TextField(
        controller: description,
        minLines: 3,
        maxLines: 5,
        decoration: const InputDecoration(labelText: 'Description'),
      ),
      TextField(
        controller: price,
        keyboardType: const TextInputType.numberWithOptions(decimal: true),
        decoration: const InputDecoration(
          labelText: 'Starting price',
          prefixText: '₹ ',
        ),
      ),
      DropdownButtonFormField<String>(
        initialValue: categoryId.isEmpty ? null : categoryId,
        decoration: const InputDecoration(labelText: 'Category'),
        items: categoryOptions
            .map(
              (category) => DropdownMenuItem(
                value: category.id,
                child: Text(category.label),
              ),
            )
            .toList(),
        onChanged: (value) => categoryId = value ?? categoryId,
      ),
    ],
    onSave: () async {
      if (name.text.trim().length < 2 ||
          description.text.trim().length < 10 ||
          categoryId.isEmpty) {
        return false;
      }
      await ref.read(appRepositoryProvider).createService({
        'businessId': business.id,
        'categoryId': categoryId,
        'name': name.text.trim(),
        'slug': _slug(name.text),
        'description': description.text.trim(),
        if (double.tryParse(price.text) != null)
          'startingPrice': double.parse(price.text),
        'pricingType': 'STARTING_AT',
        'homeService': true,
      });
      return true;
    },
  );
  name.dispose();
  description.dispose();
  price.dispose();
  if (saved) ref.invalidate(myBusinessesProvider);
}

Future<void> _addOffer(
  BuildContext context,
  WidgetRef ref,
  Business business,
) async {
  final title = TextEditingController();
  final description = TextEditingController();
  final discount = TextEditingController();
  final saved = await _entitySheet(
    context,
    title: 'Create an offer',
    fields: [
      TextField(
        controller: title,
        decoration: const InputDecoration(labelText: 'Offer title'),
      ),
      TextField(
        controller: description,
        minLines: 3,
        maxLines: 5,
        decoration: const InputDecoration(labelText: 'Clear offer terms'),
      ),
      TextField(
        controller: discount,
        keyboardType: TextInputType.number,
        decoration: const InputDecoration(
          labelText: 'Discount percentage',
          suffixText: '%',
        ),
      ),
    ],
    onSave: () async {
      if (title.text.trim().length < 3 ||
          description.text.trim().length < 10 ||
          double.tryParse(discount.text) == null) {
        return false;
      }
      final now = DateTime.now();
      await ref.read(appRepositoryProvider).createOffer({
        'businessId': business.id,
        'title': title.text.trim(),
        'description': description.text.trim(),
        'type': 'PERCENTAGE',
        'discountValue': double.parse(discount.text),
        'startsAt': now.toIso8601String(),
        'endsAt': now.add(const Duration(days: 30)).toIso8601String(),
      });
      return true;
    },
  );
  title.dispose();
  description.dispose();
  discount.dispose();
  if (saved) ref.invalidate(myBusinessesProvider);
}

Future<bool> _entitySheet(
  BuildContext context, {
  required String title,
  required List<Widget> fields,
  required Future<bool> Function() onSave,
}) async {
  var busy = false;
  final result = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (context) => StatefulBuilder(
      builder: (context, setState) => Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          4,
          20,
          MediaQuery.viewInsetsOf(context).bottom + 20,
        ),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 16),
              for (var index = 0; index < fields.length; index++) ...[
                fields[index],
                if (index < fields.length - 1) const SizedBox(height: 11),
              ],
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: busy
                      ? null
                      : () async {
                          setState(() => busy = true);
                          final success = await onSave();
                          if (context.mounted && success) {
                            Navigator.pop(context, true);
                          } else {
                            setState(() => busy = false);
                          }
                        },
                  child: busy
                      ? const SizedBox.square(
                          dimension: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Text('Save'),
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
  return result ?? false;
}

final businessOrdersProvider = FutureProvider<List<Order>>(
  (ref) => ref.watch(appRepositoryProvider).orders(business: true),
);

final openBusinessRewardDrawsProvider = FutureProvider<List<Json>>((ref) async {
  final draws = await ref.watch(appRepositoryProvider).weeklyDraws();
  return draws.where((draw) => draw.string('status') == 'OPEN').toList();
});

class BusinessOrdersScreen extends ConsumerWidget {
  const BusinessOrdersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(businessOrdersProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Business orders')),
      body: Column(
        children: [
          const _BusinessRewardIdPanel(),
          Expanded(
            child: state.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stack) => ErrorState(error: error),
              data: (items) => items.isEmpty
                  ? const EmptyState(
                      icon: Icons.receipt_long_outlined,
                      title: 'No business orders',
                      body:
                          'Marketplace orders appear here with safe status transitions.',
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                      itemCount: items.length,
                      separatorBuilder: (_, index) =>
                          const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final order = items[index];
                        return Card(
                          child: Padding(
                            padding: const EdgeInsets.all(17),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    StatusBadge(
                                      label: order.status,
                                      color: BncColors.brand,
                                    ),
                                    const Spacer(),
                                    Text('#${order.id}'),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  '${order.lines.length} items · ${formatCurrency(order.total)}',
                                  style: Theme.of(
                                    context,
                                  ).textTheme.titleMedium,
                                ),
                                Text(
                                  'Payment: ${order.paymentStatus.isEmpty ? 'Pending confirmation' : order.paymentStatus}',
                                  style: Theme.of(context).textTheme.bodySmall
                                      ?.copyWith(color: BncColors.muted),
                                ),
                                const SizedBox(height: 13),
                                SizedBox(
                                  width: double.infinity,
                                  child: OutlinedButton(
                                    onPressed: () =>
                                        _advanceOrder(context, ref, order),
                                    child: Text(_nextOrderLabel(order.status)),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _advanceOrder(
    BuildContext context,
    WidgetRef ref,
    Order order,
  ) async {
    final next = _nextOrderStatus(order.status);
    if (next == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No further transition is available.')),
      );
      return;
    }
    await ref.read(appRepositoryProvider).updateOrderStatus(order.id, next);
    ref.invalidate(businessOrdersProvider);
    if (context.mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Order moved to $next.')));
    }
  }
}

class _BusinessRewardIdPanel extends ConsumerStatefulWidget {
  const _BusinessRewardIdPanel();

  @override
  ConsumerState<_BusinessRewardIdPanel> createState() =>
      _BusinessRewardIdPanelState();
}

class _BusinessRewardIdPanelState
    extends ConsumerState<_BusinessRewardIdPanel> {
  bool _busy = false;
  String _issuedCode = '';

  @override
  Widget build(BuildContext context) {
    final business = ref.watch(selectedManagedBusinessProvider);
    final draws =
        ref.watch(openBusinessRewardDrawsProvider).valueOrNull ??
        const <Json>[];
    if (business == null || draws.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 6),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(17),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF082C86), Color(0xFF0867EC)],
          ),
          borderRadius: BorderRadius.circular(22),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.card_giftcard_rounded, color: Colors.white),
                SizedBox(width: 9),
                Expanded(
                  child: Text(
                    'Issue customer reward ID',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            const Text(
              'For purchases of ₹200 or more. Payment stays directly between you and the customer.',
              style: TextStyle(color: Colors.white70),
            ),
            if (_issuedCode.isNotEmpty) ...[
              const SizedBox(height: 12),
              InkWell(
                onTap: () async {
                  await Clipboard.setData(ClipboardData(text: _issuedCode));
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Reward ID copied.')),
                    );
                  }
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 13,
                    vertical: 11,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          _issuedCode,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.1,
                          ),
                        ),
                      ),
                      const Icon(Icons.copy_rounded, color: Colors.white),
                    ],
                  ),
                ),
              ),
            ],
            const SizedBox(height: 12),
            FilledButton.icon(
              style: FilledButton.styleFrom(
                backgroundColor: BncColors.golden,
                foregroundColor: BncColors.ink,
              ),
              onPressed: _busy ? null : () => _issue(business.id, draws),
              icon: const Icon(Icons.add_rounded),
              label: Text(_busy ? 'Generating…' : 'Generate unique ID'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _issue(String businessId, List<Json> draws) async {
    final amount = TextEditingController();
    final receipt = TextEditingController();
    var drawId = draws.first.string('id');
    final payload =
        await showModalBottomSheet<
          ({String drawId, double amount, String receipt})
        >(
          context: context,
          isScrollControlled: true,
          showDragHandle: true,
          builder: (context) => StatefulBuilder(
            builder: (context, setSheetState) => Padding(
              padding: EdgeInsets.fromLTRB(
                20,
                4,
                20,
                MediaQuery.viewInsetsOf(context).bottom + 22,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  DropdownButtonFormField<String>(
                    initialValue: drawId,
                    decoration: const InputDecoration(labelText: 'Reward draw'),
                    items: draws
                        .map(
                          (draw) => DropdownMenuItem(
                            value: draw.string('id'),
                            child: Text(draw.string('title')),
                          ),
                        )
                        .toList(),
                    onChanged: (value) =>
                        setSheetState(() => drawId = value ?? drawId),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: amount,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    decoration: const InputDecoration(
                      labelText: 'Purchase amount',
                      prefixText: '₹ ',
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: receipt,
                    maxLength: 120,
                    decoration: const InputDecoration(
                      labelText: 'Receipt reference (optional)',
                    ),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () {
                        final parsed = double.tryParse(amount.text.trim());
                        if (parsed == null || parsed < 200) return;
                        Navigator.pop(context, (
                          drawId: drawId,
                          amount: parsed,
                          receipt: receipt.text,
                        ));
                      },
                      child: const Text('Create reward ID'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
    amount.dispose();
    receipt.dispose();
    if (payload == null) return;
    setState(() => _busy = true);
    try {
      final result = await ref
          .read(appRepositoryProvider)
          .issueDrawEntry(
            payload.drawId,
            businessId: businessId,
            purchaseAmount: payload.amount,
            receiptReference: payload.receipt,
          );
      setState(() => _issuedCode = result.string('code'));
    } on Object catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$error')));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }
}

String? _nextOrderStatus(String current) => switch (current) {
  'PENDING' => 'CONFIRMED',
  'CONFIRMED' => 'PREPARING',
  'PREPARING' => 'READY_FOR_PICKUP',
  'READY_FOR_PICKUP' => 'DISPATCHED',
  'DISPATCHED' => 'DELIVERED',
  _ => null,
};

String _nextOrderLabel(String current) => switch (current) {
  'PENDING' => 'Confirm order',
  'CONFIRMED' => 'Start preparing',
  'PREPARING' => 'Mark ready',
  'READY_FOR_PICKUP' => 'Mark dispatched / collected',
  'DISPATCHED' => 'Mark delivered',
  _ => 'Order complete',
};

String _slug(String value) => value
    .trim()
    .toLowerCase()
    .replaceAll(RegExp(r'[^a-z0-9]+'), '-')
    .replaceAll(RegExp(r'^-+|-+$'), '');

extension<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
