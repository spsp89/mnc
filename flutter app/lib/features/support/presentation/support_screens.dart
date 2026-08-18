import 'package:bnc_mobile/core/data/app_repository.dart';
import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/core/state/app_state.dart';
import 'package:bnc_mobile/core/storage/app_preferences.dart';
import 'package:bnc_mobile/design_system/bnc_theme.dart';
import 'package:bnc_mobile/design_system/components.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

enum BncInformationPage { about, privacy, terms, refunds }

final publicPlansProvider = FutureProvider<List<SubscriptionPlan>>(
  (ref) => ref.watch(appRepositoryProvider).subscriptionPlans(),
);

final blockedBusinessesProvider = FutureProvider<List<Business>>(
  (ref) => ref.watch(appRepositoryProvider).blockedBusinesses(),
);

final supportTicketsProvider = FutureProvider<List<Json>>((ref) {
  final authenticated = ref.watch(
    sessionProvider.select((session) => session.authenticated),
  );
  if (!authenticated) return Future.value(const <Json>[]);
  return ref.watch(appRepositoryProvider).supportTickets();
});

class PricingScreen extends ConsumerWidget {
  const PricingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final plans = ref.watch(publicPlansProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Business plans')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(publicPlansProvider);
          await ref.read(publicPlansProvider.future);
        },
        child: plans.when(
          loading: () => ListView(
            padding: const EdgeInsets.all(18),
            children: const [
              BncSkeleton(height: 180),
              SizedBox(height: 12),
              BncSkeleton(height: 180),
            ],
          ),
          error: (error, stack) => ListView(
            children: [
              ErrorState(
                error: error,
                onRetry: () => ref.invalidate(publicPlansProvider),
              ),
            ],
          ),
          data: (items) => items.isEmpty
              ? ListView(
                  children: const [
                    EmptyState(
                      icon: Icons.workspace_premium_outlined,
                      title: 'No plans available',
                      body:
                          'Published subscription plans from the BNC server will appear here.',
                    ),
                  ],
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(18, 10, 18, 30),
                  itemCount: items.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (context, index) =>
                      _SubscriptionPlanCard(plan: items[index]),
                ),
        ),
      ),
    );
  }
}

class _SubscriptionPlanCard extends StatelessWidget {
  const _SubscriptionPlanCard({required this.plan});

  final SubscriptionPlan plan;

  @override
  Widget build(BuildContext context) => Card(
    color: plan.recommended ? BncColors.brand : null,
    child: Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            plan.name,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              color: plan.recommended ? Colors.white : null,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            plan.price == 0
                ? 'Free'
                : '${formatCurrency(plan.price)} / ${plan.interval}',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              color: plan.recommended ? Colors.white : BncColors.brand,
            ),
          ),
          if (plan.features.isNotEmpty) ...[
            const SizedBox(height: 14),
            for (final feature in plan.features)
              Padding(
                padding: const EdgeInsets.only(bottom: 7),
                child: Row(
                  children: [
                    Icon(
                      Icons.check_circle_outline_rounded,
                      size: 19,
                      color: plan.recommended
                          ? Colors.white
                          : BncColors.verified,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        feature,
                        style: TextStyle(
                          color: plan.recommended ? Colors.white : null,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ],
      ),
    ),
  );
}

class HelpCenterScreen extends StatelessWidget {
  const HelpCenterScreen({super.key});

  static const _faqs = [
    (
      'How are search results ordered?',
      'Results can consider relevance, category, distance, availability and profile quality. Paid placements must be identified separately.',
    ),
    (
      'What happens when I send an enquiry?',
      'The server sends the information you approve to the selected business or eligible matches.',
    ),
    (
      'How do payments work?',
      'Payment status is confirmed by the server after the payment provider sends a signed webhook.',
    ),
    (
      'How can I control my data?',
      'Use Account and Privacy to review sessions, consents, saved details, export requests and account deletion.',
    ),
  ];

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Help centre')),
    body: ListView(
      padding: const EdgeInsets.fromLTRB(18, 10, 18, 30),
      children: [
        for (final faq in _faqs)
          Card(
            margin: const EdgeInsets.only(bottom: 10),
            child: ExpansionTile(
              title: Text(faq.$1),
              childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              expandedCrossAxisAlignment: CrossAxisAlignment.start,
              children: [Text(faq.$2)],
            ),
          ),
        const SizedBox(height: 10),
        ElevatedButton.icon(
          onPressed: () => context.push('/contact'),
          icon: const Icon(Icons.support_agent_rounded),
          label: const Text('Contact BNC'),
        ),
      ],
    ),
  );
}

class SupportTicketsScreen extends ConsumerWidget {
  const SupportTicketsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(supportTicketsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Support requests')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/contact'),
        icon: const Icon(Icons.add_rounded),
        label: const Text('New request'),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(supportTicketsProvider);
          await ref.read(supportTicketsProvider.future);
        },
        child: state.when(
          loading: () => ListView(
            padding: const EdgeInsets.all(18),
            children: const [
              BncSkeleton(height: 116),
              SizedBox(height: 10),
              BncSkeleton(height: 116),
            ],
          ),
          error: (error, stack) => ListView(
            children: [
              ErrorState(
                error: error,
                onRetry: () => ref.invalidate(supportTicketsProvider),
              ),
            ],
          ),
          data: (items) => items.isEmpty
              ? ListView(
                  children: [
                    EmptyState(
                      icon: Icons.support_agent_rounded,
                      title: 'No support requests yet',
                      body:
                          'Requests you send while signed in will appear here with their current status.',
                      action: () => context.push('/contact'),
                      actionLabel: 'Contact BNC',
                    ),
                  ],
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 10, 16, 100),
                  itemCount: items.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final ticket = items[index];
                    final status = ticket.string('status', 'OPEN');
                    final resolved = status == 'RESOLVED' || status == 'CLOSED';
                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    ticket.string(
                                      'subject',
                                      'Customer support request',
                                    ),
                                    style: Theme.of(
                                      context,
                                    ).textTheme.titleMedium,
                                  ),
                                ),
                                StatusBadge(
                                  label: _humanizeSupportStatus(status),
                                  color: resolved
                                      ? BncColors.verified
                                      : BncColors.brand,
                                ),
                              ],
                            ),
                            const SizedBox(height: 9),
                            Text(
                              ticket.string('ticketNumber'),
                              style: Theme.of(context).textTheme.labelLarge
                                  ?.copyWith(color: BncColors.brand),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              '${_humanizeSupportStatus(ticket.string('category'))} · '
                              'Updated ${_supportDate(ticket.string('updatedAt', ticket.string('createdAt')))}',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ),
    );
  }
}

class ContactSupportScreen extends ConsumerStatefulWidget {
  const ContactSupportScreen({
    super.key,
    this.initialTopic,
    this.initialMessage,
    this.reportMode = false,
  });

  final String? initialTopic;
  final String? initialMessage;
  final bool reportMode;

  @override
  ConsumerState<ContactSupportScreen> createState() =>
      _ContactSupportScreenState();
}

class _ContactSupportScreenState extends ConsumerState<ContactSupportScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  late final TextEditingController _message;
  late String _topic;
  bool _submitting = false;
  String? _ticketNumber;
  String? _error;

  @override
  void initState() {
    super.initState();
    final user = ref.read(sessionProvider).user;
    _name.text = user?.displayName ?? '';
    _email.text = user?.email ?? '';
    _topic = _topicValue(
      widget.initialTopic ?? (widget.reportMode ? 'trust_safety' : 'general'),
    );
    _message = TextEditingController(text: widget.initialMessage);
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _message.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final ticket = await ref.read(appRepositoryProvider).createSupportTicket({
        'name': _name.text.trim(),
        'email': _email.text.trim(),
        'topic': _topic,
        'message': _message.text.trim(),
      });
      if (!mounted) return;
      ref.invalidate(supportTicketsProvider);
      setState(() {
        _ticketNumber = ticket.string('ticketNumber');
        _submitting = false;
      });
    } on Object catch (error) {
      if (mounted) {
        setState(() {
          _error = '$error';
          _submitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: Text(widget.reportMode ? 'Report a concern' : 'Contact BNC'),
    ),
    body: _ticketNumber != null
        ? Center(
            child: Padding(
              padding: const EdgeInsets.all(28),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const CircleAvatar(
                    radius: 34,
                    backgroundColor: BncColors.sky,
                    child: Icon(
                      Icons.check_rounded,
                      color: BncColors.brand,
                      size: 38,
                    ),
                  ),
                  const SizedBox(height: 18),
                  Text(
                    'Your request is with BNC',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    ref.watch(sessionProvider).authenticated
                        ? 'Ticket $_ticketNumber was submitted securely. Updates will appear in your notifications.'
                        : 'Ticket $_ticketNumber was submitted securely. Keep this number for follow-up by email.',
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 20),
                  Wrap(
                    alignment: WrapAlignment.center,
                    spacing: 10,
                    runSpacing: 10,
                    children: [
                      OutlinedButton(
                        onPressed: () => context.pop(),
                        child: const Text('Done'),
                      ),
                      if (ref.watch(sessionProvider).authenticated)
                        ElevatedButton.icon(
                          onPressed: () => context.go('/account/support'),
                          icon: const Icon(Icons.support_agent_rounded),
                          label: const Text('View my requests'),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          )
        : Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(18, 10, 18, 30),
              children: [
                if (!ref.watch(sessionProvider).authenticated)
                  const Padding(
                    padding: EdgeInsets.only(bottom: 12),
                    child: Text(
                      'You can submit without signing in. BNC will reply to the email you provide.',
                    ),
                  ),
                DropdownButtonFormField<String>(
                  initialValue: _topic,
                  decoration: const InputDecoration(labelText: 'Topic'),
                  items: const [
                    DropdownMenuItem(
                      value: 'general',
                      child: Text('Customer support'),
                    ),
                    DropdownMenuItem(
                      value: 'account',
                      child: Text('Account and privacy'),
                    ),
                    DropdownMenuItem(value: 'billing', child: Text('Billing')),
                    DropdownMenuItem(value: 'privacy', child: Text('Privacy')),
                    DropdownMenuItem(
                      value: 'trust_safety',
                      child: Text('Trust and safety'),
                    ),
                    DropdownMenuItem(
                      value: 'other',
                      child: Text('Something else'),
                    ),
                  ],
                  onChanged: (value) => _topic = value ?? _topic,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _name,
                  maxLength: 100,
                  decoration: const InputDecoration(
                    labelText: 'Your name',
                    counterText: '',
                  ),
                  validator: (value) {
                    final text = value?.trim() ?? '';
                    if (text.length < 2) return 'Enter your name';
                    if (text.length > 100) {
                      return 'Use no more than 100 characters';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  maxLength: 180,
                  decoration: const InputDecoration(
                    labelText: 'Reply email',
                    counterText: '',
                  ),
                  validator: (value) {
                    final text = value?.trim() ?? '';
                    if (!text.contains('@')) return 'Enter a valid email';
                    if (text.length > 180) {
                      return 'Use no more than 180 characters';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _message,
                  minLines: 5,
                  maxLines: 9,
                  maxLength: 2000,
                  decoration: const InputDecoration(
                    labelText: 'Message',
                    counterText: '',
                  ),
                  validator: (value) {
                    final text = value?.trim() ?? '';
                    if (text.length < 15) {
                      return 'Please include at least 15 characters';
                    }
                    if (text.length > 2000) {
                      return 'Use no more than 2000 characters';
                    }
                    return null;
                  },
                ),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    _error!,
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                ],
                const SizedBox(height: 18),
                ElevatedButton.icon(
                  onPressed: _submitting ? null : _send,
                  icon: const Icon(Icons.send_rounded),
                  label: Text(_submitting ? 'Submitting…' : 'Send to BNC'),
                ),
              ],
            ),
          ),
  );

  String _topicValue(String value) => switch (value.toLowerCase()) {
    'account' || 'account and privacy' => 'account',
    'billing' => 'billing',
    'privacy' => 'privacy',
    'trust & safety' || 'trust and safety' || 'trust_safety' => 'trust_safety',
    'other' || 'something else' => 'other',
    _ => 'general',
  };
}

String _humanizeSupportStatus(String value) => value
    .trim()
    .toLowerCase()
    .split(RegExp(r'[_\s-]+'))
    .where((part) => part.isNotEmpty)
    .map((part) => '${part[0].toUpperCase()}${part.substring(1)}')
    .join(' ');

String _supportDate(String value) {
  final date = DateTime.tryParse(value)?.toLocal();
  if (date == null) return 'recently';
  return '${date.day.toString().padLeft(2, '0')}/'
      '${date.month.toString().padLeft(2, '0')}/${date.year}';
}

class InformationScreen extends StatelessWidget {
  const InformationScreen({required this.page, super.key});

  final BncInformationPage page;

  @override
  Widget build(BuildContext context) {
    final content = _content[page]!;
    return Scaffold(
      appBar: AppBar(title: Text(content.$1)),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(18, 10, 18, 30),
        children: [
          Text(content.$2, style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 14),
          for (final section in content.$3)
            Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Text(section),
              ),
            ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: () => context.push('/contact'),
            icon: const Icon(Icons.mail_outline_rounded),
            label: const Text('Ask BNC a question'),
          ),
        ],
      ),
    );
  }

  static const _content = {
    BncInformationPage.about: (
      'About BNC',
      'Local discovery with accountable connections',
      [
        'BNC helps people find businesses, products and services published through its live marketplace.',
        'Business details, availability, offers and reviews are supplied by the server and participating businesses.',
      ],
    ),
    BncInformationPage.privacy: (
      'Privacy',
      'Your information and choices',
      [
        'BNC processes account, location, enquiry and transaction information to provide requested services.',
        'Privacy controls include session review, consent history, data export and account deletion.',
      ],
    ),
    BncInformationPage.terms: (
      'Terms',
      'Rules for using BNC',
      [
        'Provide accurate information, protect account access and use the marketplace lawfully.',
        'Businesses are responsible for the accuracy of their listings, prices, availability and fulfilment.',
      ],
    ),
    BncInformationPage.refunds: (
      'Refunds',
      'Cancellations, returns and refunds',
      [
        'Eligibility depends on the order, fulfilment status and the seller policy shown during purchase.',
        'Approved refunds are processed through the original payment route and confirmed by the server.',
      ],
    ),
  };
}

final compareCandidatesProvider = FutureProvider<List<Business>>((ref) {
  final settings = ref.watch(appSettingsProvider);
  return ref
      .watch(appRepositoryProvider)
      .searchBusinesses(
        SearchFilters(
          location: settings.apiLocation,
          latitude: settings.apiLatitude,
          longitude: settings.apiLongitude,
          radiusKm: settings.searchRadiusKm,
        ),
      )
      .then((page) => page.items);
});

final compareBusinessDetailProvider = FutureProvider.family<Business, String>(
  (ref, slug) => ref.watch(appRepositoryProvider).business(slug),
);

class CompareBusinessesScreen extends ConsumerStatefulWidget {
  const CompareBusinessesScreen({super.key});

  @override
  ConsumerState<CompareBusinessesScreen> createState() =>
      _CompareBusinessesScreenState();
}

class _CompareBusinessesScreenState
    extends ConsumerState<CompareBusinessesScreen> {
  final Set<String> _selected = {};

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(compareCandidatesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Compare businesses')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(compareCandidatesProvider);
          await ref.read(compareCandidatesProvider.future);
        },
        child: state.when(
          loading: () => ListView(
            padding: const EdgeInsets.all(18),
            children: const [
              BncSkeleton(height: 86),
              SizedBox(height: 10),
              BncSkeleton(height: 86),
            ],
          ),
          error: (error, stack) => ListView(
            children: [
              ErrorState(
                error: error,
                onRetry: () => ref.invalidate(compareCandidatesProvider),
              ),
            ],
          ),
          data: (items) {
            final selectedSummaries = items
                .where((item) => _selected.contains(item.id))
                .toList();
            final selected = [
              for (final business in selectedSummaries)
                ref
                        .watch(compareBusinessDetailProvider(business.slug))
                        .valueOrNull ??
                    business,
            ];
            return ListView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 30),
              children: [
                Card(
                  color: BncColors.sky,
                  child: const Padding(
                    padding: EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Icon(
                          Icons.compare_arrows_rounded,
                          color: BncColors.brand,
                        ),
                        SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Select two or three live businesses to compare rating, distance, availability and response time.',
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                for (final business in items)
                  Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: CheckboxListTile(
                      value: _selected.contains(business.id),
                      secondary: const Icon(Icons.storefront_outlined),
                      title: Text(business.name),
                      subtitle: Text(
                        [
                          business.category,
                          business.locality,
                          if (business.rating > 0)
                            '${business.rating.toStringAsFixed(1)} ★',
                        ].where((value) => value.isNotEmpty).join(' · '),
                      ),
                      onChanged: (value) {
                        if (value == true &&
                            _selected.length >= 3 &&
                            !_selected.contains(business.id)) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'You can compare up to three businesses.',
                              ),
                            ),
                          );
                          return;
                        }
                        setState(() {
                          value == true
                              ? _selected.add(business.id)
                              : _selected.remove(business.id);
                        });
                      },
                    ),
                  ),
                if (items.isEmpty)
                  const EmptyState(
                    icon: Icons.storefront_outlined,
                    title: 'No businesses available',
                    body: 'The live directory returned no comparison options.',
                  ),
                if (selected.length >= 2) ...[
                  const SizedBox(height: 18),
                  Text(
                    'Comparison',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 10),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: DataTable(
                      columns: [
                        const DataColumn(label: Text('Detail')),
                        for (final business in selected)
                          DataColumn(
                            label: SizedBox(
                              width: 132,
                              child: Text(
                                business.name,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ),
                      ],
                      rows: [
                        _comparisonRow(
                          'Rating',
                          selected,
                          (item) => item.rating > 0
                              ? '${item.rating.toStringAsFixed(1)} (${item.reviewCount})'
                              : 'New',
                        ),
                        _comparisonRow(
                          'Distance',
                          selected,
                          (item) =>
                              item.distanceKm != null && item.distanceKm! > 0
                              ? '${item.distanceKm!.toStringAsFixed(1)} km'
                              : item.locality,
                        ),
                        _comparisonRow(
                          'Status',
                          selected,
                          (item) => item.hoursKnown
                              ? item.openNow
                                    ? 'Open now'
                                    : 'Closed now'
                              : 'Hours not stated',
                        ),
                        _comparisonRow(
                          'Response',
                          selected,
                          (item) => item.responseTime.isEmpty
                              ? 'Not stated'
                              : item.responseTime,
                        ),
                        _comparisonRow(
                          'Price',
                          selected,
                          (item) => item.priceRange,
                        ),
                        _comparisonRow(
                          'Experience',
                          selected,
                          (item) => item.yearsInBusiness > 0
                              ? '${item.yearsInBusiness} years'
                              : 'Not stated',
                        ),
                        _comparisonRow(
                          'Home service',
                          selected,
                          (item) => item.services.isEmpty
                              ? 'Not stated'
                              : item.services.any(
                                  (service) => service.homeService,
                                )
                              ? 'Available'
                              : 'At business only',
                        ),
                        _comparisonRow(
                          'Languages',
                          selected,
                          (item) => item.languages.isEmpty
                              ? 'Not stated'
                              : item.languages.join(', '),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  for (final business in selected)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: OutlinedButton.icon(
                        onPressed: () =>
                            context.push('/business/${business.slug}'),
                        icon: const Icon(Icons.open_in_new_rounded),
                        label: Text('View ${business.name}'),
                      ),
                    ),
                ] else if (_selected.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  const Text('Select one more business to compare.'),
                ],
              ],
            );
          },
        ),
      ),
    );
  }

  DataRow _comparisonRow(
    String label,
    List<Business> items,
    String Function(Business) value,
  ) => DataRow(
    cells: [
      DataCell(
        Text(label, style: const TextStyle(fontWeight: FontWeight.w700)),
      ),
      for (final item in items) DataCell(Text(value(item))),
    ],
  );
}

final myReviewsProvider = FutureProvider<List<Review>>(
  (ref) => ref.watch(appRepositoryProvider).myReviews(),
);

class MyReviewsScreen extends ConsumerWidget {
  const MyReviewsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(myReviewsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('My reviews')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(myReviewsProvider);
          await ref.read(myReviewsProvider.future);
        },
        child: state.when(
          loading: () => ListView(
            padding: const EdgeInsets.all(18),
            children: const [BncSkeleton(height: 130)],
          ),
          error: (error, stack) => ListView(
            children: [
              ErrorState(
                error: error,
                onRetry: () => ref.invalidate(myReviewsProvider),
              ),
            ],
          ),
          data: (items) => items.isEmpty
              ? const EmptyState(
                  icon: Icons.rate_review_outlined,
                  title: 'No reviews yet',
                  body:
                      'Reviews you submit to live businesses will appear here.',
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 10, 16, 30),
                  itemCount: items.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final review = items[index];
                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    review.businessName.isEmpty
                                        ? 'BNC business'
                                        : review.businessName,
                                    style: Theme.of(
                                      context,
                                    ).textTheme.titleMedium,
                                  ),
                                ),
                                StatusBadge(
                                  label: review.status.isEmpty
                                      ? 'Submitted'
                                      : review.status,
                                  color: review.status == 'PUBLISHED'
                                      ? BncColors.verified
                                      : BncColors.brand,
                                ),
                              ],
                            ),
                            const SizedBox(height: 7),
                            Text(
                              '${review.rating.toStringAsFixed(0)}/5 · ${review.date}',
                              style: const TextStyle(
                                color: BncColors.brand,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(review.body),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                Text('${review.helpful} helpful'),
                                const Spacer(),
                                TextButton(
                                  onPressed: () =>
                                      _editReview(context, ref, review),
                                  child: const Text('Edit'),
                                ),
                                TextButton(
                                  onPressed: () =>
                                      _deleteReview(context, ref, review),
                                  child: const Text('Delete'),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ),
    );
  }

  Future<void> _editReview(
    BuildContext context,
    WidgetRef ref,
    Review review,
  ) async {
    final body = TextEditingController(text: review.body);
    var rating = review.rating.round().clamp(1, 5);
    final saved = await showDialog<bool>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Edit review'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<int>(
                  initialValue: rating,
                  decoration: const InputDecoration(labelText: 'Rating'),
                  items: [
                    for (var value = 1; value <= 5; value++)
                      DropdownMenuItem(
                        value: value,
                        child: Text('$value stars'),
                      ),
                  ],
                  onChanged: (value) => setState(() => rating = value ?? 5),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: body,
                  minLines: 4,
                  maxLines: 8,
                  maxLength: 3000,
                  onChanged: (_) => setState(() {}),
                  decoration: const InputDecoration(
                    labelText: 'Review',
                    helperText: 'At least 20 characters',
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: body.text.trim().length < 20
                  ? null
                  : () async {
                      await ref.read(appRepositoryProvider).updateReview(
                        review.id,
                        {'overallRating': rating, 'body': body.text.trim()},
                      );
                      if (context.mounted) Navigator.pop(context, true);
                    },
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );
    body.dispose();
    if (saved == true) ref.invalidate(myReviewsProvider);
  }

  Future<void> _deleteReview(
    BuildContext context,
    WidgetRef ref,
    Review review,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete this review?'),
        content: const Text('This removes the review from your BNC account.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    await ref.read(appRepositoryProvider).deleteReview(review.id);
    ref.invalidate(myReviewsProvider);
  }
}

class BlockedBusinessesScreen extends ConsumerWidget {
  const BlockedBusinessesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final blocked = ref.watch(blockedBusinessesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Blocked businesses')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(blockedBusinessesProvider);
          await ref.read(blockedBusinessesProvider.future);
        },
        child: blocked.when(
          loading: () => ListView(
            padding: const EdgeInsets.all(18),
            children: const [BncSkeleton(height: 86)],
          ),
          error: (error, stack) => ListView(
            children: [
              ErrorState(
                error: error,
                onRetry: () => ref.invalidate(blockedBusinessesProvider),
              ),
            ],
          ),
          data: (items) => items.isEmpty
              ? ListView(
                  children: const [
                    EmptyState(
                      icon: Icons.block_outlined,
                      title: 'No blocked businesses',
                      body:
                          'Businesses blocked through your live account will appear here.',
                    ),
                  ],
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(18, 10, 18, 30),
                  itemCount: items.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 9),
                  itemBuilder: (context, index) {
                    final business = items[index];
                    return Card(
                      child: ListTile(
                        leading: const Icon(Icons.storefront_outlined),
                        title: Text(business.name),
                        subtitle: Text(
                          [
                            business.category,
                            business.locality,
                          ].where((value) => value.isNotEmpty).join(' · '),
                        ),
                        trailing: TextButton(
                          onPressed: () async {
                            await ref
                                .read(appRepositoryProvider)
                                .unblockBusiness(business.id);
                            ref.invalidate(blockedBusinessesProvider);
                          },
                          child: const Text('Unblock'),
                        ),
                      ),
                    );
                  },
                ),
        ),
      ),
    );
  }
}
