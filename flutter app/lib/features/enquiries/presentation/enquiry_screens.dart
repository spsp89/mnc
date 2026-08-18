import 'package:bnc_mobile/core/data/app_repository.dart';
import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/core/state/app_state.dart';
import 'package:bnc_mobile/core/storage/app_preferences.dart';
import 'package:bnc_mobile/design_system/bnc_theme.dart';
import 'package:bnc_mobile/design_system/components.dart';
import 'package:bnc_mobile/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class EnquirySuccessData {
  const EnquirySuccessData({
    required this.enquiry,
    required this.directBusiness,
  });

  final Enquiry enquiry;
  final bool directBusiness;
}

class EnquiryScreen extends ConsumerStatefulWidget {
  const EnquiryScreen({super.key, this.business, this.product, this.service});

  final Business? business;
  final Product? product;
  final Service? service;

  @override
  ConsumerState<EnquiryScreen> createState() => _EnquiryScreenState();
}

class _EnquiryScreenState extends ConsumerState<EnquiryScreen> {
  final _formKey = GlobalKey<FormState>();
  final _requirementController = TextEditingController();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _localityController = TextEditingController();
  int _step = 0;
  String? _categoryId;
  String _contactPreference = 'in_app';
  String _urgency = 'this_week';
  DateTime? _preferredDate;
  bool _consent = false;
  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final session = ref.read(sessionProvider).user;
    _nameController.text = session?.displayName ?? '';
    _phoneController.text = session?.phone.replaceFirst('+91', '') ?? '';
    _localityController.text = ref.read(appSettingsProvider).city;
    _requirementController.text = switch ((widget.product, widget.service)) {
      (final Product product, _) =>
        'I’m interested in ${product.name}. Please share current availability and fulfilment details.',
      (_, final Service service) =>
        'I need ${service.name}. Please share availability and an estimate.',
      _ => '',
    };
  }

  @override
  void dispose() {
    _requirementController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    _localityController.dispose();
    super.dispose();
  }

  Future<void> _next() async {
    if (_step == 0 && _categoryId == null) {
      setState(() => _error = 'Choose the closest category.');
      return;
    }
    if (_step == 1 &&
        (_requirementController.text.trim().length < 4 ||
            _localityController.text.trim().length < 2)) {
      setState(() => _error = 'Describe your need and enter a locality.');
      return;
    }
    setState(() {
      _error = null;
      _step++;
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (!_consent) {
      setState(() => _error = 'Please confirm consent before submitting.');
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final phoneDigits = _phoneController.text.replaceAll(RegExp(r'\D'), '');
      final settings = ref.read(appSettingsProvider);
      final enquiry = await ref.read(appRepositoryProvider).createEnquiry({
        'categoryId': _categoryId,
        if (widget.business != null) 'businessId': widget.business!.id,
        'requirement': _requirementController.text.trim(),
        'locality': _localityController.text.trim(),
        if (settings.apiLatitude != null) 'latitude': settings.apiLatitude,
        if (settings.apiLongitude != null) 'longitude': settings.apiLongitude,
        if (_preferredDate != null)
          'preferredDate': _preferredDate!.toIso8601String(),
        'urgency': _urgency,
        'customerName': _nameController.text.trim(),
        'phone': phoneDigits.length == 10 ? '+91$phoneDigits' : '+$phoneDigits',
        'contactPreference': _contactPreference,
        'consent': true,
        if (widget.product != null)
          'items': [
            {'productId': widget.product!.id},
          ],
        if (widget.service != null)
          'items': [
            {'serviceId': widget.service!.id},
          ],
      });
      await ref
          .read(appRepositoryProvider)
          .track(
            'ENQUIRY_SUBMITTED',
            businessId: widget.business?.id,
            source: widget.business == null
                ? 'open_enquiry'
                : 'business_profile',
          );
      if (mounted) {
        context.pushReplacement(
          '/enquiry/success',
          extra: EnquirySuccessData(
            enquiry: enquiry,
            directBusiness: widget.business != null,
          ),
        );
      }
    } on Object catch (error) {
      setState(() => _error = '$error');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppLocalizations.of(context);
    final categories = ref.watch(categoriesProvider).valueOrNull ?? const [];
    if (_categoryId == null && categories.isNotEmpty) {
      final category = categories.where(
        (item) => item.slug == widget.business?.categorySlug,
      );
      _categoryId = category.isEmpty ? categories.first.id : category.first.id;
    }
    return Scaffold(
      appBar: AppBar(
        title: const Text('Get the right match'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(5),
          child: LinearProgressIndicator(
            value: (_step + 1) / 3,
            minHeight: 5,
            backgroundColor: BncColors.border,
          ),
        ),
      ),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              Expanded(
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 260),
                  child: SingleChildScrollView(
                    key: ValueKey(_step),
                    padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
                    child: switch (_step) {
                      0 => _CategoryStep(
                        categories: categories,
                        selected: _categoryId,
                        business: widget.business,
                        onSelected: (value) =>
                            setState(() => _categoryId = value),
                      ),
                      1 => _RequirementStep(
                        requirementController: _requirementController,
                        localityController: _localityController,
                        urgency: _urgency,
                        preferredDate: _preferredDate,
                        onUrgencyChanged: (value) =>
                            setState(() => _urgency = value),
                        onPickDate: () async {
                          final date = await showDatePicker(
                            context: context,
                            firstDate: DateTime.now(),
                            lastDate: DateTime.now().add(
                              const Duration(days: 180),
                            ),
                          );
                          if (date != null) {
                            setState(() => _preferredDate = date);
                          }
                        },
                      ),
                      _ => _ContactStep(
                        nameController: _nameController,
                        phoneController: _phoneController,
                        contactPreference: _contactPreference,
                        consent: _consent,
                        onPreferenceChanged: (value) =>
                            setState(() => _contactPreference = value),
                        onConsentChanged: (value) =>
                            setState(() => _consent = value),
                      ),
                    },
                  ),
                ),
              ),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Semantics(
                    liveRegion: true,
                    child: Text(
                      _error!,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.error,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 18),
                child: Row(
                  children: [
                    if (_step > 0) ...[
                      OutlinedButton(
                        onPressed: _submitting
                            ? null
                            : () => setState(() {
                                _step--;
                                _error = null;
                              }),
                        child: const Text('Back'),
                      ),
                      const SizedBox(width: 10),
                    ],
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _submitting
                            ? null
                            : (_step < 2 ? _next : _submit),
                        child: _submitting
                            ? const SizedBox.square(
                                dimension: 20,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                            : Text(
                                _step < 2
                                    ? strings.continueLabel
                                    : strings.submitEnquiry,
                              ),
                      ),
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

class _CategoryStep extends StatelessWidget {
  const _CategoryStep({
    required this.categories,
    required this.selected,
    required this.business,
    required this.onSelected,
  });

  final List<Category> categories;
  final String? selected;
  final Business? business;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'What can we help with?',
          style: Theme.of(context).textTheme.headlineLarge,
        ),
        const SizedBox(height: 8),
        Text(
          business == null
              ? 'Choose the closest category so BNC can find relevant businesses.'
              : 'Your request will go to ${business!.name}.',
          style: Theme.of(
            context,
          ).textTheme.bodyLarge?.copyWith(color: BncColors.muted),
        ),
        const SizedBox(height: 24),
        RadioGroup<String>(
          groupValue: selected,
          onChanged: (value) {
            if (value != null) onSelected(value);
          },
          child: Column(
            children: categories
                .map(
                  (category) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Card(
                      color: selected == category.id
                          ? BncColors.brand.withValues(alpha: .07)
                          : null,
                      child: RadioListTile<String>(
                        value: category.id,
                        title: Text(category.name),
                        subtitle: Text(category.description),
                      ),
                    ),
                  ),
                )
                .toList(),
          ),
        ),
      ],
    );
  }
}

class _RequirementStep extends StatelessWidget {
  const _RequirementStep({
    required this.requirementController,
    required this.localityController,
    required this.urgency,
    required this.preferredDate,
    required this.onUrgencyChanged,
    required this.onPickDate,
  });

  final TextEditingController requirementController;
  final TextEditingController localityController;
  final String urgency;
  final DateTime? preferredDate;
  final ValueChanged<String> onUrgencyChanged;
  final VoidCallback onPickDate;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Describe the need',
          style: Theme.of(context).textTheme.headlineLarge,
        ),
        const SizedBox(height: 8),
        Text(
          'Clear details help good businesses respond with useful estimates.',
          style: Theme.of(
            context,
          ).textTheme.bodyLarge?.copyWith(color: BncColors.muted),
        ),
        const SizedBox(height: 24),
        TextFormField(
          controller: requirementController,
          minLines: 5,
          maxLines: 8,
          maxLength: 1000,
          decoration: const InputDecoration(
            labelText: 'What do you need?',
            alignLabelWithHint: true,
            hintText:
                'Include the service, problem, size or any helpful preferences…',
          ),
        ),
        const SizedBox(height: 14),
        TextFormField(
          controller: localityController,
          textCapitalization: TextCapitalization.words,
          decoration: const InputDecoration(
            labelText: 'Locality',
            prefixIcon: Icon(Icons.location_on_outlined),
          ),
        ),
        const SizedBox(height: 20),
        Text(
          'When do you need it?',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 7,
          children: [
            ChoiceChip(
              label: const Text('As soon as possible'),
              selected: urgency == 'urgent',
              onSelected: (_) => onUrgencyChanged('urgent'),
            ),
            ChoiceChip(
              label: const Text('This week'),
              selected: urgency == 'this_week',
              onSelected: (_) => onUrgencyChanged('this_week'),
            ),
            ChoiceChip(
              label: const Text('Flexible'),
              selected: urgency == 'flexible',
              onSelected: (_) => onUrgencyChanged('flexible'),
            ),
          ],
        ),
        const SizedBox(height: 14),
        OutlinedButton.icon(
          onPressed: onPickDate,
          icon: const Icon(Icons.calendar_today_outlined),
          label: Text(
            preferredDate == null
                ? 'Choose an optional date'
                : '${preferredDate!.day}/${preferredDate!.month}/${preferredDate!.year}',
          ),
        ),
      ],
    );
  }
}

class _ContactStep extends StatelessWidget {
  const _ContactStep({
    required this.nameController,
    required this.phoneController,
    required this.contactPreference,
    required this.consent,
    required this.onPreferenceChanged,
    required this.onConsentChanged,
  });

  final TextEditingController nameController;
  final TextEditingController phoneController;
  final String contactPreference;
  final bool consent;
  final ValueChanged<String> onPreferenceChanged;
  final ValueChanged<bool> onConsentChanged;

  @override
  Widget build(BuildContext context) {
    final strings = AppLocalizations.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'How should businesses respond?',
          style: Theme.of(context).textTheme.headlineLarge,
        ),
        const SizedBox(height: 8),
        Text(
          'You choose how relevant businesses can contact you.',
          style: Theme.of(
            context,
          ).textTheme.bodyLarge?.copyWith(color: BncColors.muted),
        ),
        const SizedBox(height: 24),
        TextFormField(
          controller: nameController,
          textCapitalization: TextCapitalization.words,
          autofillHints: const [AutofillHints.name],
          maxLength: 100,
          decoration: const InputDecoration(
            labelText: 'Your name',
            prefixIcon: Icon(Icons.person_outline_rounded),
            counterText: '',
          ),
          validator: (value) {
            final length = value?.trim().length ?? 0;
            if (length < 2) return 'Enter your name';
            if (length > 100) return 'Use no more than 100 characters';
            return null;
          },
        ),
        const SizedBox(height: 13),
        TextFormField(
          controller: phoneController,
          keyboardType: TextInputType.phone,
          autofillHints: const [AutofillHints.telephoneNumber],
          inputFormatters: [
            FilteringTextInputFormatter.allow(RegExp(r'[\d +()-]')),
            LengthLimitingTextInputFormatter(16),
          ],
          decoration: const InputDecoration(
            labelText: 'Mobile number',
            prefixIcon: Icon(Icons.phone_outlined),
          ),
          validator: (value) {
            final length = value?.replaceAll(RegExp(r'\D'), '').length ?? 0;
            if (length < 10) return 'Enter a valid mobile number';
            if (length > 15) return 'Use a valid number up to 15 digits';
            return null;
          },
        ),
        const SizedBox(height: 20),
        Text(
          'Contact preference',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 8),
        SegmentedButton<String>(
          segments: const [
            ButtonSegment(
              value: 'in_app',
              icon: Icon(Icons.forum_outlined),
              label: Text('BNC chat'),
            ),
            ButtonSegment(
              value: 'call',
              icon: Icon(Icons.phone_outlined),
              label: Text('Call'),
            ),
          ],
          selected: {contactPreference},
          onSelectionChanged: (values) => onPreferenceChanged(values.first),
        ),
        const SizedBox(height: 22),
        Card(
          color: BncColors.sky,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(9, 8, 12, 8),
            child: CheckboxListTile(
              value: consent,
              onChanged: (value) => onConsentChanged(value ?? false),
              controlAffinity: ListTileControlAffinity.leading,
              title: Text(
                strings.consentTitle,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  color: BncColors.deepBlue,
                  fontWeight: FontWeight.w800,
                ),
              ),
              subtitle: Text(strings.consentBody),
            ),
          ),
        ),
      ],
    );
  }
}

class EnquirySuccessScreen extends ConsumerStatefulWidget {
  const EnquirySuccessScreen({
    required this.enquiry,
    required this.directBusiness,
    super.key,
  });

  final Enquiry enquiry;
  final bool directBusiness;

  @override
  ConsumerState<EnquirySuccessScreen> createState() =>
      _EnquirySuccessScreenState();
}

class _EnquirySuccessScreenState extends ConsumerState<EnquirySuccessScreen> {
  bool _startingChat = false;
  String? _chatError;

  Future<void> _startChat() async {
    setState(() {
      _startingChat = true;
      _chatError = null;
    });
    try {
      final id = await ref
          .read(appRepositoryProvider)
          .startEnquiryConversation(widget.enquiry.id);
      if (!mounted) return;
      context.go('/messages/$id');
    } on Object catch (error) {
      if (mounted) setState(() => _chatError = '$error');
    } finally {
      if (mounted) setState(() => _startingChat = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authenticated = ref.watch(sessionProvider).authenticated;
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 92,
                height: 92,
                decoration: BoxDecoration(
                  color: BncColors.verified.withValues(alpha: .1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check_circle_rounded,
                  color: BncColors.verified,
                  size: 52,
                ),
              ),
              const SizedBox(height: 28),
              Text(
                'Your enquiry is on its way',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineLarge,
              ),
              const SizedBox(height: 10),
              Text(
                'BNC is finding relevant businesses around ${widget.enquiry.locality}. You’ll be notified when they respond.',
                textAlign: TextAlign.center,
                style: Theme.of(
                  context,
                ).textTheme.bodyLarge?.copyWith(color: BncColors.muted),
              ),
              const SizedBox(height: 26),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(17),
                  child: Column(
                    children: [
                      _SuccessRow(
                        icon: Icons.lock_outline_rounded,
                        text: 'Contact details remain consent controlled',
                      ),
                      _SuccessRow(
                        icon: Icons.notifications_none_rounded,
                        text: 'Useful updates only—no public posting',
                      ),
                      _SuccessRow(
                        icon: Icons.compare_arrows_rounded,
                        text: 'Compare every match before choosing',
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              if (authenticated && widget.directBusiness) ...[
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _startingChat ? null : _startChat,
                    icon: _startingChat
                        ? const SizedBox.square(
                            dimension: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.forum_outlined),
                    label: Text(
                      _startingChat
                          ? 'Opening secure chat…'
                          : 'Start secure BNC chat',
                    ),
                  ),
                ),
                if (_chatError != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    _chatError!,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                ],
                const SizedBox(height: 8),
              ],
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: authenticated
                      ? () => context.go('/account/enquiries')
                      : () => context.go('/home'),
                  child: Text(
                    authenticated ? 'Track this enquiry' : 'Continue exploring',
                  ),
                ),
              ),
              if (!authenticated) ...[
                const SizedBox(height: 8),
                const Text(
                  'Sign in before a future enquiry to keep its replies and chat in your BNC account.',
                  textAlign: TextAlign.center,
                ),
              ],
              TextButton(
                onPressed: () => context.go('/home'),
                child: const Text('Back to home'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SuccessRow extends StatelessWidget {
  const _SuccessRow({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(
        children: [
          Icon(icon, color: BncColors.brand, size: 20),
          const SizedBox(width: 11),
          Expanded(child: Text(text)),
        ],
      ),
    );
  }
}

final myEnquiriesProvider = FutureProvider<List<Enquiry>>(
  (ref) => ref.watch(appRepositoryProvider).enquiries(),
);

class EnquiryDetailScreen extends ConsumerWidget {
  const EnquiryDetailScreen({required this.id, super.key});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(myEnquiriesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Enquiry details')),
      body: state.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => ErrorState(error: error),
        data: (items) {
          Enquiry? enquiry;
          for (final item in items) {
            if (item.id == id) {
              enquiry = item;
              break;
            }
          }
          if (enquiry == null) {
            return EmptyState(
              icon: Icons.search_off_rounded,
              title: 'Enquiry not found',
              body: 'No authorised enquiry matched this link for your account.',
              action: () => context.go('/account/enquiries'),
              actionLabel: 'View my enquiries',
            );
          }
          return _EnquiryDetailContent(enquiry: enquiry);
        },
      ),
    );
  }
}

class MyEnquiriesScreen extends ConsumerWidget {
  const MyEnquiriesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(myEnquiriesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('My enquiries')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/enquiry'),
        icon: const Icon(Icons.add_rounded),
        label: const Text('New enquiry'),
      ),
      body: state.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => ErrorState(error: error),
        data: (items) => items.isEmpty
            ? EmptyState(
                icon: Icons.request_quote_outlined,
                title: 'No enquiries yet',
                body:
                    'Describe what you need and BNC will find relevant local businesses.',
                action: () => context.push('/enquiry'),
                actionLabel: 'Get matched',
              )
            : ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                itemCount: items.length,
                separatorBuilder: (_, index) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final enquiry = items[index];
                  return Card(
                    child: InkWell(
                      onTap: () =>
                          context.push('/account/enquiries/${enquiry.id}'),
                      borderRadius: BorderRadius.circular(22),
                      child: Padding(
                        padding: const EdgeInsets.all(17),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                StatusBadge(
                                  label: enquiry.status,
                                  color: enquiry.status == 'RESPONDED'
                                      ? BncColors.verified
                                      : BncColors.brand,
                                ),
                                const Spacer(),
                                Text(
                                  enquiry.createdAt,
                                  style: Theme.of(context).textTheme.bodySmall
                                      ?.copyWith(color: BncColors.muted),
                                ),
                              ],
                            ),
                            const SizedBox(height: 13),
                            Text(
                              enquiry.requirement,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                const Icon(
                                  Icons.location_on_outlined,
                                  size: 17,
                                  color: BncColors.muted,
                                ),
                                const SizedBox(width: 4),
                                Text(enquiry.locality),
                                const Spacer(),
                                if (enquiry.matches > 0)
                                  Text(
                                    '${enquiry.matches} matches',
                                    style: const TextStyle(
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

class _EnquiryDetailContent extends ConsumerStatefulWidget {
  const _EnquiryDetailContent({required this.enquiry});

  final Enquiry enquiry;

  @override
  ConsumerState<_EnquiryDetailContent> createState() =>
      _EnquiryDetailContentState();
}

class _EnquiryDetailContentState extends ConsumerState<_EnquiryDetailContent> {
  bool busy = false;

  Future<void> _close() async {
    setState(() => busy = true);
    try {
      await ref.read(appRepositoryProvider).closeEnquiry(widget.enquiry.id);
      ref.invalidate(myEnquiriesProvider);
      if (!mounted) return;
      context.go('/account/enquiries');
    } on Object catch (error) {
      if (!mounted) return;
      setState(() => busy = false);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('$error')));
    }
  }

  Future<void> _openResponses() async {
    if (widget.enquiry.businessId.isEmpty) {
      context.go('/messages');
      return;
    }
    setState(() => busy = true);
    try {
      final conversationId = await ref
          .read(appRepositoryProvider)
          .startEnquiryConversation(widget.enquiry.id);
      if (!mounted) return;
      context.go('/messages/$conversationId');
    } on Object catch (error) {
      if (!mounted) return;
      setState(() => busy = false);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('$error')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final enquiry = widget.enquiry;
    final content = Column(
      mainAxisSize: MainAxisSize.max,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        StatusBadge(label: enquiry.status, color: BncColors.brand),
        const SizedBox(height: 14),
        Text(
          enquiry.requirement,
          style: Theme.of(context).textTheme.headlineMedium,
        ),
        const SizedBox(height: 8),
        Text('${enquiry.locality} · ${enquiry.createdAt}'),
        const SizedBox(height: 20),
        Card(
          color: BncColors.sky,
          child: const Padding(
            padding: EdgeInsets.all(16),
            child: Text(
              'Matches see an approximate need and location first. Contact information is released only after acceptance and consent checks.',
            ),
          ),
        ),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: busy ? null : _openResponses,
            child: Text(
              enquiry.businessId.isEmpty
                  ? 'View responses'
                  : 'Start or open BNC chat',
            ),
          ),
        ),
        if (!['CLOSED', 'CANCELLED'].contains(enquiry.status)) ...[
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: busy ? null : _close,
              child: const Text('Close enquiry'),
            ),
          ),
        ],
      ],
    );
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 32),
      children: [content],
    );
  }
}
