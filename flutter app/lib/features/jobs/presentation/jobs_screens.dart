import 'package:bnc_mobile/core/data/app_repository.dart';
import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/core/state/app_state.dart';
import 'package:bnc_mobile/design_system/bnc_theme.dart';
import 'package:bnc_mobile/design_system/components.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

final liveJobsProvider = FutureProvider<List<Json>>(
  (ref) => ref.watch(appRepositoryProvider).jobs(),
);

final liveJobProvider = FutureProvider.family<Json, String>(
  (ref, id) => ref.watch(appRepositoryProvider).job(id),
);

final myJobApplicationsProvider = FutureProvider<List<Json>>(
  (ref) => ref.watch(appRepositoryProvider).jobApplications(),
);

class JobsScreen extends ConsumerStatefulWidget {
  const JobsScreen({super.key});

  @override
  ConsumerState<JobsScreen> createState() => _JobsScreenState();
}

class _JobsScreenState extends ConsumerState<JobsScreen> {
  final _query = TextEditingController();
  String _employmentType = 'ALL';

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final jobs = ref.watch(liveJobsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Local jobs')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(liveJobsProvider);
          await ref.read(liveJobsProvider.future);
        },
        child: jobs.when(
          loading: () => ListView(
            padding: const EdgeInsets.all(18),
            children: const [
              BncSkeleton(height: 150),
              SizedBox(height: 12),
              BncSkeleton(height: 150),
            ],
          ),
          error: (error, stack) => ErrorState(
            error: error,
            onRetry: () => ref.invalidate(liveJobsProvider),
          ),
          data: (items) {
            final needle = _query.text.trim().toLowerCase();
            final filtered = items.where((job) {
              final business = _json(job['business']);
              final haystack = [
                job.string('title'),
                job.string('description'),
                job.string('city'),
                job.string('district'),
                business.string('name'),
                ...job.stringList('skills'),
              ].join(' ').toLowerCase();
              return (_employmentType == 'ALL' ||
                      job.string('employmentType') == _employmentType) &&
                  (needle.isEmpty || haystack.contains(needle));
            }).toList();
            return ListView(
              padding: const EdgeInsets.fromLTRB(18, 8, 18, 32),
              children: [
                TextField(
                  controller: _query,
                  onChanged: (_) => setState(() {}),
                  decoration: InputDecoration(
                    hintText: 'Search jobs, skills, businesses or cities',
                    prefixIcon: const Icon(Icons.search_rounded),
                    suffixIcon: needle.isEmpty
                        ? null
                        : IconButton(
                            onPressed: () {
                              _query.clear();
                              setState(() {});
                            },
                            icon: const Icon(Icons.close_rounded),
                          ),
                  ),
                ),
                const SizedBox(height: 12),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      for (final option in const [
                        ('ALL', 'All roles'),
                        ('FULL_TIME', 'Full time'),
                        ('PART_TIME', 'Part time'),
                        ('CONTRACT', 'Contract'),
                        ('INTERNSHIP', 'Internship'),
                        ('TEMPORARY', 'Temporary'),
                      ])
                        Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                            label: Text(option.$2),
                            selected: _employmentType == option.$1,
                            onSelected: (_) =>
                                setState(() => _employmentType = option.$1),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  '${filtered.length} open ${filtered.length == 1 ? 'role' : 'roles'}',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 10),
                if (items.isEmpty)
                  const SizedBox(
                    height: 360,
                    child: EmptyState(
                      icon: Icons.work_outline_rounded,
                      title: 'No open vacancies',
                      body:
                          'Vacancies will appear as soon as a local employer publishes one.',
                    ),
                  )
                else if (filtered.isEmpty)
                  const SizedBox(
                    height: 360,
                    child: EmptyState(
                      icon: Icons.search_off_rounded,
                      title: 'No matching vacancies',
                      body: 'Try another role, skill or employment type.',
                    ),
                  )
                else
                  for (var index = 0; index < filtered.length; index++) ...[
                    _JobCard(job: filtered[index]),
                    if (index != filtered.length - 1)
                      const SizedBox(height: 12),
                  ],
              ],
            );
          },
        ),
      ),
    );
  }
}

class _JobCard extends StatelessWidget {
  const _JobCard({required this.job});

  final Json job;

  @override
  Widget build(BuildContext context) {
    final business = _json(job['business']);
    final salaryMin = job.decimal('salaryMin');
    final salaryMax = job.decimal('salaryMax');
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: () => context.push('/jobs/${job.string('id')}'),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const CircleAvatar(
                    backgroundColor: Color(0xFFE4EDFF),
                    foregroundColor: BncColors.brand,
                    child: Icon(Icons.work_outline_rounded),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          job.string('title'),
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        Text(
                          business.string('name', 'BNC business'),
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.arrow_forward_rounded),
                ],
              ),
              const SizedBox(height: 14),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _JobTag(_humanize(job.string('employmentType'))),
                  _JobTag(_humanize(job.string('workplaceType'))),
                  _JobTag(
                    [
                      job.string('city'),
                      job.string('district'),
                    ].where((part) => part.isNotEmpty).join(', '),
                  ),
                  if (salaryMin > 0 || salaryMax > 0)
                    _JobTag(_salaryLabel(salaryMin, salaryMax)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _JobTag extends StatelessWidget {
  const _JobTag(this.label);

  final String label;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
    decoration: BoxDecoration(
      color: const Color(0xFFF0F4FC),
      borderRadius: BorderRadius.circular(999),
    ),
    child: Text(
      label,
      style: Theme.of(
        context,
      ).textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w800),
    ),
  );
}

class JobDetailScreen extends ConsumerWidget {
  const JobDetailScreen({required this.id, super.key});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final job = ref.watch(liveJobProvider(id));
    return Scaffold(
      appBar: AppBar(title: const Text('Job details')),
      body: job.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => ErrorState(
          error: error,
          onRetry: () => ref.invalidate(liveJobProvider(id)),
        ),
        data: (item) {
          final business = _json(item['business']);
          final salaryMin = item.decimal('salaryMin');
          final salaryMax = item.decimal('salaryMax');
          final businessSlug = business.string('slug');
          final closesAt = DateTime.tryParse(item.string('closesAt'));
          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 110),
            children: [
              Text(
                item.string('title'),
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 6),
              InkWell(
                onTap: businessSlug.isEmpty
                    ? null
                    : () => context.push('/business/$businessSlug'),
                child: Row(
                  children: [
                    Flexible(
                      child: Text(
                        business.string('name', 'BNC business'),
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(color: BncColors.brand),
                      ),
                    ),
                    if (business.boolean('verified')) ...[
                      const SizedBox(width: 5),
                      const Icon(
                        Icons.verified_rounded,
                        color: BncColors.brand,
                        size: 18,
                      ),
                    ],
                    if (businessSlug.isNotEmpty)
                      const Icon(
                        Icons.chevron_right_rounded,
                        color: BncColors.brand,
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _JobTag(_humanize(item.string('employmentType'))),
                  _JobTag(_humanize(item.string('workplaceType'))),
                  _JobTag(
                    [
                      item.string('city'),
                      item.string('district'),
                    ].where((part) => part.isNotEmpty).join(', '),
                  ),
                  _JobTag(_salaryLabel(salaryMin, salaryMax)),
                ],
              ),
              if (closesAt != null) ...[
                const SizedBox(height: 12),
                Text(
                  'Applications close ${DateFormat.yMMMd().format(closesAt.toLocal())}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
              const SizedBox(height: 22),
              Text(
                item.string('description'),
                style: Theme.of(
                  context,
                ).textTheme.bodyLarge?.copyWith(height: 1.55),
              ),
              if (item.stringList('skills').isNotEmpty) ...[
                const SizedBox(height: 24),
                Text('Skills', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final skill in item.stringList('skills'))
                      _JobTag(skill),
                  ],
                ),
              ],
            ],
          );
        },
      ),
      bottomNavigationBar: SafeArea(
        minimum: const EdgeInsets.all(16),
        child: ElevatedButton.icon(
          onPressed: () => context.push('/jobs/$id/apply'),
          icon: const Icon(Icons.send_outlined),
          label: const Text('Apply through BNC'),
        ),
      ),
    );
  }
}

class JobApplicationScreen extends ConsumerStatefulWidget {
  const JobApplicationScreen({required this.id, super.key});

  final String id;

  @override
  ConsumerState<JobApplicationScreen> createState() =>
      _JobApplicationScreenState();
}

class _JobApplicationScreenState extends ConsumerState<JobApplicationScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name;
  late final TextEditingController _email;
  final _phone = TextEditingController();
  final _coverNote = TextEditingController();
  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final user = ref.read(sessionProvider).user;
    _name = TextEditingController(text: user?.displayName ?? '');
    _email = TextEditingController(text: user?.email ?? '');
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    _coverNote.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await ref.read(appRepositoryProvider).applyJob(widget.id, {
        'name': _name.text.trim(),
        'email': _email.text.trim(),
        if (_phone.text.trim().isNotEmpty) 'phone': _phone.text.trim(),
        if (_coverNote.text.trim().isNotEmpty)
          'coverNote': _coverNote.text.trim(),
      });
      ref.invalidate(myJobApplicationsProvider);
      if (!mounted) return;
      final signedIn = ref.read(sessionProvider).authenticated;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            signedIn
                ? 'Application submitted successfully.'
                : 'Application received. The business can now review it.',
          ),
        ),
      );
      context.go(signedIn ? '/account/job-applications' : '/jobs/${widget.id}');
    } on Object catch (error) {
      if (mounted) setState(() => _error = '$error');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Apply for this job')),
    body: Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          TextFormField(
            controller: _name,
            maxLength: 120,
            decoration: const InputDecoration(
              labelText: 'Full name',
              counterText: '',
            ),
            validator: (value) {
              final length = value?.trim().length ?? 0;
              if (length < 2) return 'Enter your full name';
              if (length > 120) return 'Use no more than 120 characters';
              return null;
            },
          ),
          const SizedBox(height: 14),
          TextFormField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(labelText: 'Email address'),
            validator: (value) =>
                !(value?.contains('@') ?? false) ? 'Enter a valid email' : null,
          ),
          const SizedBox(height: 14),
          TextFormField(
            controller: _phone,
            keyboardType: TextInputType.phone,
            maxLength: 20,
            decoration: const InputDecoration(
              labelText: 'Phone number (optional)',
              counterText: '',
            ),
            validator: (value) => (value?.trim().length ?? 0) > 20
                ? 'Use no more than 20 characters'
                : null,
          ),
          const SizedBox(height: 14),
          TextFormField(
            controller: _coverNote,
            maxLines: 6,
            maxLength: 3000,
            decoration: const InputDecoration(
              labelText: 'Cover note (optional)',
              alignLabelWithHint: true,
              counterText: '',
            ),
            validator: (value) => (value?.trim().length ?? 0) > 3000
                ? 'Use no more than 3000 characters'
                : null,
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(
              _error!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ],
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _submitting ? null : _submit,
            child: Text(_submitting ? 'Submitting…' : 'Submit application'),
          ),
        ],
      ),
    ),
  );
}

class JobApplicationsScreen extends ConsumerWidget {
  const JobApplicationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final applications = ref.watch(myJobApplicationsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Job applications')),
      body: applications.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => ErrorState(
          error: error,
          onRetry: () => ref.invalidate(myJobApplicationsProvider),
        ),
        data: (items) => items.isEmpty
            ? const EmptyState(
                icon: Icons.assignment_outlined,
                title: 'No applications yet',
                body: 'Jobs you apply for through BNC will appear here.',
              )
            : ListView.separated(
                padding: const EdgeInsets.all(18),
                itemCount: items.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final application = items[index];
                  final job = _json(application['job']);
                  final business = _json(job['business']);
                  return Card(
                    child: ListTile(
                      title: Text(job.string('title')),
                      subtitle: Text(
                        '${business.string('name')} · ${job.string('city')}',
                      ),
                      trailing: StatusBadge(
                        label: _humanize(application.string('status')),
                        color: BncColors.brand,
                      ),
                      onTap: () => context.push('/jobs/${job.string('id')}'),
                    ),
                  );
                },
              ),
      ),
    );
  }
}

Json _json(dynamic value) => value is Map
    ? value.map((key, item) => MapEntry('$key', item))
    : <String, dynamic>{};

String _humanize(String value) => value
    .toLowerCase()
    .split('_')
    .where((part) => part.isNotEmpty)
    .map((part) => '${part[0].toUpperCase()}${part.substring(1)}')
    .join(' ');

String _salaryLabel(double minimum, double maximum) {
  final currency = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹',
    decimalDigits: 0,
  );
  if (minimum > 0 && maximum > 0) {
    return '${currency.format(minimum)}–${currency.format(maximum)}';
  }
  if (minimum > 0) return 'From ${currency.format(minimum)}';
  if (maximum > 0) return 'Up to ${currency.format(maximum)}';
  return 'Salary shared on application';
}
