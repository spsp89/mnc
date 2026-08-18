import 'package:bnc_mobile/core/data/app_repository.dart';
import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/design_system/bnc_theme.dart';
import 'package:bnc_mobile/design_system/components.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

final myBusinessesProvider = FutureProvider<List<Business>>(
  (ref) => ref.watch(appRepositoryProvider).myBusinesses(),
);

final selectedManagedBusinessProvider = Provider<Business?>(
  (ref) => ref.watch(myBusinessesProvider).valueOrNull?.firstOrNull,
);

final activeManagedBusinessProvider = FutureProvider<Business?>((ref) async {
  final businesses = await ref.watch(myBusinessesProvider.future);
  if (businesses.isEmpty) return null;
  return ref.watch(appRepositoryProvider).managedBusiness(businesses.first.id);
});

final businessAnalyticsProvider = FutureProvider.family<Json, String>(
  (ref, businessId) =>
      ref.watch(appRepositoryProvider).businessAnalytics(businessId),
);

class BusinessDashboardScreen extends ConsumerWidget {
  const BusinessDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final businesses = ref.watch(myBusinessesProvider);
    return Scaffold(
      appBar: AppBar(
        title: const BncLogo(),
        actions: [
          IconButton(
            onPressed: () => context.push('/business/messages'),
            icon: const Icon(Icons.chat_bubble_outline_rounded),
          ),
          IconButton(
            onPressed: () => context.push('/business/notifications'),
            icon: const Icon(Icons.notifications_none_rounded),
          ),
          const SizedBox(width: 6),
        ],
      ),
      body: businesses.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => ErrorState(
          error: error,
          onRetry: () => ref.invalidate(myBusinessesProvider),
        ),
        data: (items) {
          if (items.isEmpty) {
            return EmptyState(
              icon: Icons.add_business_rounded,
              title: 'Build your BNC presence',
              body:
                  'Create a complete local profile, get verified and respond to nearby demand.',
              action: () => context.push('/business/onboarding'),
              actionLabel: 'List your business',
            );
          }
          return _DashboardContent(business: items.first);
        },
      ),
    );
  }
}

class _DashboardContent extends ConsumerWidget {
  const _DashboardContent({required this.business});

  final Business business;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final analytics = ref.watch(businessAnalyticsProvider(business.id));
    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(myBusinessesProvider);
        ref.invalidate(businessAnalyticsProvider(business.id));
        await ref.read(businessAnalyticsProvider(business.id).future);
      },
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 120),
        children: [
          _BusinessIdentityCard(business: business),
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(
                child: _MetricCard(
                  label: 'Profile views',
                  value: analytics.valueOrNull?.integer('profileViews') ?? 0,
                  icon: Icons.visibility_outlined,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _MetricCard(
                  label: 'Enquiries',
                  value: analytics.valueOrNull?.integer('enquiries') ?? 0,
                  icon: Icons.request_quote_outlined,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _MetricCard(
                  label: 'Search views',
                  value:
                      analytics.valueOrNull?.integer('searchImpressions') ?? 0,
                  icon: Icons.search_rounded,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _MetricCard(
                  label: 'Response rate',
                  value: analytics.valueOrNull?.integer('responseRate') ?? 0,
                  icon: Icons.speed_rounded,
                  suffix: '%',
                ),
              ),
            ],
          ),
          const SizedBox(height: 28),
          SectionHeader(
            eyebrow: 'Today',
            title: 'Needs your attention',
            actionLabel: 'View all',
            onAction: () => context.go('/business-leads'),
          ),
          const SizedBox(height: 12),
          Card(
            child: Column(
              children: [
                _AttentionTile(
                  icon: Icons.bolt_rounded,
                  color: BncColors.offer,
                  title: 'Review local leads',
                  subtitle: 'Open the live lead queue',
                  onTap: () => context.go('/business-leads'),
                ),
                const Divider(indent: 64),
                _AttentionTile(
                  icon: Icons.star_outline_rounded,
                  color: const Color(0xFFF5A623),
                  title: 'Customer reviews',
                  subtitle: 'Read and reply to live reviews',
                  onTap: () => context.push('/business/reviews'),
                ),
                const Divider(indent: 64),
                _AttentionTile(
                  icon: Icons.inventory_2_outlined,
                  color: BncColors.brand,
                  title: 'Update catalogue availability',
                  subtitle:
                      '${business.products.length} products · ${business.services.length} services',
                  onTap: () => context.go('/business-catalogue'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 28),
          const SectionHeader(eyebrow: 'Growth loop', title: 'Business health'),
          const SizedBox(height: 12),
          Card(
            color: BncColors.sky,
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        'Profile completeness',
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(color: BncColors.deepBlue),
                      ),
                      const Spacer(),
                      Text(
                        '${_profileCompleteness(business)}%',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: BncColors.brand,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 11),
                  LinearProgressIndicator(
                    value: _profileCompleteness(business) / 100,
                    minHeight: 9,
                    borderRadius: BorderRadius.circular(99),
                    backgroundColor: Colors.white,
                  ),
                  const SizedBox(height: 14),
                  const Text(
                    'Complete profiles rank more clearly in organic discovery. Verification and sponsorship remain separately labelled.',
                  ),
                  const SizedBox(height: 15),
                  OutlinedButton(
                    onPressed: () => context.push(
                      '/business/profile/${business.id}',
                      extra: business,
                    ),
                    child: const Text('Improve profile'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 28),
          const SectionHeader(
            eyebrow: 'Last 30 days',
            title: 'How customers connect',
          ),
          const SizedBox(height: 12),
          _ConnectionChart(analytics: analytics.valueOrNull ?? const {}),
        ],
      ),
    );
  }
}

class _BusinessIdentityCard extends StatelessWidget {
  const _BusinessIdentityCard({required this.business});

  final Business business;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [BncColors.deepBlue, Color(0xFF1644B1)],
        ),
        borderRadius: BorderRadius.circular(26),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 64,
            height: 64,
            child: BncNetworkImage(
              url: business.coverImageUrl,
              borderRadius: BorderRadius.circular(18),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        business.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(
                          context,
                        ).textTheme.titleLarge?.copyWith(color: Colors.white),
                      ),
                    ),
                    if (business.verified) ...[
                      const SizedBox(width: 5),
                      const Icon(
                        Icons.verified_rounded,
                        color: Color(0xFF63E6A6),
                        size: 19,
                      ),
                    ],
                  ],
                ),
                Text(
                  '${business.locality} · ${business.category}',
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: Colors.white70),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    StatusBadge(
                      label: business.verified ? 'Verified' : 'Active',
                      color: const Color(0x4435AE79),
                    ),
                    const SizedBox(width: 7),
                    RatingLabel(rating: business.rating, light: true),
                  ],
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () => context.push('/business/${business.slug}'),
            style: IconButton.styleFrom(
              backgroundColor: Colors.white.withValues(alpha: .12),
              foregroundColor: Colors.white,
            ),
            icon: const Icon(Icons.open_in_new_rounded),
            tooltip: 'View public profile',
          ),
        ],
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.label,
    required this.value,
    required this.icon,
    this.suffix = '',
  });

  final String label;
  final int value;
  final IconData icon;
  final String suffix;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(15),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: BncColors.brand, size: 21),
            const SizedBox(height: 12),
            Text(
              '$value$suffix',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            Text(
              label,
              maxLines: 1,
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

class _AttentionTile extends StatelessWidget {
  const _AttentionTile({
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      minTileHeight: 72,
      leading: Container(
        width: 43,
        height: 43,
        decoration: BoxDecoration(
          color: color.withValues(alpha: .1),
          borderRadius: BorderRadius.circular(13),
        ),
        child: Icon(icon, color: color),
      ),
      title: Text(title),
      subtitle: Text(subtitle),
      trailing: const Icon(Icons.arrow_forward_rounded),
    );
  }
}

class _ConnectionChart extends StatelessWidget {
  const _ConnectionChart({required this.analytics});

  final Json analytics;

  @override
  Widget build(BuildContext context) {
    final values = [
      ('Calls', analytics.integer('calls'), BncColors.brand),
      ('WhatsApp', analytics.integer('whatsappClicks'), BncColors.verified),
      ('Enquiries', analytics.integer('enquiries'), BncColors.offer),
    ];
    final maxValue = values
        .map((item) => item.$2)
        .fold<int>(1, (current, value) => value > current ? value : current);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          children: values
              .map(
                (item) => Padding(
                  padding: const EdgeInsets.only(bottom: 15),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Expanded(child: Text(item.$1)),
                          Text(
                            '${item.$2}',
                            style: Theme.of(context).textTheme.labelLarge,
                          ),
                        ],
                      ),
                      const SizedBox(height: 7),
                      LinearProgressIndicator(
                        value: item.$2 / maxValue,
                        minHeight: 8,
                        borderRadius: BorderRadius.circular(99),
                        color: item.$3,
                        backgroundColor: item.$3.withValues(alpha: .1),
                      ),
                    ],
                  ),
                ),
              )
              .toList(),
        ),
      ),
    );
  }
}

extension<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}

int _profileCompleteness(Business business) {
  final fields = [
    business.name,
    business.description,
    business.coverImageUrl,
    business.city,
    business.locality,
    business.address,
    business.phone,
    business.category,
  ];
  return ((fields.where((value) => value.trim().isNotEmpty).length /
              fields.length) *
          100)
      .round();
}
