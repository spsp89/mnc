import 'package:bnc_mobile/core/data/app_repository.dart';
import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/core/state/app_state.dart';
import 'package:bnc_mobile/design_system/bnc_theme.dart';
import 'package:bnc_mobile/design_system/components.dart';
import 'package:bnc_mobile/features/admin/presentation/admin_operations_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

final adminOverviewProvider = FutureProvider<Json>(
  (ref) => ref.watch(appRepositoryProvider).adminOverview(),
);

class AdminPanelScreen extends ConsumerWidget {
  const AdminPanelScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionProvider);
    final user = session.user;
    if (user == null || !user.isAdministrator) {
      return Scaffold(
        appBar: AppBar(title: const Text('Admin')),
        body: EmptyState(
          icon: Icons.admin_panel_settings_outlined,
          title: 'Administrator access required',
          body: 'Sign in with an authorised administrator account.',
          action: () => context.go('/login'),
          actionLabel: 'Sign in',
        ),
      );
    }
    final overview = ref.watch(adminOverviewProvider);
    return Scaffold(
      appBar: AppBar(
        backgroundColor: BncColors.brand,
        foregroundColor: Colors.white,
        title: const Text('BNC Admin'),
        actions: [
          IconButton(
            tooltip: 'Sign out',
            onPressed: () async {
              await ref.read(sessionProvider.notifier).logout();
              if (context.mounted) context.go('/login');
            },
            icon: const Icon(Icons.logout_rounded),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(adminOverviewProvider);
          await ref.read(adminOverviewProvider.future);
        },
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 30),
          children: [
            Text(
              'Welcome, ${user.displayName}',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 16),
            overview.when(
              loading: () => const BncSkeleton(height: 188),
              error: (error, stack) => ErrorState(
                error: error,
                onRetry: () => ref.invalidate(adminOverviewProvider),
              ),
              data: (data) => _OverviewGrid(data: data),
            ),
            const SizedBox(height: 22),
            Text(
              'Live operations',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 6),
            const Text(
              'Every section below reads from the authenticated admin API.',
            ),
            const SizedBox(height: 10),
            SizedBox(
              height: ((adminOperations.length + 1) ~/ 2) * 162,
              child: const AdminOperationsHub(),
            ),
          ],
        ),
      ),
    );
  }
}

class _OverviewGrid extends StatelessWidget {
  const _OverviewGrid({required this.data});

  final Json data;

  @override
  Widget build(BuildContext context) {
    final metrics = [
      ('Users', data.integer('users')),
      ('Businesses', data.integer('businesses')),
      ('Verification queue', data.integer('pendingVerification')),
      ('Review queue', data.integer('pendingReviews')),
      ('Open tickets', data.integer('openTickets')),
      ('Captured value', data.decimal('capturedPaymentValue')),
    ];
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisExtent: 100,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
      ),
      itemCount: metrics.length,
      itemBuilder: (context, index) {
        final metric = metrics[index];
        return Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(metric.$1),
                const Spacer(),
                Text(
                  metric.$2.toString(),
                  style: Theme.of(context).textTheme.titleLarge,
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
