import 'package:bnc_mobile/core/data/app_repository.dart';
import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/design_system/components.dart';
import 'package:bnc_mobile/features/business_manager/presentation/business_dashboard_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final managedBookingsProvider = FutureProvider.autoDispose
    .family<List<Json>, String>(
      (ref, businessId) =>
          ref.watch(appRepositoryProvider).managedBookings(businessId),
    );

final bookingSetupProvider = FutureProvider.autoDispose.family<Json, String>(
  (ref, businessId) =>
      ref.watch(appRepositoryProvider).bookingSetup(businessId),
);

class BusinessBookingsScreen extends ConsumerWidget {
  const BusinessBookingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final businessState = ref.watch(activeManagedBusinessProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Booking calendar')),
      body: businessState.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => ErrorState(error: error),
        data: (business) => business == null
            ? const EmptyState(
                icon: Icons.event_busy_outlined,
                title: 'Create a business first',
                body: 'Appointment setup belongs to a managed business.',
              )
            : DefaultTabController(
                length: 2,
                child: Column(
                  children: [
                    const TabBar(
                      tabs: [
                        Tab(text: 'Appointments'),
                        Tab(text: 'Setup'),
                      ],
                    ),
                    Expanded(
                      child: TabBarView(
                        children: [
                          _AppointmentsTab(businessId: business.id),
                          _BookingSetupTab(businessId: business.id),
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

class _AppointmentsTab extends ConsumerWidget {
  const _AppointmentsTab({required this.businessId});

  final String businessId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookings = ref.watch(managedBookingsProvider(businessId));
    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(managedBookingsProvider(businessId));
        await ref.read(managedBookingsProvider(businessId).future);
      },
      child: bookings.when(
        loading: () => ListView(
          padding: const EdgeInsets.all(18),
          children: const [BncSkeleton(height: 220)],
        ),
        error: (error, stack) => ListView(
          children: [
            ErrorState(
              error: error,
              onRetry: () =>
                  ref.invalidate(managedBookingsProvider(businessId)),
            ),
          ],
        ),
        data: (items) => items.isEmpty
            ? ListView(
                children: const [
                  EmptyState(
                    icon: Icons.calendar_month_outlined,
                    title: 'No booking requests',
                    body:
                        'Requests from published clinic, salon and professional schedules appear here.',
                  ),
                ],
              )
            : ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 40),
                itemCount: items.length,
                separatorBuilder: (_, index) => const SizedBox(height: 9),
                itemBuilder: (context, index) =>
                    _BookingCard(booking: items[index], businessId: businessId),
              ),
      ),
    );
  }
}

class _BookingCard extends ConsumerStatefulWidget {
  const _BookingCard({required this.booking, required this.businessId});

  final Json booking;
  final String businessId;

  @override
  ConsumerState<_BookingCard> createState() => _BookingCardState();
}

class _BookingCardState extends ConsumerState<_BookingCard> {
  bool busy = false;

  Future<void> _update(String status) async {
    setState(() => busy = true);
    try {
      await ref.read(appRepositoryProvider).updateBooking(
        widget.booking.string('id'),
        {'status': status},
      );
      ref.invalidate(managedBookingsProvider(widget.businessId));
    } on Object catch (error) {
      if (mounted) _error(context, error);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> _reschedule() async {
    final current =
        DateTime.tryParse(widget.booking.string('startsAt')) ?? DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: current.isAfter(DateTime.now())
          ? current
          : DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 120)),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(current),
    );
    if (time == null || !mounted) return;
    final provider = _map(widget.booking['provider']);
    if (provider.string('id').isEmpty) {
      _error(context, 'Assign a rostered professional before rescheduling.');
      return;
    }
    final startsAt = DateTime(
      date.year,
      date.month,
      date.day,
      time.hour,
      time.minute,
    );
    setState(() => busy = true);
    try {
      await ref
          .read(appRepositoryProvider)
          .rescheduleBooking(
            widget.booking.string('id'),
            startsAt: startsAt.toUtc().toIso8601String(),
            providerId: provider.string('id'),
          );
      ref.invalidate(managedBookingsProvider(widget.businessId));
    } on Object catch (error) {
      if (mounted) _error(context, error);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final booking = widget.booking;
    final customer = _map(booking['customer']);
    final profile = _map(customer['customerProfile']);
    final service = _map(booking['service']);
    final provider = _map(booking['provider']);
    final status = booking.string('status', 'REQUESTED');
    final finalStatus = ['COMPLETED', 'CANCELLED', 'NO_SHOW'].contains(status);
    final startsAt = DateTime.tryParse(booking.string('startsAt'));
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Chip(label: Text(_humanize(status))),
                const Spacer(),
                Text('${booking.integer('durationMinutes', 30)} min'),
              ],
            ),
            Text(
              service.string('name', 'Appointment'),
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 5),
            Text(
              startsAt == null
                  ? booking.string('startsAt')
                  : MaterialLocalizations.of(
                      context,
                    ).formatFullDate(startsAt.toLocal()),
            ),
            if (startsAt != null)
              Text(TimeOfDay.fromDateTime(startsAt.toLocal()).format(context)),
            const SizedBox(height: 8),
            Text(
              profile.string(
                'displayName',
                customer.string('email', customer.string('phone', 'Customer')),
              ),
            ),
            Text(
              provider.string(
                'name',
                booking.string('providerName', 'Any professional'),
              ),
            ),
            if (booking.string('customerNote').isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(booking.string('customerNote')),
            ],
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                OutlinedButton.icon(
                  onPressed: busy || finalStatus ? null : _reschedule,
                  icon: const Icon(Icons.schedule_outlined),
                  label: const Text('Reschedule'),
                ),
                PopupMenuButton<String>(
                  enabled: !busy && !finalStatus,
                  onSelected: _update,
                  itemBuilder: (context) => const [
                    PopupMenuItem(value: 'CONFIRMED', child: Text('Confirm')),
                    PopupMenuItem(value: 'COMPLETED', child: Text('Complete')),
                    PopupMenuItem(
                      value: 'NO_SHOW',
                      child: Text('Mark no-show'),
                    ),
                    PopupMenuItem(value: 'CANCELLED', child: Text('Cancel')),
                  ],
                  child: const Chip(label: Text('Update status')),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _BookingSetupTab extends ConsumerWidget {
  const _BookingSetupTab({required this.businessId});

  final String businessId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final setupState = ref.watch(bookingSetupProvider(businessId));
    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(bookingSetupProvider(businessId));
        await ref.read(bookingSetupProvider(businessId).future);
      },
      child: setupState.when(
        loading: () => ListView(
          padding: const EdgeInsets.all(18),
          children: const [BncSkeleton(height: 260)],
        ),
        error: (error, stack) => ListView(
          children: [
            ErrorState(
              error: error,
              onRetry: () => ref.invalidate(bookingSetupProvider(businessId)),
            ),
          ],
        ),
        data: (setup) {
          final providers = setup.jsonList('providers');
          final schedules = setup.jsonList('schedules');
          final timeOff = setup.jsonList('timeOff');
          final services = setup.jsonList('services');
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 50),
            children: [
              Text(
                'Professionals and availability',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 8),
              const Text(
                'Assign bookable services, publish weekly hours, and block unavailable periods.',
              ),
              const SizedBox(height: 14),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  ElevatedButton.icon(
                    onPressed: () =>
                        _addProvider(context, ref, businessId, services),
                    icon: const Icon(Icons.person_add_alt_1_outlined),
                    label: const Text('Add professional'),
                  ),
                  OutlinedButton.icon(
                    onPressed: providers.isEmpty
                        ? null
                        : () => _addSchedule(
                            context,
                            ref,
                            businessId,
                            providers,
                            services,
                          ),
                    icon: const Icon(Icons.calendar_month_outlined),
                    label: const Text('Add schedule'),
                  ),
                  OutlinedButton.icon(
                    onPressed: providers.isEmpty
                        ? null
                        : () =>
                              _addTimeOff(context, ref, businessId, providers),
                    icon: const Icon(Icons.event_busy_outlined),
                    label: const Text('Block time off'),
                  ),
                ],
              ),
              const SizedBox(height: 22),
              Text('Roster', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              if (providers.isEmpty)
                const Text('No professionals added yet.')
              else
                ...providers.map((provider) {
                  final assigned = provider
                      .jsonList('services')
                      .map((item) => _map(item['service']).string('name'))
                      .where((name) => name.isNotEmpty)
                      .join(', ');
                  return ListTile(
                    leading: const CircleAvatar(
                      child: Icon(Icons.person_outline_rounded),
                    ),
                    title: Text(provider.string('name')),
                    subtitle: Text(
                      [
                        provider.string('title'),
                        assigned,
                      ].where((value) => value.isNotEmpty).join(' · '),
                    ),
                  );
                }),
              const SizedBox(height: 20),
              Text(
                'Published schedules',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              if (schedules.isEmpty)
                const Text('No weekly schedules published.')
              else
                ...schedules.map(
                  (schedule) => Card(
                    child: ListTile(
                      title: Text(_map(schedule['provider']).string('name')),
                      subtitle: Text(
                        '${_weekdays[schedule.integer('weekday')]} · '
                        '${_displayMinute(schedule.integer('startsMinute'))}–'
                        '${_displayMinute(schedule.integer('endsMinute'))} · '
                        'every ${schedule.integer('slotIntervalMinutes')} min',
                      ),
                      trailing: IconButton(
                        tooltip: 'Remove schedule',
                        onPressed: () async {
                          try {
                            await ref
                                .read(appRepositoryProvider)
                                .deleteBookingSchedule(schedule.string('id'));
                            ref.invalidate(bookingSetupProvider(businessId));
                          } on Object catch (error) {
                            if (context.mounted) _error(context, error);
                          }
                        },
                        icon: const Icon(Icons.delete_outline_rounded),
                      ),
                    ),
                  ),
                ),
              const SizedBox(height: 20),
              Text(
                'Upcoming time off',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              if (timeOff.isEmpty)
                const Text('No upcoming blocked periods.')
              else
                ...timeOff.map(
                  (period) => ListTile(
                    leading: const Icon(Icons.event_busy_outlined),
                    title: Text(_map(period['provider']).string('name')),
                    subtitle: Text(
                      '${period.string('startsAt')} – ${period.string('endsAt')}',
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}

Future<void> _addProvider(
  BuildContext context,
  WidgetRef ref,
  String businessId,
  List<Json> services,
) async {
  final name = TextEditingController();
  final title = TextEditingController();
  final selected = <String>{};
  var busy = false;
  final saved = await showModalBottomSheet<bool>(
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
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Add professional',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: name,
                decoration: const InputDecoration(labelText: 'Name'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: title,
                decoration: const InputDecoration(
                  labelText: 'Title or speciality',
                ),
              ),
              const SizedBox(height: 14),
              Text(
                'Assigned services',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              ...services.map(
                (service) => CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  value: selected.contains(service.string('id')),
                  title: Text(service.string('name')),
                  onChanged: busy
                      ? null
                      : (checked) => setState(() {
                          if (checked == true) {
                            selected.add(service.string('id'));
                          } else {
                            selected.remove(service.string('id'));
                          }
                        }),
                ),
              ),
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: busy
                      ? null
                      : () async {
                          if (name.text.trim().length < 2) {
                            _error(context, 'Enter the professional name.');
                            return;
                          }
                          setState(() => busy = true);
                          try {
                            await ref
                                .read(appRepositoryProvider)
                                .createBookingProvider({
                                  'businessId': businessId,
                                  'name': name.text.trim(),
                                  if (title.text.trim().isNotEmpty)
                                    'title': title.text.trim(),
                                  'serviceIds': selected.toList(),
                                });
                            if (sheetContext.mounted) {
                              Navigator.pop(sheetContext, true);
                            }
                          } on Object catch (error) {
                            setState(() => busy = false);
                            if (context.mounted) _error(context, error);
                          }
                        },
                  child: Text(busy ? 'Saving…' : 'Add to roster'),
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
  name.dispose();
  title.dispose();
  if (saved == true) ref.invalidate(bookingSetupProvider(businessId));
}

Future<void> _addSchedule(
  BuildContext context,
  WidgetRef ref,
  String businessId,
  List<Json> providers,
  List<Json> services,
) async {
  var providerId = providers.first.string('id');
  String? serviceId;
  var weekday = 1;
  var interval = 30;
  var starts = const TimeOfDay(hour: 9, minute: 0);
  var ends = const TimeOfDay(hour: 17, minute: 0);
  var busy = false;
  final saved = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (sheetContext) => StatefulBuilder(
      builder: (context, setState) => Padding(
        padding: const EdgeInsets.all(20),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Publish weekly availability',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: providerId,
                decoration: const InputDecoration(labelText: 'Professional'),
                items: providers
                    .map(
                      (provider) => DropdownMenuItem(
                        value: provider.string('id'),
                        child: Text(provider.string('name')),
                      ),
                    )
                    .toList(),
                onChanged: (value) => providerId = value ?? providerId,
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String?>(
                initialValue: serviceId,
                decoration: const InputDecoration(labelText: 'Service'),
                items: [
                  const DropdownMenuItem<String?>(
                    value: null,
                    child: Text('All assigned services'),
                  ),
                  ...services.map(
                    (service) => DropdownMenuItem<String?>(
                      value: service.string('id'),
                      child: Text(service.string('name')),
                    ),
                  ),
                ],
                onChanged: (value) => serviceId = value,
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<int>(
                initialValue: weekday,
                decoration: const InputDecoration(labelText: 'Weekday'),
                items: List.generate(
                  7,
                  (index) => DropdownMenuItem(
                    value: index,
                    child: Text(_weekdays[index]),
                  ),
                ),
                onChanged: (value) => weekday = value ?? weekday,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () async {
                        final picked = await showTimePicker(
                          context: context,
                          initialTime: starts,
                        );
                        if (picked != null) setState(() => starts = picked);
                      },
                      child: Text('From ${starts.format(context)}'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () async {
                        final picked = await showTimePicker(
                          context: context,
                          initialTime: ends,
                        );
                        if (picked != null) setState(() => ends = picked);
                      },
                      child: Text('Until ${ends.format(context)}'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<int>(
                initialValue: interval,
                decoration: const InputDecoration(labelText: 'Slot interval'),
                items: const [15, 30, 45, 60]
                    .map(
                      (minutes) => DropdownMenuItem(
                        value: minutes,
                        child: Text('Every $minutes minutes'),
                      ),
                    )
                    .toList(),
                onChanged: (value) => interval = value ?? interval,
              ),
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: busy
                      ? null
                      : () async {
                          final startsMinute = starts.hour * 60 + starts.minute;
                          final endsMinute = ends.hour * 60 + ends.minute;
                          if (endsMinute <= startsMinute) {
                            _error(
                              context,
                              'End time must be after start time.',
                            );
                            return;
                          }
                          setState(() => busy = true);
                          try {
                            await ref
                                .read(appRepositoryProvider)
                                .createBookingSchedule({
                                  'businessId': businessId,
                                  'providerId': providerId,
                                  if (serviceId != null) 'serviceId': serviceId,
                                  'weekday': weekday,
                                  'startsMinute': startsMinute,
                                  'endsMinute': endsMinute,
                                  'slotIntervalMinutes': interval,
                                });
                            if (sheetContext.mounted) {
                              Navigator.pop(sheetContext, true);
                            }
                          } on Object catch (error) {
                            setState(() => busy = false);
                            if (context.mounted) _error(context, error);
                          }
                        },
                  child: Text(busy ? 'Publishing…' : 'Publish schedule'),
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
  if (saved == true) ref.invalidate(bookingSetupProvider(businessId));
}

Future<void> _addTimeOff(
  BuildContext context,
  WidgetRef ref,
  String businessId,
  List<Json> providers,
) async {
  var providerId = providers.first.string('id');
  final reason = TextEditingController();
  DateTime? startsAt;
  DateTime? endsAt;
  var busy = false;
  Future<DateTime?> pickDateTime(BuildContext context, DateTime initial) async {
    final date = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 730)),
    );
    if (date == null || !context.mounted) return null;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(initial),
    );
    if (time == null) return null;
    return DateTime(date.year, date.month, date.day, time.hour, time.minute);
  }

  final saved = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (sheetContext) => StatefulBuilder(
      builder: (context, setState) => Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          16,
          20,
          MediaQuery.viewInsetsOf(context).bottom + 20,
        ),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Block time off',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: providerId,
                decoration: const InputDecoration(labelText: 'Professional'),
                items: providers
                    .map(
                      (provider) => DropdownMenuItem(
                        value: provider.string('id'),
                        child: Text(provider.string('name')),
                      ),
                    )
                    .toList(),
                onChanged: (value) => providerId = value ?? providerId,
              ),
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: () async {
                  final value = await pickDateTime(
                    context,
                    DateTime.now().add(const Duration(days: 1)),
                  );
                  if (value != null) setState(() => startsAt = value);
                },
                child: Text(
                  startsAt == null ? 'Choose start' : 'Starts $startsAt',
                ),
              ),
              const SizedBox(height: 8),
              OutlinedButton(
                onPressed: () async {
                  final value = await pickDateTime(
                    context,
                    startsAt?.add(const Duration(hours: 1)) ??
                        DateTime.now().add(const Duration(days: 1, hours: 1)),
                  );
                  if (value != null) setState(() => endsAt = value);
                },
                child: Text(endsAt == null ? 'Choose end' : 'Ends $endsAt'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: reason,
                maxLength: 500,
                decoration: const InputDecoration(
                  labelText: 'Reason (optional)',
                ),
              ),
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: busy
                      ? null
                      : () async {
                          if (startsAt == null ||
                              endsAt == null ||
                              !endsAt!.isAfter(startsAt!)) {
                            _error(
                              context,
                              'Choose a valid start and end time.',
                            );
                            return;
                          }
                          setState(() => busy = true);
                          try {
                            await ref
                                .read(appRepositoryProvider)
                                .createBookingTimeOff({
                                  'businessId': businessId,
                                  'providerId': providerId,
                                  'startsAt': startsAt!
                                      .toUtc()
                                      .toIso8601String(),
                                  'endsAt': endsAt!.toUtc().toIso8601String(),
                                  if (reason.text.trim().isNotEmpty)
                                    'reason': reason.text.trim(),
                                });
                            if (sheetContext.mounted) {
                              Navigator.pop(sheetContext, true);
                            }
                          } on Object catch (error) {
                            setState(() => busy = false);
                            if (context.mounted) _error(context, error);
                          }
                        },
                  child: Text(busy ? 'Saving…' : 'Block public slots'),
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
  reason.dispose();
  if (saved == true) ref.invalidate(bookingSetupProvider(businessId));
}

const _weekdays = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

String _displayMinute(int minute) =>
    '${(minute ~/ 60).toString().padLeft(2, '0')}:'
    '${(minute % 60).toString().padLeft(2, '0')}';

String _humanize(String value) => value
    .toLowerCase()
    .split('_')
    .where((part) => part.isNotEmpty)
    .map((part) => '${part[0].toUpperCase()}${part.substring(1)}')
    .join(' ');

Json _map(Object? value) => value is Map
    ? value.map((key, item) => MapEntry('$key', item))
    : <String, dynamic>{};

void _error(BuildContext context, Object message) {
  ScaffoldMessenger.of(
    context,
  ).showSnackBar(SnackBar(content: Text('$message')));
}
