import 'package:bnc_mobile/core/data/app_repository.dart';
import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/core/state/app_state.dart';
import 'package:bnc_mobile/design_system/bnc_theme.dart';
import 'package:bnc_mobile/design_system/components.dart';
import 'package:bnc_mobile/features/catalog/presentation/catalog_screens.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class ServiceDetailData {
  const ServiceDetailData({required this.service, required this.business});

  final Service service;
  final Business business;
}

final serviceDetailProvider = FutureProvider.family<ServiceDetailData, String>((
  ref,
  id,
) async {
  final repository = ref.watch(appRepositoryProvider);
  final service = await repository.service(id);
  if (service.businessSlug.isEmpty) {
    throw StateError('This service is not connected to a public business.');
  }
  final business = await repository.business(service.businessSlug);
  return ServiceDetailData(service: service, business: business);
});

class ServiceDetailScreen extends ConsumerWidget {
  const ServiceDetailScreen({required this.id, super.key});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(serviceDetailProvider(id));
    return Scaffold(
      backgroundColor: const Color(0xFFF7F9FE),
      appBar: AppBar(
        backgroundColor: BncColors.brand,
        foregroundColor: Colors.white,
        systemOverlayStyle: SystemUiOverlayStyle.light.copyWith(
          statusBarColor: BncColors.brand,
        ),
        titleTextStyle: Theme.of(
          context,
        ).textTheme.titleLarge?.copyWith(color: Colors.white),
        title: const Text('Service details'),
      ),
      body: state.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => ErrorState(error: error),
        data: (detail) => _ServiceDetailBody(detail: detail),
      ),
      bottomNavigationBar: state.valueOrNull == null
          ? null
          : SafeArea(
              minimum: const EdgeInsets.fromLTRB(16, 10, 16, 12),
              child: ElevatedButton.icon(
                onPressed: () {
                  final detail = state.requireValue;
                  context.push(
                    '/enquiry',
                    extra: {
                      'business': detail.business,
                      'service': detail.service,
                    },
                  );
                },
                icon: const Icon(Icons.request_quote_outlined),
                label: const Text('Request a quote'),
              ),
            ),
    );
  }
}

class _ServiceDetailBody extends ConsumerWidget {
  const _ServiceDetailBody({required this.detail});

  final ServiceDetailData detail;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final service = detail.service;
    final business = detail.business;
    final price = service.startingPrice == 0
        ? 'Free consultation'
        : 'From ${formatCurrency(service.startingPrice)}';
    final related =
        (ref.watch(servicesListProvider).valueOrNull ?? const <Service>[])
            .where((item) => item.id != service.id)
            .take(4)
            .toList();

    return ListView(
      padding: EdgeInsets.zero,
      children: [
        ImmersivePageHeader(
          eyebrow: business.category,
          title: service.name,
          subtitle: 'By ${business.name}',
          footer: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'STARTING PRICE',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: Colors.white.withValues(alpha: .7),
                  fontWeight: FontWeight.w900,
                  letterSpacing: .9,
                ),
              ),
              const SizedBox(height: 4),
              Wrap(
                crossAxisAlignment: WrapCrossAlignment.end,
                spacing: 8,
                children: [
                  Text(
                    price,
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  Text(
                    service.pricingUnit,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.white.withValues(alpha: .72),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 28),
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: _ServiceFactCard(
                      icon: Icons.location_on_outlined,
                      title: business.locality,
                      subtitle: business.city,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _ServiceFactCard(
                      icon: Icons.schedule_rounded,
                      title: service.duration.isEmpty
                          ? 'Flexible timing'
                          : service.duration,
                      subtitle: 'Typical duration',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: _ServiceFactCard(
                      icon: service.homeService
                          ? Icons.home_work_outlined
                          : Icons.storefront_outlined,
                      title: service.homeService
                          ? 'Home service'
                          : 'At the business',
                      subtitle: 'Availability',
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _ServiceFactCard(
                      icon: Icons.star_rounded,
                      title: business.rating.toStringAsFixed(1),
                      subtitle: '${business.reviewCount} reviews',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 26),
              Text(
                'About this service',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Text(
                service.description.isNotEmpty
                    ? service.description
                    : 'Share the scope, preferred date and location with ${business.name}. '
                          'The business can confirm availability and provide a final written estimate before work begins.',
                style: Theme.of(
                  context,
                ).textTheme.bodyLarge?.copyWith(color: BncColors.muted),
              ),
              const SizedBox(height: 18),
              Card(
                color: const Color(0xFFEAF2FF),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(
                        Icons.verified_user_outlined,
                        color: BncColors.brand,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Your contact details are shared only according to the consent choices shown when you submit an enquiry.',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () =>
                          context.push('/business/${business.slug}'),
                      icon: const Icon(Icons.storefront_outlined),
                      label: const Text('View business'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        if (!ref.read(sessionProvider).authenticated) {
                          context.push(
                            '/login?returnTo=${Uri.encodeQueryComponent('/services/${service.id}')}',
                          );
                          return;
                        }
                        try {
                          final conversationId = await ref
                              .read(appRepositoryProvider)
                              .startBusinessConversation(
                                business.id,
                                'Hi, I would like to ask about ${service.name}.',
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
                      icon: const Icon(Icons.chat_outlined),
                      label: const Text('BNC chat'),
                    ),
                  ),
                ],
              ),
              if (related.isNotEmpty) ...[
                const SizedBox(height: 30),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'More services nearby',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ),
                    TextButton(
                      onPressed: () => context.go('/services'),
                      child: const Text('View all'),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                for (final item in related)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 9),
                    child: Card(
                      child: ListTile(
                        onTap: () => context.push('/services/${item.id}'),
                        leading: Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: const Color(0xFFEAF2FF),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Icon(
                            _detailServiceIcon(item.name),
                            color: BncColors.brand,
                          ),
                        ),
                        title: Text(item.name),
                        subtitle: Text(
                          item.startingPrice == 0
                              ? 'Free consultation'
                              : 'From ${formatCurrency(item.startingPrice)}',
                        ),
                        trailing: const Icon(Icons.arrow_forward_rounded),
                      ),
                    ),
                  ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _ServiceFactCard extends StatelessWidget {
  const _ServiceFactCard({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: BncColors.border),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: BncColors.brand),
        const SizedBox(height: 12),
        Text(
          title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 2),
        Text(
          subtitle,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(color: BncColors.muted),
        ),
      ],
    ),
  );
}

IconData _detailServiceIcon(String serviceName) {
  final name = serviceName.toLowerCase();
  if (name.contains('table') || name.contains('catering')) {
    return Icons.restaurant_rounded;
  }
  if (name.contains('laptop') || name.contains('screen')) {
    return Icons.devices_rounded;
  }
  if (name.contains('wedding') || name.contains('photography')) {
    return Icons.camera_alt_rounded;
  }
  if (name.contains('design')) return Icons.palette_rounded;
  if (name.contains('doctor')) return Icons.health_and_safety_rounded;
  if (name.contains('hair')) return Icons.content_cut_rounded;
  if (name.contains('car') || name.contains('detailing')) {
    return Icons.directions_car_rounded;
  }
  if (name.contains('academic')) return Icons.school_rounded;
  return Icons.handyman_rounded;
}
