import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/core/state/app_state.dart';
import 'package:bnc_mobile/design_system/bnc_theme.dart';
import 'package:bnc_mobile/l10n/app_localizations.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

class BncLogo extends StatelessWidget {
  const BncLogo({super.key, this.compact = false, this.light = false});

  final bool compact;
  final bool light;

  @override
  Widget build(BuildContext context) {
    final foreground = light ? Colors.white : BncColors.deepBlue;
    return Semantics(
      label: 'BNC — Business Near & Close',
      image: true,
      excludeSemantics: true,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: compact ? 38 : 44,
            height: compact ? 38 : 44,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF2B68F4), BncColors.brand],
              ),
              borderRadius: BorderRadius.circular(compact ? 12 : 14),
              boxShadow: [
                BoxShadow(
                  color: BncColors.brand.withValues(alpha: .22),
                  blurRadius: 16,
                  offset: const Offset(0, 7),
                ),
              ],
            ),
            child: Text(
              'B',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                letterSpacing: -1,
              ),
            ),
          ),
          if (!compact) ...[
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'BNC',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: foreground,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -.6,
                  ),
                ),
                Text(
                  'BUSINESS NEAR & CLOSE',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: light ? Colors.white70 : BncColors.muted,
                    fontSize: 8,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.05,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class EnvironmentStrip extends ConsumerWidget {
  const EnvironmentStrip({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final connected = ref.watch(connectivityProvider).valueOrNull ?? true;
    if (connected) return const SizedBox.shrink();
    return Semantics(
      liveRegion: true,
      child: Container(
        width: double.infinity,
        color: BncColors.offer,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.cloud_off_outlined, color: Colors.white, size: 14),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                AppLocalizations.of(context).offline,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class SectionHeader extends StatelessWidget {
  const SectionHeader({
    required this.title,
    super.key,
    this.eyebrow,
    this.actionLabel,
    this.onAction,
  });

  final String title;
  final String? eyebrow;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (eyebrow != null) ...[
                Text(
                  eyebrow!.toUpperCase(),
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: BncColors.brand,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1,
                  ),
                ),
                const SizedBox(height: 5),
              ],
              Text(title, style: Theme.of(context).textTheme.headlineMedium),
            ],
          ),
        ),
        if (actionLabel != null)
          TextButton(
            onPressed: onAction,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(actionLabel!),
                const SizedBox(width: 3),
                const Icon(Icons.arrow_forward_rounded, size: 17),
              ],
            ),
          ),
      ],
    );
  }
}

/// Flat, edge-to-edge page introduction for immersive feature destinations.
class ImmersivePageHeader extends StatelessWidget {
  const ImmersivePageHeader({
    required this.title,
    required this.subtitle,
    super.key,
    this.eyebrow,
    this.footer,
    this.backgroundColor = BncColors.brand,
  });

  final String? eyebrow;
  final String title;
  final String subtitle;
  final Widget? footer;
  final Color backgroundColor;

  @override
  Widget build(BuildContext context) => Semantics(
    container: true,
    child: ColoredBox(
      color: backgroundColor,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 28),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (eyebrow != null) ...[
              Text(
                eyebrow!.toUpperCase(),
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: Colors.white.withValues(alpha: .72),
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1,
                ),
              ),
              const SizedBox(height: 10),
            ],
            Text(
              title,
              style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                height: 1.08,
              ),
            ),
            const SizedBox(height: 9),
            Text(
              subtitle,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: Colors.white.withValues(alpha: .78),
                height: 1.45,
              ),
            ),
            if (footer != null) ...[const SizedBox(height: 22), footer!],
          ],
        ),
      ),
    ),
  );
}

class BncNetworkImage extends StatelessWidget {
  const BncNetworkImage({
    required this.url,
    super.key,
    this.fit = BoxFit.cover,
    this.borderRadius,
  });

  final String url;
  final BoxFit fit;
  final BorderRadius? borderRadius;

  @override
  Widget build(BuildContext context) {
    final placeholder = Container(
      color: Theme.of(context).colorScheme.surfaceContainerHighest,
      alignment: Alignment.center,
      child: Icon(
        Icons.storefront_rounded,
        size: 32,
        color: Theme.of(context).colorScheme.onSurfaceVariant,
      ),
    );
    final image = url.isEmpty
        ? placeholder
        : CachedNetworkImage(
            imageUrl: url,
            fit: fit,
            fadeInDuration: const Duration(milliseconds: 180),
            placeholder: (context, url) => placeholder,
            errorWidget: (context, url, error) => placeholder,
          );
    if (borderRadius == null) return image;
    return ClipRRect(borderRadius: borderRadius!, child: image);
  }
}

class BusinessCard extends ConsumerWidget {
  const BusinessCard({
    required this.business,
    super.key,
    this.width,
    this.compact = false,
  });

  final Business business;
  final double? width;
  final bool compact;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final saved = ref.watch(savedProvider).contains(business.id);
    return SizedBox(
      width: width,
      child: Card(
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => context.push('/business/${business.slug}'),
          child: compact
              ? _CompactBusinessCard(business: business, saved: saved)
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    AspectRatio(
                      aspectRatio: 1.55,
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          BncNetworkImage(url: business.coverImageUrl),
                          const DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [Colors.black12, Colors.transparent],
                              ),
                            ),
                          ),
                          Positioned(
                            left: 12,
                            top: 12,
                            child: Wrap(
                              spacing: 6,
                              children: [
                                if (business.sponsored)
                                  const StatusBadge(
                                    label: 'Sponsored',
                                    color: BncColors.deepBlue,
                                  ),
                                if (business.premium)
                                  const StatusBadge(
                                    label: 'BNC Select',
                                    color: BncColors.offer,
                                  ),
                              ],
                            ),
                          ),
                          Positioned(
                            right: 10,
                            top: 9,
                            child: Material(
                              color: Colors.white.withValues(alpha: .94),
                              shape: const CircleBorder(),
                              child: IconButton(
                                onPressed: () async {
                                  if (!ref
                                      .read(sessionProvider)
                                      .authenticated) {
                                    context.push(
                                      '/login?returnTo=${Uri.encodeQueryComponent('/business/${business.slug}')}',
                                    );
                                    return;
                                  }
                                  try {
                                    await ref
                                        .read(savedProvider.notifier)
                                        .toggle(business.id);
                                  } on Object catch (error) {
                                    if (context.mounted) {
                                      ScaffoldMessenger.of(
                                        context,
                                      ).showSnackBar(
                                        SnackBar(content: Text('$error')),
                                      );
                                    }
                                  }
                                },
                                icon: Icon(
                                  saved
                                      ? Icons.bookmark_rounded
                                      : Icons.bookmark_border_rounded,
                                  color: saved
                                      ? BncColors.brand
                                      : BncColors.ink,
                                ),
                                tooltip: saved ? 'Remove from saved' : 'Save',
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(15, 14, 15, 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            business.category,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.labelSmall
                                ?.copyWith(
                                  color: BncColors.muted,
                                  fontWeight: FontWeight.w700,
                                ),
                          ),
                          const SizedBox(height: 5),
                          Row(
                            children: [
                              Flexible(
                                child: Text(
                                  business.name,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: Theme.of(
                                    context,
                                  ).textTheme.titleMedium,
                                ),
                              ),
                              if (business.verified) ...[
                                const SizedBox(width: 5),
                                const Icon(
                                  Icons.verified_rounded,
                                  color: BncColors.verified,
                                  size: 18,
                                  semanticLabel: 'Verified',
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              RatingLabel(
                                rating: business.rating,
                                count: business.reviewCount,
                              ),
                              if (business.distanceKm != null) ...[
                                const Spacer(),
                                Text(
                                  '${business.distanceKm!.toStringAsFixed(1)} km',
                                  style: Theme.of(context).textTheme.labelMedium
                                      ?.copyWith(color: BncColors.muted),
                                ),
                              ],
                            ],
                          ),
                          if (business.bncStarLevel > 0 ||
                              business.planName.isNotEmpty) ...[
                            const SizedBox(height: 7),
                            _BusinessMembershipLine(business: business),
                          ],
                          if (business.permanentDiscountPercent > 0) ...[
                            const SizedBox(height: 6),
                            _BusinessDiscountLine(business: business),
                          ],
                          const SizedBox(height: 8),
                          Text(
                            '${business.locality} · ${business.priceRange}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(color: BncColors.muted),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Container(
                                width: 7,
                                height: 7,
                                decoration: BoxDecoration(
                                  color: business.openNow
                                      ? BncColors.verified
                                      : business.hoursKnown
                                      ? BncColors.muted
                                      : BncColors.brand,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  business.hoursKnown
                                      ? business.openNow
                                            ? business.closesAt.isEmpty
                                                  ? 'Open now'
                                                  : 'Open · Closes ${business.closesAt}'
                                            : 'Closed now'
                                      : 'Hours not listed',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: Theme.of(context).textTheme.labelSmall
                                      ?.copyWith(
                                        color: business.openNow
                                            ? BncColors.verified
                                            : business.hoursKnown
                                            ? BncColors.muted
                                            : BncColors.brand,
                                        fontWeight: FontWeight.w700,
                                      ),
                                ),
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

class _CompactBusinessCard extends StatelessWidget {
  const _CompactBusinessCard({required this.business, required this.saved});

  final Business business;
  final bool saved;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(10),
      child: Row(
        children: [
          SizedBox(
            width: 106,
            height: 106,
            child: BncNetworkImage(
              url: business.coverImageUrl,
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (business.sponsored)
                  const Align(
                    alignment: Alignment.centerLeft,
                    child: StatusBadge(
                      label: 'Sponsored',
                      color: BncColors.deepBlue,
                    ),
                  ),
                const SizedBox(height: 4),
                if (business.bncStarLevel > 0 ||
                    business.planName.isNotEmpty) ...[
                  _BusinessMembershipLine(business: business),
                  const SizedBox(height: 4),
                ],
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        business.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                    ),
                    if (business.verified) ...[
                      const SizedBox(width: 4),
                      const Icon(
                        Icons.verified_rounded,
                        color: BncColors.verified,
                        size: 17,
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 5),
                RatingLabel(
                  rating: business.rating,
                  count: business.reviewCount,
                ),
                const SizedBox(height: 6),
                Text(
                  [
                    business.locality,
                    if (business.distanceKm != null)
                      '${business.distanceKm!.toStringAsFixed(1)} km',
                  ].where((value) => value.isNotEmpty).join(' · '),
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: BncColors.muted),
                ),
                if (business.permanentDiscountPercent > 0) ...[
                  const SizedBox(height: 5),
                  _BusinessDiscountLine(business: business),
                ],
                if (business.shortDescription.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    business.shortDescription,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ],
            ),
          ),
          Icon(
            saved ? Icons.bookmark_rounded : Icons.chevron_right_rounded,
            color: saved ? BncColors.brand : BncColors.muted,
          ),
        ],
      ),
    );
  }
}

class _BusinessMembershipLine extends StatelessWidget {
  const _BusinessMembershipLine({required this.business});

  final Business business;

  @override
  Widget build(BuildContext context) {
    return Text(
      bncMembershipLabel(business.bncStarLevel, business.planName),
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
      style: Theme.of(context).textTheme.labelSmall?.copyWith(
        color: BncColors.brand,
        fontWeight: FontWeight.w800,
      ),
    );
  }
}

class _BusinessDiscountLine extends StatelessWidget {
  const _BusinessDiscountLine({required this.business});

  final Business business;

  @override
  Widget build(BuildContext context) {
    return Text(
      [
        '${business.permanentDiscountPercent}% permanent discount',
        if (business.permanentDiscountLabel.isNotEmpty)
          business.permanentDiscountLabel,
      ].join(' · '),
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
      style: Theme.of(context).textTheme.labelSmall?.copyWith(
        color: BncColors.brand,
        fontWeight: FontWeight.w700,
      ),
    );
  }
}

class ProductCard extends StatelessWidget {
  const ProductCard({required this.product, super.key, this.width = 190});

  final Product product;
  final double width;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      child: Card(
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => context.push('/product/${product.id}'),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AspectRatio(
                aspectRatio: 1.25,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    BncNetworkImage(url: product.imageUrl),
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
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(13),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product.category,
                      style: Theme.of(
                        context,
                      ).textTheme.labelSmall?.copyWith(color: BncColors.muted),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      product.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    if (product.courierDeliveryAvailable ||
                        product.homeDeliveryAvailable) ...[
                      const SizedBox(height: 5),
                      Row(
                        children: [
                          const Icon(
                            Icons.local_shipping_outlined,
                            size: 14,
                            color: BncColors.brand,
                          ),
                          const SizedBox(width: 4),
                          Flexible(
                            child: Text(
                              product.courierDeliveryAvailable
                                  ? 'Courier available'
                                  : 'Home delivery available',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                    const SizedBox(height: 8),
                    Wrap(
                      crossAxisAlignment: WrapCrossAlignment.center,
                      spacing: 7,
                      children: [
                        Text(
                          formatCurrency(product.effectivePrice),
                          style: Theme.of(context).textTheme.titleMedium,
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
            ],
          ),
        ),
      ),
    );
  }
}

class RatingLabel extends StatelessWidget {
  const RatingLabel({
    required this.rating,
    super.key,
    this.count,
    this.light = false,
  });

  final double rating;
  final int? count;
  final bool light;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: '$rating out of 5${count == null ? '' : ', $count reviews'}',
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.star_rounded, color: Color(0xFFF5A623), size: 17),
          const SizedBox(width: 3),
          Text(
            rating.toStringAsFixed(1),
            style: Theme.of(context).textTheme.labelMedium?.copyWith(
              color: light ? Colors.white : null,
              fontWeight: FontWeight.w800,
            ),
          ),
          if (count != null)
            Text(
              ' ($count)',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: light ? Colors.white70 : BncColors.muted,
              ),
            ),
        ],
      ),
    );
  }
}

class StatusBadge extends StatelessWidget {
  const StatusBadge({
    required this.label,
    required this.color,
    super.key,
    this.icon,
  });

  final String label;
  final Color color;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(99),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: Colors.white),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w800,
              letterSpacing: .1,
            ),
          ),
        ],
      ),
    );
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState({
    required this.icon,
    required this.title,
    required this.body,
    super.key,
    this.action,
    this.actionLabel,
  });

  final IconData icon;
  final String title;
  final String body;
  final VoidCallback? action;
  final String? actionLabel;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) => SingleChildScrollView(
        padding: const EdgeInsets.all(32),
        child: ConstrainedBox(
          constraints: BoxConstraints(
            minHeight: constraints.maxHeight > 64
                ? constraints.maxHeight - 64
                : 0,
          ),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: BncColors.brand.withValues(alpha: .09),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, size: 31, color: BncColors.brand),
                ),
                const SizedBox(height: 20),
                Text(
                  title,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 8),
                Text(
                  body,
                  textAlign: TextAlign.center,
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(color: BncColors.muted),
                ),
                if (action != null && actionLabel != null) ...[
                  const SizedBox(height: 20),
                  ElevatedButton(onPressed: action, child: Text(actionLabel!)),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class ErrorState extends StatelessWidget {
  const ErrorState({required this.error, super.key, this.onRetry});

  final Object error;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return EmptyState(
      icon: Icons.cloud_off_rounded,
      title: AppLocalizations.of(context).somethingWentWrong,
      body: '$error',
      action: onRetry,
      actionLabel: AppLocalizations.of(context).tryAgain,
    );
  }
}

class BncSkeleton extends StatefulWidget {
  const BncSkeleton({
    super.key,
    this.height = 120,
    this.width = double.infinity,
    this.radius = 18,
  });

  final double height;
  final double width;
  final double radius;

  @override
  State<BncSkeleton> createState() => _BncSkeletonState();
}

class _BncSkeletonState extends State<BncSkeleton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1100),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) => Container(
        width: widget.width,
        height: widget.height,
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceContainerHighest
              .withValues(
                alpha: reduceMotion ? .8 : .45 + _controller.value * .35,
              ),
          borderRadius: BorderRadius.circular(widget.radius),
        ),
      ),
    );
  }
}

class SettingsTile extends StatelessWidget {
  const SettingsTile({
    required this.icon,
    required this.title,
    super.key,
    this.subtitle,
    this.onTap,
    this.trailing,
    this.danger = false,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback? onTap;
  final Widget? trailing;
  final bool danger;

  @override
  Widget build(BuildContext context) {
    final color = danger
        ? Theme.of(context).colorScheme.error
        : Theme.of(context).colorScheme.onSurface;
    return ListTile(
      onTap: onTap,
      minTileHeight: 64,
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: color.withValues(alpha: .08),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: color, size: 21),
      ),
      title: Text(title, style: TextStyle(color: color)),
      subtitle: subtitle == null ? null : Text(subtitle!),
      trailing:
          trailing ??
          (onTap == null
              ? null
              : Icon(Icons.chevron_right_rounded, color: BncColors.muted)),
    );
  }
}

String formatCurrency(num amount) => NumberFormat.currency(
  locale: 'en_IN',
  symbol: '₹',
  decimalDigits: 0,
).format(amount);

String initials(String value) => value
    .trim()
    .split(RegExp(r'\s+'))
    .where((part) => part.isNotEmpty)
    .take(2)
    .map((part) => part.characters.first.toUpperCase())
    .join();
