import 'package:bnc_mobile/core/data/app_repository.dart';
import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/design_system/components.dart';
import 'package:bnc_mobile/features/business_manager/presentation/business_dashboard_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final managedJobsProvider = FutureProvider.autoDispose
    .family<List<Json>, String>(
      (ref, businessId) =>
          ref.watch(appRepositoryProvider).managedJobs(businessId),
    );

final businessReferralsProvider = FutureProvider.autoDispose
    .family<List<Json>, String>(
      (ref, businessId) =>
          ref.watch(appRepositoryProvider).referrals(businessId),
    );

class BusinessJobsScreen extends ConsumerWidget {
  const BusinessJobsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final businessState = ref.watch(activeManagedBusinessProvider);
    final business = businessState.valueOrNull;
    return Scaffold(
      appBar: AppBar(title: const Text('Job vacancies')),
      floatingActionButton: business == null
          ? null
          : FloatingActionButton.extended(
              onPressed: () => _createJob(context, ref, business),
              icon: const Icon(Icons.add_rounded),
              label: const Text('Post a job'),
            ),
      body: businessState.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => ErrorState(error: error),
        data: (business) {
          if (business == null) {
            return const EmptyState(
              icon: Icons.business_outlined,
              title: 'Create a business first',
              body: 'Job vacancies must belong to a managed business.',
            );
          }
          final jobs = ref.watch(managedJobsProvider(business.id));
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(managedJobsProvider(business.id));
              await ref.read(managedJobsProvider(business.id).future);
            },
            child: jobs.when(
              loading: () => ListView(
                padding: const EdgeInsets.all(18),
                children: const [BncSkeleton(height: 180)],
              ),
              error: (error, stack) => ListView(
                children: [
                  ErrorState(
                    error: error,
                    onRetry: () =>
                        ref.invalidate(managedJobsProvider(business.id)),
                  ),
                ],
              ),
              data: (items) => items.isEmpty
                  ? ListView(
                      children: [
                        EmptyState(
                          icon: Icons.work_outline_rounded,
                          title: 'No vacancies yet',
                          body:
                              'Create a draft, review it, and publish it in the public Jobs directory.',
                          action: () => _createJob(context, ref, business),
                          actionLabel: 'Create first job',
                        ),
                      ],
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 10, 16, 100),
                      itemCount: items.length,
                      separatorBuilder: (_, index) =>
                          const SizedBox(height: 10),
                      itemBuilder: (context, index) => _BusinessJobCard(
                        job: items[index],
                        businessId: business.id,
                      ),
                    ),
            ),
          );
        },
      ),
    );
  }
}

class _BusinessJobCard extends ConsumerStatefulWidget {
  const _BusinessJobCard({required this.job, required this.businessId});

  final Json job;
  final String businessId;

  @override
  ConsumerState<_BusinessJobCard> createState() => _BusinessJobCardState();
}

class _BusinessJobCardState extends ConsumerState<_BusinessJobCard> {
  bool busy = false;

  Future<void> _changeStatus(String action) async {
    setState(() => busy = true);
    try {
      final repository = ref.read(appRepositoryProvider);
      if (action == 'publish') {
        await repository.publishJob(widget.job.string('id'));
      } else {
        await repository.closeJob(widget.job.string('id'));
      }
      ref.invalidate(managedJobsProvider(widget.businessId));
    } on Object catch (error) {
      if (mounted) _showError(context, error);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final status = widget.job.string('status', 'DRAFT');
    final count = _map(widget.job['_count']).integer('applications');
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(17),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Chip(label: Text(_humanize(status))),
                const Spacer(),
                Text('$count applicants'),
              ],
            ),
            Text(
              widget.job.string('title'),
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 5),
            Text(
              '${_humanize(widget.job.string('employmentType'))} · '
              '${widget.job.string('city')}',
            ),
            const SizedBox(height: 8),
            Text(
              widget.job.string('description'),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 14),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                OutlinedButton.icon(
                  onPressed: () => showModalBottomSheet<void>(
                    context: context,
                    isScrollControlled: true,
                    useSafeArea: true,
                    builder: (_) => _ApplicantsSheet(
                      jobId: widget.job.string('id'),
                      title: widget.job.string('title'),
                    ),
                  ),
                  icon: const Icon(Icons.groups_outlined),
                  label: const Text('Applicants'),
                ),
                if (status == 'DRAFT')
                  ElevatedButton.icon(
                    onPressed: busy ? null : () => _changeStatus('publish'),
                    icon: const Icon(Icons.publish_rounded),
                    label: const Text('Publish'),
                  ),
                if (status == 'PUBLISHED')
                  OutlinedButton.icon(
                    onPressed: busy ? null : () => _changeStatus('close'),
                    icon: const Icon(Icons.close_rounded),
                    label: const Text('Close'),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ApplicantsSheet extends ConsumerStatefulWidget {
  const _ApplicantsSheet({required this.jobId, required this.title});

  final String jobId;
  final String title;

  @override
  ConsumerState<_ApplicantsSheet> createState() => _ApplicantsSheetState();
}

class _ApplicantsSheetState extends ConsumerState<_ApplicantsSheet> {
  late Future<List<Json>> applicants;

  @override
  void initState() {
    super.initState();
    applicants = ref.read(appRepositoryProvider).jobApplicants(widget.jobId);
  }

  Future<void> _update(Json applicant, String status) async {
    try {
      await ref
          .read(appRepositoryProvider)
          .updateJobApplication(applicant.string('id'), status);
      setState(() {
        applicant['status'] = status;
      });
    } on Object catch (error) {
      if (mounted) _showError(context, error);
    }
  }

  @override
  Widget build(BuildContext context) => DraggableScrollableSheet(
    expand: false,
    initialChildSize: .82,
    maxChildSize: .96,
    builder: (context, controller) => Column(
      children: [
        ListTile(
          title: Text(widget.title),
          subtitle: const Text('Applicants'),
          trailing: IconButton(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.close_rounded),
          ),
        ),
        const Divider(height: 1),
        Expanded(
          child: FutureBuilder<List<Json>>(
            future: applicants,
            builder: (context, snapshot) {
              if (snapshot.connectionState != ConnectionState.done) {
                return const Center(child: CircularProgressIndicator());
              }
              if (snapshot.hasError) return ErrorState(error: snapshot.error!);
              final items = snapshot.data ?? const <Json>[];
              if (items.isEmpty) {
                return const EmptyState(
                  icon: Icons.groups_outlined,
                  title: 'No applications yet',
                  body: 'New applications will appear here.',
                );
              }
              return ListView.separated(
                controller: controller,
                padding: const EdgeInsets.all(16),
                itemCount: items.length,
                separatorBuilder: (_, index) => const SizedBox(height: 9),
                itemBuilder: (context, index) {
                  final applicant = items[index];
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(15),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            applicant.string('name', 'Applicant'),
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          Text(applicant.string('email')),
                          if (applicant.string('phone').isNotEmpty)
                            Text(applicant.string('phone')),
                          if (applicant.string('coverNote').isNotEmpty) ...[
                            const SizedBox(height: 8),
                            Text(applicant.string('coverNote')),
                          ],
                          const SizedBox(height: 10),
                          DropdownButtonFormField<String>(
                            initialValue: applicant.string('status', 'APPLIED'),
                            items: const [
                              DropdownMenuItem(
                                value: 'APPLIED',
                                child: Text('Applied'),
                              ),
                              DropdownMenuItem(
                                value: 'SHORTLISTED',
                                child: Text('Shortlisted'),
                              ),
                              DropdownMenuItem(
                                value: 'REJECTED',
                                child: Text('Rejected'),
                              ),
                              DropdownMenuItem(
                                value: 'HIRED',
                                child: Text('Hired'),
                              ),
                            ],
                            onChanged: (value) {
                              if (value != null) _update(applicant, value);
                            },
                          ),
                        ],
                      ),
                    ),
                  );
                },
              );
            },
          ),
        ),
      ],
    ),
  );
}

class BusinessReferralsScreen extends ConsumerWidget {
  const BusinessReferralsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final businessState = ref.watch(activeManagedBusinessProvider);
    final business = businessState.valueOrNull;
    return Scaffold(
      appBar: AppBar(title: const Text('Referrals')),
      floatingActionButton: business == null
          ? null
          : FloatingActionButton.extended(
              onPressed: () => _createReferral(context, ref, business),
              icon: const Icon(Icons.add_rounded),
              label: const Text('Add referral'),
            ),
      body: businessState.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => ErrorState(error: error),
        data: (business) {
          if (business == null) {
            return const EmptyState(
              icon: Icons.handshake_outlined,
              title: 'Create a business first',
              body: 'Referrals belong to a managed business.',
            );
          }
          final referrals = ref.watch(businessReferralsProvider(business.id));
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(businessReferralsProvider(business.id));
              await ref.read(businessReferralsProvider(business.id).future);
            },
            child: referrals.when(
              loading: () => ListView(
                padding: const EdgeInsets.all(18),
                children: const [BncSkeleton(height: 180)],
              ),
              error: (error, stack) => ListView(
                children: [
                  ErrorState(
                    error: error,
                    onRetry: () =>
                        ref.invalidate(businessReferralsProvider(business.id)),
                  ),
                ],
              ),
              data: (items) => items.isEmpty
                  ? ListView(
                      children: [
                        EmptyState(
                          icon: Icons.handshake_outlined,
                          title: 'No referrals recorded',
                          body:
                              'Add introductions and track them through conversion.',
                          action: () => _createReferral(context, ref, business),
                          actionLabel: 'Add first referral',
                        ),
                      ],
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 10, 16, 100),
                      itemCount: items.length,
                      separatorBuilder: (_, index) => const SizedBox(height: 9),
                      itemBuilder: (context, index) => _ReferralCard(
                        referral: items[index],
                        businessId: business.id,
                      ),
                    ),
            ),
          );
        },
      ),
    );
  }
}

class _ReferralCard extends ConsumerWidget {
  const _ReferralCard({required this.referral, required this.businessId});

  final Json referral;
  final String businessId;

  @override
  Widget build(BuildContext context, WidgetRef ref) => Card(
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            referral.string('contactName'),
            style: Theme.of(context).textTheme.titleLarge,
          ),
          if (referral.string('referredBusiness').isNotEmpty)
            Text(referral.string('referredBusiness')),
          if (referral.string('phone').isNotEmpty)
            Text(referral.string('phone')),
          if (referral.string('email').isNotEmpty)
            Text(referral.string('email')),
          if (referral.string('notes').isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(referral.string('notes')),
          ],
          if (referral['estimatedValue'] != null) ...[
            const SizedBox(height: 8),
            Text(
              'Estimated value: ₹${referral.decimal('estimatedValue').toStringAsFixed(0)}',
            ),
          ],
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: referral.string('status', 'NEW'),
            items: const [
              DropdownMenuItem(value: 'NEW', child: Text('New')),
              DropdownMenuItem(value: 'CONTACTED', child: Text('Contacted')),
              DropdownMenuItem(value: 'CONVERTED', child: Text('Converted')),
              DropdownMenuItem(value: 'CLOSED', child: Text('Closed')),
            ],
            onChanged: (status) async {
              if (status == null) return;
              try {
                await ref
                    .read(appRepositoryProvider)
                    .updateReferral(referral.string('id'), status);
                ref.invalidate(businessReferralsProvider(businessId));
              } on Object catch (error) {
                if (context.mounted) _showError(context, error);
              }
            },
          ),
        ],
      ),
    ),
  );
}

Future<void> _createJob(
  BuildContext context,
  WidgetRef ref,
  Business business,
) async {
  final key = GlobalKey<FormState>();
  final title = TextEditingController();
  final description = TextEditingController();
  final skills = TextEditingController();
  final salaryMin = TextEditingController();
  final salaryMax = TextEditingController();
  final city = TextEditingController(text: business.city);
  final district = TextEditingController();
  final contactEmail = TextEditingController();
  final closesAt = TextEditingController();
  var employmentType = 'FULL_TIME';
  var workplaceType = 'ON_SITE';
  var busy = false;
  final created = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (sheetContext) => StatefulBuilder(
      builder: (context, setState) => Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          14,
          20,
          MediaQuery.viewInsetsOf(context).bottom + 20,
        ),
        child: SingleChildScrollView(
          child: Form(
            key: key,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Create a job draft',
                        style: Theme.of(context).textTheme.headlineSmall,
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(sheetContext, false),
                      icon: const Icon(Icons.close_rounded),
                    ),
                  ],
                ),
                _requiredField(title, 'Job title', minimum: 3),
                _requiredField(
                  description,
                  'Description',
                  minimum: 30,
                  maxLines: 6,
                ),
                DropdownButtonFormField<String>(
                  initialValue: employmentType,
                  decoration: const InputDecoration(
                    labelText: 'Employment type',
                  ),
                  items: const [
                    DropdownMenuItem(
                      value: 'FULL_TIME',
                      child: Text('Full time'),
                    ),
                    DropdownMenuItem(
                      value: 'PART_TIME',
                      child: Text('Part time'),
                    ),
                    DropdownMenuItem(
                      value: 'CONTRACT',
                      child: Text('Contract'),
                    ),
                    DropdownMenuItem(
                      value: 'INTERNSHIP',
                      child: Text('Internship'),
                    ),
                    DropdownMenuItem(
                      value: 'TEMPORARY',
                      child: Text('Temporary'),
                    ),
                  ],
                  onChanged: (value) =>
                      employmentType = value ?? employmentType,
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: workplaceType,
                  decoration: const InputDecoration(
                    labelText: 'Workplace type',
                  ),
                  items: const [
                    DropdownMenuItem(value: 'ON_SITE', child: Text('On site')),
                    DropdownMenuItem(value: 'HYBRID', child: Text('Hybrid')),
                    DropdownMenuItem(value: 'REMOTE', child: Text('Remote')),
                  ],
                  onChanged: (value) => workplaceType = value ?? workplaceType,
                ),
                _requiredField(skills, 'Skills (comma separated)', minimum: 2),
                _numberField(salaryMin, 'Minimum salary'),
                _numberField(salaryMax, 'Maximum salary'),
                _requiredField(city, 'City'),
                _requiredField(district, 'District'),
                TextFormField(
                  controller: contactEmail,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    labelText: 'Application email (optional)',
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: closesAt,
                  readOnly: true,
                  decoration: const InputDecoration(
                    labelText: 'Closing date (optional)',
                    suffixIcon: Icon(Icons.calendar_month_outlined),
                  ),
                  onTap: () async {
                    final date = await showDatePicker(
                      context: context,
                      firstDate: DateTime.now().add(const Duration(days: 1)),
                      lastDate: DateTime.now().add(const Duration(days: 730)),
                    );
                    if (date != null) closesAt.text = date.toIso8601String();
                  },
                ),
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: busy
                        ? null
                        : () async {
                            if (!(key.currentState?.validate() ?? false)) {
                              return;
                            }
                            final minimum = double.tryParse(salaryMin.text);
                            final maximum = double.tryParse(salaryMax.text);
                            if (minimum != null &&
                                maximum != null &&
                                maximum < minimum) {
                              _showError(
                                context,
                                'Maximum salary cannot be below minimum salary.',
                              );
                              return;
                            }
                            setState(() => busy = true);
                            try {
                              await ref.read(appRepositoryProvider).createJob({
                                'businessId': business.id,
                                'title': title.text.trim(),
                                'slug':
                                    '${_slug(title.text)}-${DateTime.now().millisecondsSinceEpoch.toRadixString(36)}',
                                'description': description.text.trim(),
                                'employmentType': employmentType,
                                'workplaceType': workplaceType,
                                'skills': skills.text
                                    .split(',')
                                    .map((value) => value.trim())
                                    .where((value) => value.isNotEmpty)
                                    .toList(),
                                if (minimum != null) 'salaryMin': minimum,
                                if (maximum != null) 'salaryMax': maximum,
                                'city': city.text.trim(),
                                'district': district.text.trim(),
                                'state': 'Kerala',
                                if (contactEmail.text.trim().isNotEmpty)
                                  'contactEmail': contactEmail.text.trim(),
                                if (closesAt.text.isNotEmpty)
                                  'closesAt': DateTime.parse(
                                    closesAt.text,
                                  ).toUtc().toIso8601String(),
                              });
                              if (sheetContext.mounted) {
                                Navigator.pop(sheetContext, true);
                              }
                            } on Object catch (error) {
                              setState(() => busy = false);
                              if (context.mounted) _showError(context, error);
                            }
                          },
                    icon: const Icon(Icons.save_outlined),
                    label: Text(busy ? 'Saving…' : 'Save draft'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );
  for (final controller in [
    title,
    description,
    skills,
    salaryMin,
    salaryMax,
    city,
    district,
    contactEmail,
    closesAt,
  ]) {
    controller.dispose();
  }
  if (created == true) ref.invalidate(managedJobsProvider(business.id));
}

Future<void> _createReferral(
  BuildContext context,
  WidgetRef ref,
  Business business,
) async {
  final key = GlobalKey<FormState>();
  final contactName = TextEditingController();
  final organisation = TextEditingController();
  final phone = TextEditingController();
  final email = TextEditingController();
  final value = TextEditingController();
  final notes = TextEditingController();
  var busy = false;
  final created = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (sheetContext) => StatefulBuilder(
      builder: (context, setState) => Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          14,
          20,
          MediaQuery.viewInsetsOf(context).bottom + 20,
        ),
        child: SingleChildScrollView(
          child: Form(
            key: key,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Add a referral',
                        style: Theme.of(context).textTheme.headlineSmall,
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(sheetContext, false),
                      icon: const Icon(Icons.close_rounded),
                    ),
                  ],
                ),
                _requiredField(contactName, 'Contact name'),
                TextFormField(
                  controller: organisation,
                  decoration: const InputDecoration(
                    labelText: 'Business or organisation',
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: phone,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(labelText: 'Phone'),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: email,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(labelText: 'Email'),
                ),
                _numberField(value, 'Estimated value'),
                TextFormField(
                  controller: notes,
                  minLines: 3,
                  maxLines: 6,
                  maxLength: 3000,
                  decoration: const InputDecoration(labelText: 'Notes'),
                ),
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: busy
                        ? null
                        : () async {
                            if (!(key.currentState?.validate() ?? false)) {
                              return;
                            }
                            setState(() => busy = true);
                            try {
                              await ref
                                  .read(appRepositoryProvider)
                                  .createReferral({
                                    'businessId': business.id,
                                    'contactName': contactName.text.trim(),
                                    if (organisation.text.trim().isNotEmpty)
                                      'referredBusiness': organisation.text
                                          .trim(),
                                    if (phone.text.trim().isNotEmpty)
                                      'phone': phone.text.trim(),
                                    if (email.text.trim().isNotEmpty)
                                      'email': email.text.trim(),
                                    if (double.tryParse(value.text) != null)
                                      'estimatedValue': double.parse(
                                        value.text,
                                      ),
                                    if (notes.text.trim().isNotEmpty)
                                      'notes': notes.text.trim(),
                                  });
                              if (sheetContext.mounted) {
                                Navigator.pop(sheetContext, true);
                              }
                            } on Object catch (error) {
                              setState(() => busy = false);
                              if (context.mounted) _showError(context, error);
                            }
                          },
                    icon: const Icon(Icons.handshake_outlined),
                    label: Text(busy ? 'Saving…' : 'Save referral'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );
  for (final controller in [
    contactName,
    organisation,
    phone,
    email,
    value,
    notes,
  ]) {
    controller.dispose();
  }
  if (created == true) {
    ref.invalidate(businessReferralsProvider(business.id));
  }
}

TextFormField _requiredField(
  TextEditingController controller,
  String label, {
  int minimum = 2,
  int maxLines = 1,
}) => TextFormField(
  controller: controller,
  minLines: maxLines > 1 ? 3 : 1,
  maxLines: maxLines,
  decoration: InputDecoration(labelText: label),
  validator: (value) => (value?.trim().length ?? 0) < minimum
      ? 'Enter at least $minimum characters.'
      : null,
);

TextFormField _numberField(TextEditingController controller, String label) =>
    TextFormField(
      controller: controller,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      decoration: InputDecoration(labelText: '$label (optional)'),
      validator: (value) {
        if (value == null || value.trim().isEmpty) return null;
        final number = double.tryParse(value);
        return number == null || number < 0 ? 'Enter a valid amount.' : null;
      },
    );

Json _map(Object? value) => value is Map
    ? value.map((key, item) => MapEntry('$key', item))
    : <String, dynamic>{};

String _humanize(String value) => value
    .toLowerCase()
    .split('_')
    .where((part) => part.isNotEmpty)
    .map((part) => '${part[0].toUpperCase()}${part.substring(1)}')
    .join(' ');

String _slug(String value) => value
    .toLowerCase()
    .trim()
    .replaceAll(RegExp('[^a-z0-9]+'), '-')
    .replaceAll(RegExp(r'^-|-$'), '');

void _showError(BuildContext context, Object error) {
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$error')));
}
