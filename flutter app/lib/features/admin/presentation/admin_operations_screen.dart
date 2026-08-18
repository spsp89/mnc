import 'dart:convert';

import 'package:bnc_mobile/core/data/app_repository.dart';
import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/design_system/components.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class AdminOperationDefinition {
  const AdminOperationDefinition({
    required this.slug,
    required this.title,
    required this.description,
    required this.icon,
  });

  final String slug;
  final String title;
  final String description;
  final IconData icon;
}

const adminOperations = <AdminOperationDefinition>[
  AdminOperationDefinition(
    slug: 'users',
    title: 'Users',
    description: 'Live customer and owner accounts',
    icon: Icons.people_outline_rounded,
  ),
  AdminOperationDefinition(
    slug: 'businesses',
    title: 'Businesses',
    description: 'Live listings and ownership state',
    icon: Icons.storefront_outlined,
  ),
  AdminOperationDefinition(
    slug: 'reviews',
    title: 'Review moderation',
    description: 'Pending and flagged reviews',
    icon: Icons.rate_review_outlined,
  ),
  AdminOperationDefinition(
    slug: 'support',
    title: 'Support',
    description: 'Server support queue',
    icon: Icons.support_agent_rounded,
  ),
  AdminOperationDefinition(
    slug: 'finance',
    title: 'Finance',
    description: 'Payments, refunds and settlements',
    icon: Icons.payments_outlined,
  ),
  AdminOperationDefinition(
    slug: 'audit-log',
    title: 'Audit log',
    description: 'Recorded administrative actions',
    icon: Icons.history_rounded,
  ),
  AdminOperationDefinition(
    slug: 'ranking',
    title: 'Ranking',
    description: 'Active organic ranking configuration',
    icon: Icons.tune_rounded,
  ),
];

AdminOperationDefinition? adminOperationBySlug(String slug) {
  for (final operation in adminOperations) {
    if (operation.slug == slug) return operation;
  }
  return null;
}

class AdminOperationsHub extends StatelessWidget {
  const AdminOperationsHub({super.key});

  @override
  Widget build(BuildContext context) => GridView.builder(
    padding: const EdgeInsets.fromLTRB(16, 16, 16, 30),
    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
      crossAxisCount: 2,
      mainAxisExtent: 150,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
    ),
    itemCount: adminOperations.length,
    itemBuilder: (context, index) {
      final operation = adminOperations[index];
      return Card(
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: () => context.push('/admin/${operation.slug}'),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(operation.icon),
                const Spacer(),
                Text(
                  operation.title,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 3),
                Text(
                  operation.description,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ),
      );
    },
  );
}

final adminResourceProvider = FutureProvider.family<dynamic, String>(
  (ref, section) => ref.watch(appRepositoryProvider).adminResource(section),
);

class AdminOperationScreen extends ConsumerWidget {
  const AdminOperationScreen({required this.section, super.key});

  final String section;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final operation = adminOperationBySlug(section);
    if (operation == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Admin')),
        body: const EmptyState(
          icon: Icons.not_interested_outlined,
          title: 'Unsupported operation',
          body: 'This operation is not exposed by the live admin API.',
        ),
      );
    }
    final resource = ref.watch(adminResourceProvider(section));
    return Scaffold(
      appBar: AppBar(title: Text(operation.title)),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(adminResourceProvider(section));
          await ref.read(adminResourceProvider(section).future);
        },
        child: resource.when(
          loading: () => ListView(
            padding: const EdgeInsets.all(18),
            children: const [
              BncSkeleton(height: 92),
              SizedBox(height: 10),
              BncSkeleton(height: 92),
            ],
          ),
          error: (error, stack) => ListView(
            children: [
              ErrorState(
                error: error,
                onRetry: () => ref.invalidate(adminResourceProvider(section)),
              ),
            ],
          ),
          data: (body) {
            final rows = _resourceRows(body);
            if (rows.isEmpty) {
              return ListView(
                children: const [
                  EmptyState(
                    icon: Icons.inbox_outlined,
                    title: 'No live records',
                    body: 'The server returned no records for this operation.',
                  ),
                ],
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 30),
              itemCount: rows.length,
              separatorBuilder: (_, _) => const SizedBox(height: 9),
              itemBuilder: (context, index) {
                final row = rows[index];
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: SelectableText(
                      const JsonEncoder.withIndent('  ').convert(row),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}

List<Json> _resourceRows(dynamic body) {
  final data = body is Map ? body['data'] : body;
  if (data is List) {
    return data
        .whereType<Map>()
        .map((item) => item.map((key, value) => MapEntry('$key', value)))
        .toList();
  }
  if (data is Map) {
    return [data.map((key, value) => MapEntry('$key', value))];
  }
  return const [];
}
