import 'package:bnc_mobile/core/config/app_config.dart';
import 'package:bnc_mobile/core/data/app_repository.dart';
import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/core/state/app_state.dart';
import 'package:bnc_mobile/design_system/bnc_theme.dart';
import 'package:bnc_mobile/design_system/components.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

final businessProvider = FutureProvider.family<Business, String>((
  ref,
  slug,
) async {
  final repository = ref.watch(appRepositoryProvider);
  final business = await repository.business(slug);
  await repository.track('PROFILE_VIEW', businessId: business.id);
  if (ref.read(sessionProvider).authenticated) {
    try {
      await repository.recordBusinessView(business.id);
    } on Object {
      // A history write must never prevent the public profile from opening.
    }
  }
  return business;
});

final relatedBusinessesProvider =
    FutureProvider.family<
      List<Business>,
      ({String category, String city, String currentId})
    >((ref, query) async {
      final items = await ref
          .watch(appRepositoryProvider)
          .businesses(category: query.category, city: query.city, pageSize: 8);
      return items
          .where((business) => business.id != query.currentId)
          .take(4)
          .toList();
    });

class BusinessProfileScreen extends ConsumerWidget {
  const BusinessProfileScreen({required this.slug, super.key});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(businessProvider(slug));
    return Scaffold(
      body: state.when(
        loading: () => const _BusinessProfileLoading(),
        error: (error, stack) => SafeArea(
          child: ErrorState(
            error: error,
            onRetry: () => ref.invalidate(businessProvider(slug)),
          ),
        ),
        data: (business) => _BusinessProfileContent(business: business),
      ),
    );
  }
}

class _BusinessProfileContent extends ConsumerWidget {
  const _BusinessProfileContent({required this.business});

  final Business business;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final saved = ref.watch(savedProvider).contains(business.id);
    final related = ref.watch(
      relatedBusinessesProvider((
        category: business.categorySlug,
        city: business.city,
        currentId: business.id,
      )),
    );
    return CustomScrollView(
      slivers: [
        SliverAppBar(
          expandedHeight: 300,
          pinned: true,
          stretch: true,
          leading: Padding(
            padding: const EdgeInsets.all(8),
            child: _GlassIconButton(
              icon: Icons.arrow_back_rounded,
              onPressed: () => context.pop(),
            ),
          ),
          actions: [
            _GlassIconButton(
              icon: saved
                  ? Icons.bookmark_rounded
                  : Icons.bookmark_border_rounded,
              onPressed: () async {
                if (!ref.read(sessionProvider).authenticated) {
                  _openLogin(context, '/business/${business.slug}');
                  return;
                }
                try {
                  await ref.read(savedProvider.notifier).toggle(business.id);
                } on Object catch (error) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(
                      context,
                    ).showSnackBar(SnackBar(content: Text('$error')));
                  }
                }
              },
            ),
            const SizedBox(width: 8),
            _GlassIconButton(
              icon: Icons.ios_share_rounded,
              onPressed: () => SharePlus.instance.share(
                ShareParams(
                  text:
                      '${business.name} on BNC'
                      '${business.shortDescription.isEmpty ? '' : ' — ${business.shortDescription}'}\n'
                      '${AppConfig.siteBaseUrl}/business/${business.slug}',
                ),
              ),
            ),
            const SizedBox(width: 12),
          ],
          flexibleSpace: FlexibleSpaceBar(
            background: Stack(
              fit: StackFit.expand,
              children: [
                GestureDetector(
                  onTap: business.gallery.isEmpty
                      ? null
                      : () => _openGallery(context, business),
                  child: BncNetworkImage(url: business.coverImageUrl),
                ),
                const DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Color(0x55000000),
                        Colors.transparent,
                        Color(0xB0000000),
                      ],
                    ),
                  ),
                ),
                Positioned(
                  left: 18,
                  right: 18,
                  bottom: 18,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        business.name,
                        style: Theme.of(context).textTheme.headlineLarge
                            ?.copyWith(color: Colors.white),
                      ),
                      const SizedBox(height: 5),
                      Row(
                        children: [
                          RatingLabel(
                            rating: business.rating,
                            count: business.reviewCount,
                            light: true,
                          ),
                          const SizedBox(width: 12),
                          const Text(
                            '•',
                            style: TextStyle(color: Colors.white),
                          ),
                          const SizedBox(width: 12),
                          Flexible(
                            child: Text(
                              [
                                business.locality,
                                if (business.distanceKm != null)
                                  '${business.distanceKm!.toStringAsFixed(1)} km',
                              ].where((value) => value.isNotEmpty).join(' · '),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.labelMedium
                                  ?.copyWith(color: Colors.white),
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
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(18, 18, 18, 0),
            child: _StatusPanel(business: business),
          ),
        ),
        if (business.bncStarLevel > 0 ||
            business.planName.isNotEmpty ||
            business.permanentDiscountPercent > 0)
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(18, 12, 18, 0),
              child: _MembershipBenefitCard(business: business),
            ),
          ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(18, 18, 18, 0),
            child: _QuickActions(business: business),
          ),
        ),
        SliverToBoxAdapter(
          child: _Section(
            title: 'About',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (business.description.isNotEmpty) ...[
                  Text(
                    business.description,
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 16),
                ],
                _InfoRow(
                  icon: Icons.location_on_outlined,
                  title: business.address,
                  subtitle: 'Tap directions to navigate',
                ),
                if (business.yearsInBusiness > 0)
                  _InfoRow(
                    icon: Icons.workspace_premium_outlined,
                    title: '${business.yearsInBusiness} years in business',
                    subtitle: business.responseTime,
                  ),
              ],
            ),
          ),
        ),
        if (business.websiteUrl.isNotEmpty || business.socialLinks.isNotEmpty)
          SliverToBoxAdapter(
            child: _Section(
              title: 'Online',
              child: Card(
                child: Column(
                  children: [
                    if (business.websiteUrl.isNotEmpty)
                      ListTile(
                        leading: const Icon(
                          Icons.language_rounded,
                          color: BncColors.brand,
                        ),
                        title: const Text('Website'),
                        subtitle: Text(
                          Uri.tryParse(business.websiteUrl)?.host ??
                              business.websiteUrl,
                        ),
                        trailing: const Icon(Icons.open_in_new_rounded),
                        onTap: () => _launchExternal(business.websiteUrl),
                      ),
                    for (final entry in business.socialLinks.entries)
                      ListTile(
                        leading: const Icon(
                          Icons.alternate_email_rounded,
                          color: BncColors.brand,
                        ),
                        title: Text(_socialLabel(entry.key)),
                        subtitle: const Text('Open public profile'),
                        trailing: const Icon(Icons.open_in_new_rounded),
                        onTap: () => _launchExternal(entry.value),
                      ),
                  ],
                ),
              ),
            ),
          ),
        if (business.paymentUpiId.isNotEmpty)
          SliverToBoxAdapter(
            child: _Section(
              title: 'Pay this business directly',
              child: _DirectPaymentCard(business: business),
            ),
          ),
        if (business.offer != null)
          SliverToBoxAdapter(
            child: _Section(
              title: 'Current offer',
              child: _OfferCard(offer: business.offer!),
            ),
          ),
        if (business.services.isNotEmpty)
          SliverToBoxAdapter(
            child: _Section(
              title: 'Services',
              action: TextButton(
                onPressed: () =>
                    context.push('/enquiry', extra: {'business': business}),
                child: const Text('Ask for a quote'),
              ),
              child: Column(
                children: business.services
                    .map(
                      (service) => _ServiceRow(
                        service: service,
                        onTap: () => context.push('/services/${service.id}'),
                      ),
                    )
                    .toList(),
              ),
            ),
          ),
        if (business.products.isNotEmpty)
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.only(top: 28),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 18),
                    child: Text(
                      'Products',
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                  ),
                  const SizedBox(height: 13),
                  SizedBox(
                    height: 270,
                    child: ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 18),
                      scrollDirection: Axis.horizontal,
                      itemCount: business.products.length,
                      separatorBuilder: (_, index) => const SizedBox(width: 12),
                      itemBuilder: (context, index) =>
                          ProductCard(product: business.products[index]),
                    ),
                  ),
                ],
              ),
            ),
          ),
        SliverToBoxAdapter(
          child: _Section(
            title: 'What this business offers',
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                ...business.amenities.map(
                  (item) => Chip(
                    avatar: const Icon(Icons.check, size: 16),
                    label: Text(item),
                  ),
                ),
                ...business.paymentMethods.map(
                  (item) => Chip(
                    avatar: const Icon(Icons.payments_outlined, size: 16),
                    label: Text(item),
                  ),
                ),
                ...business.languages.map(
                  (item) => Chip(
                    avatar: const Icon(Icons.translate_rounded, size: 16),
                    label: Text(item),
                  ),
                ),
              ],
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: _Section(
            title: 'Customer reviews',
            action: TextButton(
              onPressed: () {
                final destination =
                    '/review/new?business=${Uri.encodeQueryComponent(business.slug)}';
                if (!ref.read(sessionProvider).authenticated) {
                  _openLogin(context, destination);
                  return;
                }
                context.push(destination, extra: business);
              },
              child: const Text('Write a review'),
            ),
            child: Column(
              children: [
                _RatingSummary(business: business),
                const SizedBox(height: 16),
                if (business.reviews.isEmpty)
                  const EmptyState(
                    icon: Icons.rate_review_outlined,
                    title: 'No reviews yet',
                    body:
                        'Be the first customer to share a helpful experience.',
                  )
                else
                  ...business.reviews.map(
                    (review) => _ReviewCard(
                      review: review,
                      businessSlug: business.slug,
                    ),
                  ),
              ],
            ),
          ),
        ),
        if (related.valueOrNull?.isNotEmpty ?? false)
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.only(top: 28),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 18),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            'Similar businesses nearby',
                            style: Theme.of(context).textTheme.headlineMedium,
                          ),
                        ),
                        TextButton(
                          onPressed: () => context.push(
                            '/search?q=${Uri.encodeQueryComponent(business.category)}&radius=10',
                          ),
                          child: const Text('See all'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 126,
                    child: ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 18),
                      scrollDirection: Axis.horizontal,
                      itemCount: related.value!.length,
                      separatorBuilder: (_, _) => const SizedBox(width: 12),
                      itemBuilder: (context, index) => BusinessCard(
                        business: related.value![index],
                        width: 310,
                        compact: true,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(18, 0, 18, 34),
            child: OutlinedButton.icon(
              onPressed: () => _report(context, ref),
              icon: const Icon(Icons.flag_outlined),
              label: const Text('Report profile or incorrect information'),
            ),
          ),
        ),
        const SliverToBoxAdapter(child: SizedBox(height: 90)),
      ],
    );
  }

  Future<void> _report(BuildContext context, WidgetRef ref) async {
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Report this profile',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 8),
            const Text(
              'Reports are reviewed by BNC moderation. The business is not shown your identity.',
            ),
            const SizedBox(height: 16),
            ...[
              'Incorrect information',
              'Business is closed',
              'Misleading or unsafe content',
              'Other concern',
            ].map(
              (reason) => ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(reason),
                trailing: const Icon(Icons.chevron_right_rounded),
                onTap: () {
                  Navigator.pop(context);
                  context.push(
                    '/report-abuse?business=${Uri.encodeQueryComponent(business.name)}',
                  );
                },
              ),
            ),
            if (ref.read(sessionProvider).authenticated) ...[
              const Divider(),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.block_outlined),
                title: const Text('Block this business'),
                subtitle: const Text(
                  'Prevent future matching and direct contact.',
                ),
                onTap: () async {
                  await ref
                      .read(appRepositoryProvider)
                      .blockBusiness(
                        business.id,
                        reason: 'Blocked from business profile',
                      );
                  if (context.mounted) Navigator.pop(context);
                },
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _DirectPaymentCard extends StatelessWidget {
  const _DirectPaymentCard({required this.business});

  final Business business;

  @override
  Widget build(BuildContext context) {
    final recipient = business.paymentAccountName.trim().isEmpty
        ? business.name
        : business.paymentAccountName.trim();
    final uri = Uri(
      scheme: 'upi',
      host: 'pay',
      queryParameters: {'pa': business.paymentUpiId, 'pn': recipient},
    ).toString();
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Semantics(
              label: 'UPI payment QR for $recipient',
              child: Container(
                width: 132,
                height: 132,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: QrImageView(data: uri, version: QrVersions.auto),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    recipient,
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 5),
                  SelectableText(
                    business.paymentUpiId,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Payment is made directly to the merchant. BNC does not collect or hold these funds.',
                  ),
                  const SizedBox(height: 14),
                  FilledButton.icon(
                    onPressed: () => launchUrl(
                      Uri.parse(uri),
                      mode: LaunchMode.externalApplication,
                    ),
                    icon: const Icon(Icons.qr_code_scanner_rounded),
                    label: const Text('Open UPI app'),
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

class _GlassIconButton extends StatelessWidget {
  const _GlassIconButton({required this.icon, required this.onPressed});

  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white.withValues(alpha: .94),
      shape: const CircleBorder(),
      child: IconButton(
        onPressed: onPressed,
        icon: Icon(icon, color: BncColors.ink),
      ),
    );
  }
}

class _StatusPanel extends StatelessWidget {
  const _StatusPanel({required this.business});

  final Business business;

  @override
  Widget build(BuildContext context) {
    final availabilityColor = business.openNow
        ? BncColors.verified
        : business.hoursKnown
        ? BncColors.muted
        : BncColors.brand;
    return SizedBox(
      height: 104,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: _ProfileMetricCard(
              icon: Icons.circle,
              iconSize: 10,
              accent: availabilityColor,
              title: business.availabilityLabel,
              subtitle: business.availabilityDetail,
            ),
          ),
          if (business.responseTime.isNotEmpty) ...[
            const SizedBox(width: 10),
            Expanded(
              child: _ProfileMetricCard(
                icon: Icons.forum_outlined,
                accent: BncColors.brand,
                title: 'Response time',
                subtitle: business.responseTime,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _MembershipBenefitCard extends StatelessWidget {
  const _MembershipBenefitCard({required this.business});

  final Business business;

  @override
  Widget build(BuildContext context) {
    final membership = bncMembershipLabel(
      business.bncStarLevel,
      business.planName,
    );
    final discount = business.permanentDiscountPercent > 0
        ? '${business.permanentDiscountPercent}% permanent discount'
        : '';
    return Card(
      margin: EdgeInsets.zero,
      color: BncColors.brand,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            const Icon(Icons.workspace_premium_rounded, color: Colors.white),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (membership.isNotEmpty)
                    Text(
                      membership,
                      style: Theme.of(context).textTheme.labelLarge?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  if (discount.isNotEmpty)
                    Text(
                      [
                        discount,
                        if (business.permanentDiscountLabel.isNotEmpty)
                          business.permanentDiscountLabel,
                      ].join(' · '),
                      style: Theme.of(
                        context,
                      ).textTheme.bodySmall?.copyWith(color: Colors.white),
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

class _ProfileMetricCard extends StatelessWidget {
  const _ProfileMetricCard({
    required this.icon,
    required this.accent,
    required this.title,
    required this.subtitle,
    this.iconSize = 18,
  });

  final IconData icon;
  final Color accent;
  final String title;
  final String subtitle;
  final double iconSize;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: accent, size: iconSize),
                const SizedBox(width: 7),
                Expanded(
                  child: Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: accent,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
            const Spacer(),
            Text(
              subtitle,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: BncColors.muted),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickActions extends ConsumerWidget {
  const _QuickActions({required this.business});

  final Business business;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final actions = [
      if (business.phone.trim().isNotEmpty)
        (
          Icons.phone_rounded,
          'Call',
          () {
            ref
                .read(appRepositoryProvider)
                .track('CALL_CLICK', businessId: business.id);
            _launch('tel:${business.phone}');
          },
        ),
      (
        Icons.chat_rounded,
        'BNC chat',
        () async {
          if (!ref.read(sessionProvider).authenticated) {
            _openLogin(context, '/business/${business.slug}');
            return;
          }
          try {
            final conversationId = await ref
                .read(appRepositoryProvider)
                .startBusinessConversation(
                  business.id,
                  'Hi, I found ${business.name} on BNC and would like more information.',
                );
            if (context.mounted) {
              context.push('/messages/$conversationId');
            }
          } on Object catch (error) {
            if (context.mounted) {
              ScaffoldMessenger.of(
                context,
              ).showSnackBar(SnackBar(content: Text('$error')));
            }
          }
        },
      ),
      (
        Icons.directions_rounded,
        'Directions',
        () {
          ref
              .read(appRepositoryProvider)
              .track('DIRECTIONS_CLICK', businessId: business.id);
          _launch(
            'https://www.google.com/maps/search/?api=1&query='
            '${business.latitude},${business.longitude}',
          );
        },
      ),
      (
        Icons.request_quote_rounded,
        'Enquire',
        () => context.push('/enquiry', extra: {'business': business}),
      ),
    ];
    return Row(
      children: actions
          .map(
            (action) => Expanded(
              child: Padding(
                padding: EdgeInsets.only(right: action == actions.last ? 0 : 8),
                child: InkWell(
                  onTap: action.$3,
                  borderRadius: BorderRadius.circular(16),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 9),
                    child: Column(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: BncColors.brand.withValues(alpha: .09),
                            borderRadius: BorderRadius.circular(15),
                          ),
                          child: Icon(
                            action.$1,
                            color: BncColors.brand,
                            size: 22,
                          ),
                        ),
                        const SizedBox(height: 7),
                        Text(
                          action.$2,
                          style: Theme.of(context).textTheme.labelSmall
                              ?.copyWith(fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          )
          .toList(),
    );
  }

  Future<void> _launch(String url) async {
    await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.child, this.action});

  final String title;
  final Widget child;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(18, 30, 18, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
              ),
              if (action != null) action!,
            ],
          ),
          const SizedBox(height: 13),
          child,
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 13),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: BncColors.brand, size: 22),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: Theme.of(context).textTheme.labelLarge),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: BncColors.muted),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _OfferCard extends StatelessWidget {
  const _OfferCard({required this.offer});

  final Offer offer;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(19),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFFF1E8), Color(0xFFFFFAF5)],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF4D6C3)),
      ),
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
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(color: BncColors.offer),
                ),
                Text(
                  offer.title,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                Text(
                  offer.description,
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: BncColors.muted),
                ),
              ],
            ),
          ),
          if (offer.code != null)
            Chip(
              label: Text(offer.code!),
              avatar: const Icon(Icons.copy_rounded, size: 15),
            ),
        ],
      ),
    );
  }
}

class _ServiceRow extends StatelessWidget {
  const _ServiceRow({required this.service, required this.onTap});

  final Service service;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 9),
      child: ListTile(
        onTap: onTap,
        minTileHeight: 72,
        title: Text(service.name),
        subtitle: Text(
          service.startingPrice == 0
              ? 'Free consultation'
              : 'From ${formatCurrency(service.startingPrice)} · ${service.pricingUnit}',
        ),
        trailing: const Icon(Icons.arrow_forward_rounded),
      ),
    );
  }
}

class _RatingSummary extends StatelessWidget {
  const _RatingSummary({required this.business});

  final Business business;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: BncColors.sky,
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Row(
          children: [
            Text(
              business.rating.toStringAsFixed(1),
              style: Theme.of(
                context,
              ).textTheme.displaySmall?.copyWith(color: BncColors.deepBlue),
            ),
            const SizedBox(width: 15),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: List.generate(
                      5,
                      (index) => const Icon(
                        Icons.star_rounded,
                        color: Color(0xFFF5A623),
                        size: 18,
                      ),
                    ),
                  ),
                  Text(
                    'Based on ${business.reviewCount} customer reviews',
                    style: Theme.of(
                      context,
                    ).textTheme.bodySmall?.copyWith(color: BncColors.muted),
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

class _ReviewCard extends ConsumerStatefulWidget {
  const _ReviewCard({required this.review, required this.businessSlug});

  final Review review;
  final String businessSlug;

  @override
  ConsumerState<_ReviewCard> createState() => _ReviewCardState();
}

class _ReviewCardState extends ConsumerState<_ReviewCard> {
  bool _helpful = false;

  @override
  Widget build(BuildContext context) {
    final review = widget.review;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                backgroundColor: BncColors.brand.withValues(alpha: .1),
                child: Text(
                  initials(review.author),
                  style: const TextStyle(
                    color: BncColors.brand,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              const SizedBox(width: 11),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      review.author,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      review.date,
                      style: Theme.of(
                        context,
                      ).textTheme.bodySmall?.copyWith(color: BncColors.muted),
                    ),
                  ],
                ),
              ),
              RatingLabel(rating: review.rating),
            ],
          ),
          const SizedBox(height: 11),
          Text(review.body),
          const SizedBox(height: 8),
          Row(
            children: [
              if (review.verified)
                const Text(
                  '✓ Verified customer',
                  style: TextStyle(
                    color: BncColors.verified,
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                  ),
                ),
              const Spacer(),
              TextButton.icon(
                onPressed: _helpful
                    ? null
                    : () async {
                        if (!ref.read(sessionProvider).authenticated) {
                          _openLogin(
                            context,
                            '/business/${widget.businessSlug}',
                          );
                          return;
                        }
                        await ref
                            .read(appRepositoryProvider)
                            .markReviewHelpful(review.id);
                        if (mounted) setState(() => _helpful = true);
                      },
                icon: const Icon(Icons.thumb_up_alt_outlined, size: 16),
                label: Text('Helpful ${review.helpful + (_helpful ? 1 : 0)}'),
              ),
              PopupMenuButton<String>(
                tooltip: 'Review actions',
                icon: const Icon(Icons.more_horiz_rounded),
                onSelected: (value) => _reportReview(value),
                itemBuilder: (context) => const [
                  PopupMenuItem(value: 'spam', child: Text('Report spam')),
                  PopupMenuItem(value: 'abuse', child: Text('Report abuse')),
                  PopupMenuItem(
                    value: 'privacy',
                    child: Text('Report privacy concern'),
                  ),
                  PopupMenuItem(value: 'other', child: Text('Other concern')),
                ],
              ),
            ],
          ),
          if (review.ownerReply != null)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(top: 8, left: 18),
              padding: const EdgeInsets.all(13),
              decoration: BoxDecoration(
                color: Theme.of(
                  context,
                ).colorScheme.surfaceContainerHighest.withValues(alpha: .5),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Response from the business',
                    style: Theme.of(context).textTheme.labelMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(review.ownerReply!),
                ],
              ),
            ),
          const SizedBox(height: 5),
          const Divider(),
        ],
      ),
    );
  }

  Future<void> _reportReview(String reason) async {
    if (!ref.read(sessionProvider).authenticated) {
      _openLogin(context, '/business/${widget.businessSlug}');
      return;
    }
    try {
      await ref
          .read(appRepositoryProvider)
          .reportReview(widget.review.id, reason: reason);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Review report sent to moderation.')),
        );
      }
    } on Object catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$error')));
      }
    }
  }
}

class _BusinessProfileLoading extends StatelessWidget {
  const _BusinessProfileLoading();

  @override
  Widget build(BuildContext context) {
    return const SafeArea(
      child: Column(
        children: [
          BncSkeleton(height: 300, radius: 0),
          Padding(
            padding: EdgeInsets.all(18),
            child: Column(
              children: [
                BncSkeleton(height: 75),
                SizedBox(height: 16),
                BncSkeleton(height: 110),
                SizedBox(height: 16),
                BncSkeleton(height: 160),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

void _openGallery(BuildContext context, Business business) {
  showDialog<void>(
    context: context,
    barrierColor: Colors.black,
    builder: (context) => Dialog.fullscreen(
      backgroundColor: Colors.black,
      child: Stack(
        children: [
          PageView(
            children: business.gallery
                .map(
                  (url) => InteractiveViewer(
                    child: Center(
                      child: CachedNetworkImage(
                        imageUrl: url,
                        fit: BoxFit.contain,
                      ),
                    ),
                  ),
                )
                .toList(),
          ),
          Positioned(
            top: MediaQuery.paddingOf(context).top + 8,
            left: 10,
            child: IconButton.filled(
              onPressed: () => Navigator.pop(context),
              style: IconButton.styleFrom(
                backgroundColor: Colors.white.withValues(alpha: .14),
                foregroundColor: Colors.white,
              ),
              icon: const Icon(Icons.close_rounded),
            ),
          ),
        ],
      ),
    ),
  );
}

void _openLogin(BuildContext context, String returnTo) {
  context.push('/login?returnTo=${Uri.encodeQueryComponent(returnTo)}');
}

Future<void> _launchExternal(String url) async {
  final uri = Uri.tryParse(url);
  if (uri == null || !{'http', 'https'}.contains(uri.scheme)) return;
  await launchUrl(uri, mode: LaunchMode.externalApplication);
}

String _socialLabel(String network) {
  final normalized = network.trim();
  if (normalized.isEmpty) return 'Social profile';
  return switch (normalized.toLowerCase()) {
    'x' => 'X (Twitter)',
    'youtube' => 'YouTube',
    _ => '${normalized[0].toUpperCase()}${normalized.substring(1)}',
  };
}
