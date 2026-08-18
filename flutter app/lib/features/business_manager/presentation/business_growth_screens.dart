import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/design_system/components.dart';
import 'package:bnc_mobile/features/business_manager/presentation/business_dashboard_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class BusinessAnalyticsScreen extends ConsumerWidget {
  const BusinessAnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final businessState = ref.watch(activeManagedBusinessProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Analytics')),
      body: businessState.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => ErrorState(error: error),
        data: (business) {
          if (business == null) {
            return EmptyState(
              icon: Icons.analytics_outlined,
              title: 'Create a business first',
              body: 'Analytics appear after a live business profile exists.',
              action: () => context.push('/business/onboarding'),
              actionLabel: 'List a business',
            );
          }
          final analytics = ref.watch(businessAnalyticsProvider(business.id));
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(businessAnalyticsProvider(business.id));
              await ref.read(businessAnalyticsProvider(business.id).future);
            },
            child: analytics.when(
              loading: () => ListView(
                padding: const EdgeInsets.all(18),
                children: const [BncSkeleton(height: 220)],
              ),
              error: (error, stack) => ListView(
                children: [
                  ErrorState(
                    error: error,
                    onRetry: () =>
                        ref.invalidate(businessAnalyticsProvider(business.id)),
                  ),
                ],
              ),
              data: (data) => data.isEmpty
                  ? ListView(
                      children: const [
                        EmptyState(
                          icon: Icons.query_stats_outlined,
                          title: 'No analytics yet',
                          body:
                              'Server-confirmed discovery and engagement metrics will appear here.',
                        ),
                      ],
                    )
                  : _AnalyticsList(data: data),
            ),
          );
        },
      ),
    );
  }
}

class _AnalyticsList extends StatelessWidget {
  const _AnalyticsList({required this.data});

  final Json data;

  @override
  Widget build(BuildContext context) {
    final metrics = [
      ('Profile views', data.integer('profileViews')),
      ('Search appearances', data.integer('searchImpressions')),
      ('Contact actions', data.integer('contactActions')),
      ('Calls', data.integer('calls')),
      ('WhatsApp', data.integer('whatsappClicks')),
      ('Enquiries', data.integer('enquiries')),
    ];
    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 10, 18, 30),
      children: [
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisExtent: 104,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
          ),
          itemCount: metrics.length,
          itemBuilder: (context, index) => Card(
            child: Padding(
              padding: const EdgeInsets.all(15),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(metrics[index].$1),
                  const Spacer(),
                  Text(
                    metrics[index].$2.toString(),
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class BusinessSettingsScreen extends StatelessWidget {
  const BusinessSettingsScreen({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Workspace settings')),
    body: const EmptyState(
      icon: Icons.settings_outlined,
      title: 'Settings service unavailable',
      body:
          'Workspace preferences will appear when the live settings endpoint is available.',
    ),
  );
}

class BusinessGrowthStoryScreen extends StatelessWidget {
  const BusinessGrowthStoryScreen({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Growth guide')),
    body: ListView(
      padding: const EdgeInsets.fromLTRB(18, 10, 18, 30),
      children: [
        Text(
          'Build a clearer local growth loop',
          style: Theme.of(context).textTheme.headlineMedium,
        ),
        const SizedBox(height: 14),
        const _GuideCard(
          icon: Icons.fact_check_outlined,
          title: 'Complete the business profile',
          body:
              'Publish accurate services, prices, hours, service areas, photos and trust evidence.',
        ),
        const _GuideCard(
          icon: Icons.analytics_outlined,
          title: 'Read live intent',
          body:
              'Use server analytics to understand discovery, profile interest and customer actions.',
        ),
        const _GuideCard(
          icon: Icons.forum_outlined,
          title: 'Respond consistently',
          body:
              'Handle enquiries using the permitted contact channel and keep fulfilment information current.',
        ),
        const SizedBox(height: 8),
        ElevatedButton.icon(
          onPressed: () => context.push('/business-manage'),
          icon: const Icon(Icons.tune_rounded),
          label: const Text('Improve my business profile'),
        ),
      ],
    ),
  );
}

class _GuideCard extends StatelessWidget {
  const _GuideCard({
    required this.icon,
    required this.title,
    required this.body,
  });

  final IconData icon;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) => Card(
    margin: const EdgeInsets.only(bottom: 10),
    child: Padding(
      padding: const EdgeInsets.all(18),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 5),
                Text(body),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}
