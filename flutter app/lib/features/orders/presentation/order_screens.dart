import 'dart:async';

import 'package:bnc_mobile/core/config/app_config.dart';
import 'package:bnc_mobile/core/data/app_repository.dart';
import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/core/state/app_state.dart';
import 'package:bnc_mobile/design_system/bnc_theme.dart';
import 'package:bnc_mobile/design_system/components.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:share_plus/share_plus.dart';

final checkoutAddressesProvider = FutureProvider<List<Json>>(
  (ref) => ref.watch(appRepositoryProvider).addresses(),
);

final cartProductProvider = FutureProvider.family<Product, String>(
  (ref, id) => ref.watch(appRepositoryProvider).product(id),
);

class CartScreen extends ConsumerStatefulWidget {
  const CartScreen({super.key, this.initialProductId});

  final String? initialProductId;

  @override
  ConsumerState<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends ConsumerState<CartScreen> {
  String? _loadedProductId;
  bool _loadingInitialProduct = false;
  String? _initialProductError;

  @override
  void initState() {
    super.initState();
    Future.microtask(_loadInitialProduct);
  }

  @override
  void didUpdateWidget(covariant CartScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.initialProductId != widget.initialProductId) {
      _loadedProductId = null;
      Future.microtask(_loadInitialProduct);
    }
  }

  Future<void> _loadInitialProduct() async {
    final id = widget.initialProductId?.trim() ?? '';
    if (id.isEmpty || id == _loadedProductId) return;
    _loadedProductId = id;
    if (ref.read(cartProvider).any((line) => line.product.id == id)) return;
    setState(() {
      _loadingInitialProduct = true;
      _initialProductError = null;
    });
    try {
      final product = await ref.read(cartProductProvider(id).future);
      if (!product.inStock) {
        throw StateError('${product.name} is currently out of stock.');
      }
      if (product.businessId.isEmpty) {
        throw StateError(
          '${product.name} is not connected to a checkout-enabled seller.',
        );
      }
      ref.read(cartProvider.notifier).add(product);
    } on Object catch (error) {
      if (mounted) setState(() => _initialProductError = '$error');
    } finally {
      if (mounted) setState(() => _loadingInitialProduct = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lines = ref.watch(cartProvider);
    final total = ref.watch(cartTotalProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Your cart')),
      body: _loadingInitialProduct && lines.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : _initialProductError != null && lines.isEmpty
          ? ErrorState(
              error: _initialProductError!,
              onRetry: () {
                _loadedProductId = null;
                _loadInitialProduct();
              },
            )
          : lines.isEmpty
          ? EmptyState(
              icon: Icons.shopping_bag_outlined,
              title: 'Your cart is ready for local finds',
              body:
                  'Products you add from trusted nearby sellers will appear here.',
              action: () => context.push('/products'),
              actionLabel: 'Browse products',
            )
          : ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 30),
              children: [
                if (_initialProductError != null) ...[
                  Card(
                    color: Theme.of(
                      context,
                    ).colorScheme.errorContainer.withValues(alpha: .45),
                    child: ListTile(
                      leading: const Icon(Icons.info_outline_rounded),
                      title: const Text('One product could not be added'),
                      subtitle: Text(_initialProductError!),
                    ),
                  ),
                  const SizedBox(height: 10),
                ],
                ...lines.map(
                  (line) => Padding(
                    padding: const EdgeInsets.only(bottom: 11),
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(10),
                        child: Row(
                          children: [
                            SizedBox(
                              width: 82,
                              height: 82,
                              child: BncNetworkImage(
                                url: line.product.imageUrl,
                                borderRadius: BorderRadius.circular(15),
                              ),
                            ),
                            const SizedBox(width: 13),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    line.product.name,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleSmall
                                        ?.copyWith(fontWeight: FontWeight.w700),
                                  ),
                                  const SizedBox(height: 5),
                                  Text(
                                    formatCurrency(line.product.effectivePrice),
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleMedium
                                        ?.copyWith(color: BncColors.deepBlue),
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      _QuantityButton(
                                        icon: Icons.remove_rounded,
                                        onTap: () => ref
                                            .read(cartProvider.notifier)
                                            .updateQuantity(
                                              line.product.id,
                                              line.quantity - 1,
                                            ),
                                      ),
                                      SizedBox(
                                        width: 40,
                                        child: Text(
                                          '${line.quantity}',
                                          textAlign: TextAlign.center,
                                          style: Theme.of(
                                            context,
                                          ).textTheme.labelLarge,
                                        ),
                                      ),
                                      _QuantityButton(
                                        icon: Icons.add_rounded,
                                        onTap: () => ref
                                            .read(cartProvider.notifier)
                                            .updateQuantity(
                                              line.product.id,
                                              line.quantity + 1,
                                            ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              onPressed: () => ref
                                  .read(cartProvider.notifier)
                                  .updateQuantity(line.product.id, 0),
                              icon: const Icon(Icons.close_rounded),
                              tooltip: 'Remove',
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Card(
                  color: BncColors.sky,
                  child: Padding(
                    padding: const EdgeInsets.all(17),
                    child: Column(
                      children: [
                        const _SummaryRow(
                          label: 'Delivery',
                          value: 'Calculated at checkout',
                        ),
                        const SizedBox(height: 10),
                        _SummaryRow(
                          label: 'Subtotal',
                          value: formatCurrency(total),
                          strong: true,
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      Icons.verified_user_outlined,
                      color: BncColors.verified,
                      size: 20,
                    ),
                    SizedBox(width: 9),
                    Expanded(
                      child: Text(
                        'The server checks prices, coupons and stock again before creating your order.',
                      ),
                    ),
                  ],
                ),
              ],
            ),
      bottomNavigationBar: lines.isEmpty
          ? null
          : SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 9, 16, 12),
                child: ElevatedButton(
                  onPressed: () {
                    final businessIds = lines
                        .map((line) => line.product.businessId)
                        .where((id) => id.isNotEmpty)
                        .toSet();
                    if (businessIds.isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text(
                            'These products are not connected to a checkout-enabled seller.',
                          ),
                        ),
                      );
                      return;
                    }
                    if (businessIds.length > 1) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text(
                            'Place separate orders for products from different businesses.',
                          ),
                        ),
                      );
                      return;
                    }
                    context.push('/checkout');
                  },
                  child: Text('Checkout · ${formatCurrency(total)}'),
                ),
              ),
            ),
    );
  }
}

class _QuantityButton extends StatelessWidget {
  const _QuantityButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SizedBox.square(
      dimension: 32,
      child: IconButton.outlined(
        onPressed: onTap,
        padding: EdgeInsets.zero,
        iconSize: 16,
        icon: Icon(icon),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.label,
    required this.value,
    this.strong = false,
  });

  final String label;
  final String value;
  final bool strong;

  @override
  Widget build(BuildContext context) {
    final style = strong
        ? Theme.of(context).textTheme.titleMedium
        : Theme.of(context).textTheme.bodyMedium;
    return Row(
      children: [
        Text(label, style: style),
        const Spacer(),
        Flexible(
          child: Text(value, textAlign: TextAlign.end, style: style),
        ),
      ],
    );
  }
}

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  late final Razorpay _razorpay;
  final _addressController = TextEditingController();
  final _couponController = TextEditingController();
  late String _fulfilment;
  String? _selectedAddressId;
  Json? _selectedAddress;
  bool _busy = false;
  Order? _pendingOrder;

  @override
  void initState() {
    super.initState();
    final lines = ref.read(cartProvider);
    _fulfilment =
        lines.isNotEmpty &&
            lines.every((line) => line.product.homeDeliveryAvailable)
        ? 'delivery'
        : 'pickup';
    _razorpay = Razorpay()
      ..on(Razorpay.EVENT_PAYMENT_SUCCESS, _paymentSuccess)
      ..on(Razorpay.EVENT_PAYMENT_ERROR, _paymentError)
      ..on(Razorpay.EVENT_EXTERNAL_WALLET, _externalWallet);
  }

  @override
  void dispose() {
    _razorpay.clear();
    _addressController.dispose();
    _couponController.dispose();
    super.dispose();
  }

  Future<void> _placeOrder() async {
    if (!ref.read(sessionProvider).authenticated) {
      await context.push(
        '/login?returnTo=${Uri.encodeQueryComponent('/checkout')}',
      );
      if (!mounted) return;
      if (!ref.read(sessionProvider).authenticated) return;
    }
    final lines = ref.read(cartProvider);
    if (lines.isEmpty) return;
    if (_fulfilment == 'delivery' &&
        lines.any((line) => !line.product.homeDeliveryAvailable)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Home delivery is not available for every cart item.'),
        ),
      );
      return;
    }
    if (_fulfilment == 'delivery' &&
        _addressController.text.trim().length < 5) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter or choose a delivery address.')),
      );
      return;
    }
    setState(() => _busy = true);
    try {
      final businessId = lines.first.product.businessId;
      if (businessId.isEmpty) {
        throw StateError('This product is not connected to a live seller.');
      }
      final order = await ref.read(appRepositoryProvider).createOrder({
        'businessId': businessId,
        'fulfilmentType': _fulfilment,
        if (_fulfilment == 'delivery')
          'deliveryAddress': _selectedAddress == null
              ? {'addressLine1': _addressController.text.trim()}
              : {
                  'addressLine1': _selectedAddress!.string('addressLine1'),
                  'addressLine2': _selectedAddress!.string('addressLine2'),
                  'locality': _selectedAddress!.string('locality'),
                  'city': _selectedAddress!.string('city'),
                  'district': _selectedAddress!.string('district'),
                  'state': _selectedAddress!.string('state', 'Kerala'),
                  'postalCode': _selectedAddress!.string('postalCode'),
                  'recipient': _selectedAddress!.string('recipient'),
                },
        if (_couponController.text.trim().isNotEmpty)
          'couponCode': _couponController.text.trim(),
        'items': [
          for (final line in lines)
            {'productId': line.product.id, 'quantity': line.quantity},
        ],
      });
      _pendingOrder = order;
      final checkout = await ref
          .read(appRepositoryProvider)
          .createCheckout(order.id);
      final key = checkout.string('keyId', AppConfig.razorpayKeyId);
      if (key.isEmpty) {
        throw StateError(
          'Payments are not configured. Add a Razorpay key before checkout.',
        );
      }
      _razorpay.open({
        'key': key,
        'amount': checkout.integer('amountSubunits'),
        'currency': checkout.string('currency', 'INR'),
        'name': 'BNC',
        'description': 'Local marketplace order',
        'order_id': checkout.string('providerOrderId'),
        'prefill': {
          'contact': ref.read(sessionProvider).user?.phone ?? '',
          'email': ref.read(sessionProvider).user?.email ?? '',
        },
        'theme': {'color': '#0F48D8'},
        'modal': {'confirm_close': true},
      });
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

  void _paymentSuccess(PaymentSuccessResponse response) {
    final order = _pendingOrder;
    if (order == null) return;
    _completePayment(order);
  }

  void _paymentError(PaymentFailureResponse response) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Payment was not completed. ${response.message ?? 'Try again safely.'}',
        ),
      ),
    );
  }

  void _externalWallet(ExternalWalletResponse response) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Continue in ${response.walletName ?? 'your wallet'}.'),
      ),
    );
  }

  void _completePayment(Order order) {
    ref.read(cartProvider.notifier).clear();
    ref.invalidate(ordersProvider);
    context.go('/orders/${order.id}', extra: order);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'Payment response received. BNC will confirm it from the signed webhook.',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final lines = ref.watch(cartProvider);
    final total = ref.watch(cartTotalProvider);
    final addresses = ref.watch(checkoutAddressesProvider);
    final deliveryAvailable =
        lines.isNotEmpty &&
        lines.every((line) => line.product.homeDeliveryAvailable);
    final displayedFulfilment = deliveryAvailable ? _fulfilment : 'pickup';
    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(18, 8, 18, 30),
        children: [
          Text('Fulfilment', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 10),
          SegmentedButton<String>(
            segments: [
              if (deliveryAvailable)
                const ButtonSegment(
                  value: 'delivery',
                  icon: Icon(Icons.local_shipping_outlined),
                  label: Text('Delivery'),
                ),
              const ButtonSegment(
                value: 'pickup',
                icon: Icon(Icons.storefront_outlined),
                label: Text('Pickup'),
              ),
            ],
            selected: {displayedFulfilment},
            onSelectionChanged: (values) =>
                setState(() => _fulfilment = values.first),
          ),
          if (!deliveryAvailable) ...[
            const SizedBox(height: 10),
            Text(
              'This cart is available for local pickup only.',
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: BncColors.muted),
            ),
          ],
          if (displayedFulfilment == 'delivery') ...[
            const SizedBox(height: 22),
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Delivery address',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                ),
                TextButton(
                  onPressed: () => context.push('/account/addresses'),
                  child: const Text('Manage'),
                ),
              ],
            ),
            const SizedBox(height: 10),
            addresses.when(
              loading: () => const LinearProgressIndicator(),
              error: (error, stack) => const SizedBox.shrink(),
              data: (items) {
                if (items.isEmpty) return const SizedBox.shrink();
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: DropdownButtonFormField<String>(
                    initialValue: _selectedAddressId,
                    isExpanded: true,
                    decoration: const InputDecoration(
                      labelText: 'Choose a saved address',
                      prefixIcon: Icon(Icons.bookmark_outline_rounded),
                    ),
                    items: [
                      for (final address in items)
                        DropdownMenuItem(
                          value: address.string('id'),
                          child: Text(
                            _addressText(address),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                    ],
                    onChanged: (id) {
                      final matches = items.where(
                        (item) => item.string('id') == id,
                      );
                      if (matches.isEmpty) return;
                      final address = matches.first;
                      setState(() {
                        _selectedAddressId = id;
                        _selectedAddress = address;
                        _addressController.text = _addressText(address);
                      });
                    },
                  ),
                );
              },
            ),
            TextField(
              controller: _addressController,
              minLines: 2,
              maxLines: 4,
              onChanged: (_) {
                if (_selectedAddress != null) {
                  setState(() {
                    _selectedAddress = null;
                    _selectedAddressId = null;
                  });
                }
              },
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.location_on_outlined),
                labelText: 'Full delivery address',
              ),
            ),
          ],
          const SizedBox(height: 22),
          Text('Coupon', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 10),
          TextField(
            controller: _couponController,
            textCapitalization: TextCapitalization.characters,
            decoration: InputDecoration(
              hintText: 'Enter coupon code',
              prefixIcon: const Icon(Icons.sell_outlined),
              suffixIcon: TextButton(
                onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text(
                      'Coupons are validated with server pricing when the order is created.',
                    ),
                  ),
                ),
                child: const Text('Apply'),
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text('Order summary', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 10),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(17),
              child: Column(
                children: [
                  ...lines.map(
                    (line) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _SummaryRow(
                        label: '${line.product.name} × ${line.quantity}',
                        value: formatCurrency(
                          line.product.effectivePrice * line.quantity,
                        ),
                      ),
                    ),
                  ),
                  const Divider(height: 22),
                  _SummaryRow(
                    label: 'Estimated total',
                    value: formatCurrency(total),
                    strong: true,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                Icons.lock_outline_rounded,
                color: BncColors.verified,
                size: 20,
              ),
              SizedBox(width: 9),
              Expanded(
                child: Text(
                  'BNC never handles your card details. Razorpay processes checkout; signed server webhooks confirm payment.',
                ),
              ),
            ],
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 9, 16, 12),
          child: ElevatedButton.icon(
            onPressed: _busy ? null : _placeOrder,
            icon: _busy
                ? const SizedBox.square(
                    dimension: 19,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  )
                : const Icon(Icons.lock_rounded),
            label: Text('Pay securely · ${formatCurrency(total)}'),
          ),
        ),
      ),
    );
  }
}

class OrdersScreen extends ConsumerWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionProvider);
    final state = ref.watch(ordersProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Orders')),
      body: !session.authenticated
          ? EmptyState(
              icon: Icons.receipt_long_outlined,
              title: 'Sign in to track orders',
              body:
                  'Order status, payment history and return eligibility stay connected to your account.',
              action: () => context.push(
                '/login?returnTo=${Uri.encodeQueryComponent('/orders')}',
              ),
              actionLabel: 'Log in',
            )
          : state.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stack) => ErrorState(error: error),
              data: (items) => items.isEmpty
                  ? EmptyState(
                      icon: Icons.shopping_bag_outlined,
                      title: 'No orders yet',
                      body: 'Browse local products available through BNC.',
                      action: () => context.push('/products'),
                      actionLabel: 'Browse products',
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 30),
                      itemCount: items.length,
                      separatorBuilder: (_, index) =>
                          const SizedBox(height: 11),
                      itemBuilder: (context, index) {
                        final order = items[index];
                        return Card(
                          child: InkWell(
                            borderRadius: BorderRadius.circular(22),
                            onTap: () => context.push(
                              '/orders/${order.id}',
                              extra: order,
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(17),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      StatusBadge(
                                        label: order.status,
                                        color: _orderColor(order.status),
                                      ),
                                      const Spacer(),
                                      Text(
                                        order.createdAt,
                                        style: Theme.of(context)
                                            .textTheme
                                            .bodySmall
                                            ?.copyWith(color: BncColors.muted),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 13),
                                  Text(
                                    order.businessName.isEmpty
                                        ? 'Local marketplace order'
                                        : order.businessName,
                                    style: Theme.of(
                                      context,
                                    ).textTheme.titleMedium,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${order.lines.length} item${order.lines.length == 1 ? '' : 's'} · ${formatCurrency(order.total)}',
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyMedium
                                        ?.copyWith(color: BncColors.muted),
                                  ),
                                  const SizedBox(height: 12),
                                  Row(
                                    children: [
                                      Text(
                                        '#${order.id}',
                                        style: Theme.of(
                                          context,
                                        ).textTheme.labelSmall,
                                      ),
                                      const Spacer(),
                                      const Text(
                                        'View details  →',
                                        style: TextStyle(
                                          color: BncColors.brand,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}

final orderProvider = FutureProvider.family<Order, String>(
  (ref, id) => ref.watch(appRepositoryProvider).order(id),
);

class OrderDetailScreen extends ConsumerWidget {
  const OrderDetailScreen({required this.id, super.key, this.initialOrder});

  final String id;
  final Order? initialOrder;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final liveState = ref.watch(orderProvider(id));
    final state = liveState.isLoading && initialOrder != null
        ? AsyncValue<Order>.data(initialOrder!)
        : liveState;
    return Scaffold(
      appBar: AppBar(title: const Text('Order details')),
      body: state.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => ErrorState(error: error),
        data: (order) => ListView(
          padding: const EdgeInsets.fromLTRB(18, 8, 18, 30),
          children: [
            Card(
              color: BncColors.sky,
              child: Padding(
                padding: const EdgeInsets.all(19),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    StatusBadge(
                      label: order.status,
                      color: _orderColor(order.status),
                    ),
                    const SizedBox(height: 13),
                    Text(
                      _orderHeadline(order.status),
                      style: Theme.of(context).textTheme.headlineMedium
                          ?.copyWith(color: BncColors.deepBlue),
                    ),
                    const SizedBox(height: 5),
                    Text(
                      'Order #${order.orderNumber}',
                      style: Theme.of(
                        context,
                      ).textTheme.bodyMedium?.copyWith(color: BncColors.muted),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text('Progress', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 14),
            _OrderTimeline(
              status: order.status,
              fulfilmentType: order.fulfilmentType,
            ),
            const SizedBox(height: 24),
            Text('Items', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 10),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(17),
                child: Column(
                  children: [
                    ...order.lines.map(
                      (line) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _SummaryRow(
                          label: '${line.name} × ${line.quantity}',
                          value: formatCurrency(line.unitPrice * line.quantity),
                        ),
                      ),
                    ),
                    const Divider(),
                    if (order.subtotal > 0)
                      _SummaryRow(
                        label: 'Subtotal',
                        value: formatCurrency(order.subtotal),
                      ),
                    if (order.discount > 0)
                      _SummaryRow(
                        label: 'Discount',
                        value: '−${formatCurrency(order.discount)}',
                      ),
                    if (order.deliveryFee > 0)
                      _SummaryRow(
                        label: 'Delivery',
                        value: formatCurrency(order.deliveryFee),
                      ),
                    if (order.subtotal > 0 ||
                        order.discount > 0 ||
                        order.deliveryFee > 0)
                      const Divider(),
                    _SummaryRow(
                      label: 'Total',
                      value: formatCurrency(order.total),
                      strong: true,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Payment & support',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 10),
            Card(
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.payments_outlined),
                    title: Text(
                      order.paymentStatus.isEmpty
                          ? 'Payment verification pending'
                          : order.paymentStatus,
                    ),
                    subtitle: const Text('Server-confirmed payment status'),
                  ),
                  const Divider(),
                  ListTile(
                    leading: const Icon(Icons.support_agent_rounded),
                    title: const Text('Get help with this order'),
                    trailing: const Icon(Icons.chevron_right_rounded),
                    onTap: () => context.push(
                      '/contact?topic=Billing&message=${Uri.encodeQueryComponent('I need help with order ${order.orderNumber}.')}',
                    ),
                  ),
                  if (order.paymentStatus == 'CAPTURED') ...[
                    const Divider(),
                    ListTile(
                      leading: const Icon(Icons.ios_share_rounded),
                      title: const Text('Share invoice'),
                      subtitle: const Text(
                        'Save or send a text invoice using your device.',
                      ),
                      trailing: const Icon(Icons.chevron_right_rounded),
                      onTap: () => _shareInvoice(order),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 18),
            if (['PENDING', 'CONFIRMED'].contains(order.status))
              OutlinedButton(
                onPressed: () => _cancel(context, ref, order),
                child: const Text('Cancel eligible order'),
              ),
            if (order.status == 'DELIVERED')
              OutlinedButton(
                onPressed: () => _return(context, ref, order),
                child: const Text('Request a return'),
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _cancel(BuildContext context, WidgetRef ref, Order order) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel this order?'),
        content: const Text(
          'Cancellation is accepted only while the order is still eligible.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Keep order'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Cancel order'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    await ref.read(appRepositoryProvider).cancelOrder(order.id);
    ref.invalidate(ordersProvider);
    ref.invalidate(orderProvider(order.id));
    if (context.mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Cancellation requested.')));
    }
  }

  Future<void> _return(BuildContext context, WidgetRef ref, Order order) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Request a return?'),
        content: const Text(
          'BNC will open a return request for this eligible delivered order. '
          'The seller can review it before the return is completed.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Keep order'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Request return'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    await ref.read(appRepositoryProvider).requestReturn(order.id);
    ref.invalidate(ordersProvider);
    ref.invalidate(orderProvider(order.id));
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Return request submitted.')),
      );
    }
  }

  Future<void> _shareInvoice(Order order) => SharePlus.instance.share(
    ShareParams(
      subject: '${order.orderNumber} invoice',
      text: _invoiceText(order),
    ),
  );
}

String _invoiceText(Order order) {
  final lines = <String>[
    'BNC order invoice',
    'Order: ${order.orderNumber}',
    'Business: ${order.businessName}',
    'Date: ${order.createdAt}',
    'Status: ${order.status}',
    'Payment: ${order.paymentStatus}',
    '',
    for (final item in order.lines)
      '${item.name} × ${item.quantity} — '
          '${formatCurrency(item.unitPrice * item.quantity)}',
    '',
    if (order.subtotal > 0) 'Subtotal: ${formatCurrency(order.subtotal)}',
    if (order.discount > 0) 'Discount: −${formatCurrency(order.discount)}',
    if (order.deliveryFee > 0) 'Delivery: ${formatCurrency(order.deliveryFee)}',
    'Total: ${formatCurrency(order.total)}',
  ];
  return lines.where((line) => !line.endsWith(': ')).join('\n');
}

String _addressText(Json address) => [
  address.string('label'),
  address.string('addressLine1'),
  address.string('addressLine2'),
  address.string('locality'),
  address.string('city'),
  address.string('postalCode'),
].where((part) => part.isNotEmpty).join(', ');

class _OrderTimeline extends StatelessWidget {
  const _OrderTimeline({required this.status, required this.fulfilmentType});

  final String status;
  final String fulfilmentType;

  @override
  Widget build(BuildContext context) {
    final pickup = fulfilmentType.toLowerCase() == 'pickup';
    final steps = [
      ('CONFIRMED', 'Confirmed', 'The seller accepted your order'),
      ('PREPARING', 'Preparing', 'Your items are being prepared'),
      pickup
          ? (
              'READY_FOR_PICKUP',
              'Ready for pickup',
              'Collect your order from the seller',
            )
          : ('DISPATCHED', 'On the way', 'The order has left the seller'),
      ('DELIVERED', pickup ? 'Collected' : 'Delivered', 'Order completed'),
    ];
    final current = steps.indexWhere((step) => step.$1 == status);
    final effective = current < 0
        ? status == 'PENDING'
              ? -1
              : 0
        : current;
    return Column(
      children: [
        for (var index = 0; index < steps.length; index++)
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                children: [
                  Container(
                    width: 25,
                    height: 25,
                    decoration: BoxDecoration(
                      color: index <= effective
                          ? BncColors.verified
                          : BncColors.border,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      index <= effective
                          ? Icons.check_rounded
                          : Icons.circle_outlined,
                      color: index <= effective
                          ? Colors.white
                          : BncColors.muted,
                      size: 15,
                    ),
                  ),
                  if (index < steps.length - 1)
                    Container(
                      width: 2,
                      height: 46,
                      color: index < effective
                          ? BncColors.verified
                          : BncColors.border,
                    ),
                ],
              ),
              const SizedBox(width: 13),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        steps[index].$2,
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                          color: index <= effective ? null : BncColors.muted,
                        ),
                      ),
                      Text(
                        steps[index].$3,
                        style: Theme.of(
                          context,
                        ).textTheme.bodySmall?.copyWith(color: BncColors.muted),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
      ],
    );
  }
}

Color _orderColor(String status) => switch (status) {
  'DELIVERED' => BncColors.verified,
  'CANCELLED' || 'RETURNED' || 'REFUNDED' => BncColors.muted,
  'RETURN_REQUESTED' => BncColors.offer,
  _ => BncColors.brand,
};

String _orderHeadline(String status) => switch (status) {
  'PENDING' => 'Waiting for confirmation',
  'CONFIRMED' => 'Your order is confirmed',
  'PREPARING' => 'The seller is preparing your order',
  'READY_FOR_PICKUP' => 'Ready for pickup',
  'DISPATCHED' => 'Your order is on the way',
  'DELIVERED' => 'Delivered successfully',
  'CANCELLED' => 'This order was cancelled',
  'RETURN_REQUESTED' => 'Return request under review',
  'RETURNED' => 'Order returned',
  'REFUNDED' => 'Refund completed',
  _ => 'Order update',
};
