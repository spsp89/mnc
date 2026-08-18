import 'package:bnc_mobile/core/data/app_repository.dart';
import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/core/state/app_state.dart';
import 'package:bnc_mobile/core/storage/app_preferences.dart';
import 'package:bnc_mobile/design_system/bnc_theme.dart';
import 'package:bnc_mobile/design_system/components.dart';
import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

final liveCitiesProvider = FutureProvider<List<Json>>(
  (ref) => ref.watch(appRepositoryProvider).cities(),
);

final liveBookingsProvider = FutureProvider<List<Json>>((ref) {
  final authenticated = ref.watch(
    sessionProvider.select((session) => session.authenticated),
  );
  if (!authenticated) return Future.value(const <Json>[]);
  return ref.watch(appRepositoryProvider).bookings();
});

final bookableServicesProvider = FutureProvider<List<Service>>((ref) async {
  final settings = ref.watch(appSettingsProvider);
  final all = await ref
      .watch(appRepositoryProvider)
      .services(
        city: settings.apiLocation,
        latitude: settings.apiLatitude,
        longitude: settings.apiLongitude,
        radiusKm: settings.searchRadiusKm,
      );
  final appointmentTerms = RegExp(
    r'doctor|clinic|dental|health|beauty|salon|spa|hair|makeup|wellness',
    caseSensitive: false,
  );
  final relevant = all
      .where(
        (service) => appointmentTerms.hasMatch(
          '${service.name} ${service.category} ${service.description}',
        ),
      )
      .toList();
  return relevant.isEmpty ? all : relevant;
});

final liveClubChaptersProvider = FutureProvider<List<Json>>(
  (ref) => ref.watch(appRepositoryProvider).clubChapters(),
);

final liveClubOverviewProvider = FutureProvider<Json>(
  (ref) => ref.watch(appRepositoryProvider).clubOverview(),
);

final liveClubMessagesProvider = FutureProvider.family<List<Json>, String>(
  (ref, chapterId) => ref.watch(appRepositoryProvider).clubMessages(chapterId),
);

final liveClubMembersProvider = FutureProvider.family<List<Json>, String>(
  (ref, chapterId) => ref.watch(appRepositoryProvider).clubMembers(chapterId),
);

final liveClubEventsProvider = FutureProvider.family<List<Json>, String>(
  (ref, chapterId) => ref.watch(appRepositoryProvider).clubEvents(chapterId),
);

final liveClubReferralsProvider = FutureProvider.family<List<Json>, String>(
  (ref, chapterId) => ref.watch(appRepositoryProvider).clubReferrals(chapterId),
);

final weeklyDrawsProvider = FutureProvider<List<Json>>(
  (ref) => ref.watch(appRepositoryProvider).weeklyDraws(),
);

final managedDeliveriesProvider = FutureProvider.family<List<Json>, String>(
  (ref, businessId) =>
      ref.watch(appRepositoryProvider).deliveryOrders(businessId),
);

class BookingsScreen extends ConsumerWidget {
  const BookingsScreen({
    super.key,
    this.initialQuery,
    this.initialServiceId,
    this.initialTab = 0,
  });

  final String? initialQuery;
  final String? initialServiceId;
  final int initialTab;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionProvider);
    final bookings = ref.watch(liveBookingsProvider);
    final services = ref.watch(bookableServicesProvider);
    return DefaultTabController(
      length: 2,
      initialIndex: initialTab.clamp(0, 1),
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Appointments'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Find services'),
              Tab(text: 'My bookings'),
            ],
          ),
        ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () => _openBookingComposer(context, session.authenticated),
          icon: const Icon(Icons.add_rounded),
          label: const Text('Book'),
        ),
        body: TabBarView(
          children: [
            RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(bookableServicesProvider);
                await ref.read(bookableServicesProvider.future);
              },
              child: services.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (error, stack) => ListView(
                  children: [
                    ErrorState(
                      error: error,
                      onRetry: () => ref.invalidate(bookableServicesProvider),
                    ),
                  ],
                ),
                data: (items) => _BookableServicesList(
                  services: items,
                  initialQuery: initialQuery,
                  initialServiceId: initialServiceId,
                  onBook: (service) => _openBookingComposer(
                    context,
                    session.authenticated,
                    serviceId: service.id,
                  ),
                ),
              ),
            ),
            if (!session.authenticated)
              EmptyState(
                icon: Icons.lock_outline_rounded,
                title: 'Sign in to see your bookings',
                body:
                    'Your appointment history and rescheduling controls stay connected to your BNC account.',
                action: () => context.push(
                  '/login?returnTo=${Uri.encodeQueryComponent('/bookings')}',
                ),
                actionLabel: 'Sign in',
              )
            else
              RefreshIndicator(
                onRefresh: () async {
                  ref.invalidate(liveBookingsProvider);
                  await ref.read(liveBookingsProvider.future);
                },
                child: bookings.when(
                  loading: () =>
                      const Center(child: CircularProgressIndicator()),
                  error: (error, stack) => ListView(
                    children: [
                      ErrorState(
                        error: error,
                        onRetry: () => ref.invalidate(liveBookingsProvider),
                      ),
                    ],
                  ),
                  data: (items) => items.isEmpty
                      ? const EmptyState(
                          icon: Icons.event_available_outlined,
                          title: 'No appointments yet',
                          body:
                              'Choose a listed service and a live provider slot to make your first booking.',
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.fromLTRB(18, 12, 18, 100),
                          itemCount: items.length,
                          separatorBuilder: (_, _) =>
                              const SizedBox(height: 10),
                          itemBuilder: (context, index) =>
                              _BookingCard(booking: items[index]),
                        ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _openBookingComposer(
    BuildContext context,
    bool authenticated, {
    String? serviceId,
  }) async {
    if (!authenticated) {
      context.push('/login?returnTo=${Uri.encodeQueryComponent('/bookings')}');
      return;
    }
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => _BookingComposer(initialServiceId: serviceId),
    );
  }
}

class _BookableServicesList extends StatefulWidget {
  const _BookableServicesList({
    required this.services,
    required this.onBook,
    this.initialQuery,
    this.initialServiceId,
  });

  final List<Service> services;
  final ValueChanged<Service> onBook;
  final String? initialQuery;
  final String? initialServiceId;

  @override
  State<_BookableServicesList> createState() => _BookableServicesListState();
}

class _BookableServicesListState extends State<_BookableServicesList> {
  late final TextEditingController _queryController;
  late String _query;

  @override
  void initState() {
    super.initState();
    _query = widget.initialQuery?.trim() ?? '';
    _queryController = TextEditingController(text: _query);
  }

  @override
  void didUpdateWidget(covariant _BookableServicesList oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.initialQuery != widget.initialQuery) {
      _query = widget.initialQuery?.trim() ?? '';
      _queryController.value = TextEditingValue(
        text: _query,
        selection: TextSelection.collapsed(offset: _query.length),
      );
    }
  }

  @override
  void dispose() {
    _queryController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final normalized = _query.trim().toLowerCase();
    final filtered =
        widget.services
            .where(
              (service) =>
                  normalized.isEmpty ||
                  [
                    service.name,
                    service.description,
                    service.businessName,
                    service.category,
                    service.businessLocality,
                    service.businessCity,
                  ].join(' ').toLowerCase().contains(normalized),
            )
            .toList()
          ..sort((left, right) {
            final selectedId = widget.initialServiceId?.trim();
            if (selectedId == null || selectedId.isEmpty) return 0;
            final leftSelected = left.id == selectedId;
            final rightSelected = right.id == selectedId;
            if (leftSelected == rightSelected) return 0;
            return leftSelected ? -1 : 1;
          });
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
      children: [
        TextField(
          controller: _queryController,
          textInputAction: TextInputAction.search,
          onChanged: (value) => setState(() => _query = value),
          decoration: InputDecoration(
            hintText: 'Search doctors, clinics, salons or services',
            prefixIcon: const Icon(Icons.search_rounded),
            suffixIcon: _query.isEmpty
                ? null
                : IconButton(
                    tooltip: 'Clear search',
                    onPressed: () {
                      _queryController.clear();
                      setState(() => _query = '');
                    },
                    icon: const Icon(Icons.close_rounded),
                  ),
          ),
        ),
        const SizedBox(height: 14),
        Text(
          '${filtered.length} bookable ${filtered.length == 1 ? 'service' : 'services'}',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 10),
        if (widget.services.isEmpty)
          const SizedBox(
            height: 360,
            child: EmptyState(
              icon: Icons.event_busy_outlined,
              title: 'No appointment services',
              body:
                  'Bookable services published by local businesses will appear here.',
            ),
          )
        else if (filtered.isEmpty)
          const SizedBox(
            height: 360,
            child: EmptyState(
              icon: Icons.search_off_rounded,
              title: 'No matching appointment services',
              body: 'Try another clinic, salon, service or city.',
            ),
          )
        else
          for (var index = 0; index < filtered.length; index++) ...[
            _BookableServiceCard(
              service: filtered[index],
              selected: filtered[index].id == widget.initialServiceId,
              onTap: () => widget.onBook(filtered[index]),
            ),
            if (index != filtered.length - 1) const SizedBox(height: 10),
          ],
      ],
    );
  }
}

class _BookableServiceCard extends StatelessWidget {
  const _BookableServiceCard({
    required this.service,
    required this.onTap,
    this.selected = false,
  });

  final Service service;
  final VoidCallback onTap;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    final location = [
      service.businessLocality,
      service.businessCity,
    ].where((value) => value.isNotEmpty).join(', ');
    return Card(
      color: selected ? const Color(0xFFEAF2FF) : null,
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const CircleAvatar(
                backgroundColor: Color(0xFFE4EDFF),
                foregroundColor: BncColors.brand,
                child: Icon(Icons.event_available_outlined),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      service.name,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    if (selected) ...[
                      const SizedBox(height: 5),
                      const StatusBadge(
                        label: 'Selected service',
                        color: BncColors.brand,
                      ),
                    ],
                    if (service.businessName.isNotEmpty) ...[
                      const SizedBox(height: 3),
                      Text(service.businessName),
                    ],
                    const SizedBox(height: 7),
                    Text(
                      [
                        if (location.isNotEmpty) location,
                        if (service.duration.isNotEmpty) service.duration,
                        if (service.startingPrice > 0)
                          'From ${formatCurrency(service.startingPrice)}',
                      ].join(' · '),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded),
            ],
          ),
        ),
      ),
    );
  }
}

class _BookingCard extends ConsumerWidget {
  const _BookingCard({required this.booking});

  final Json booking;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final business = _asJson(booking['business']);
    final service = _asJson(booking['service']);
    final status = booking.string('status');
    final cancellable = status == 'REQUESTED' || status == 'CONFIRMED';
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const CircleAvatar(
              backgroundColor: Color(0xFFE4EDFF),
              foregroundColor: BncColors.brand,
              child: Icon(Icons.calendar_month_outlined),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    service.string('name', 'Appointment'),
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 3),
                  Text(business.string('name', 'BNC business')),
                  const SizedBox(height: 6),
                  Text(
                    _formatDateTime(booking.string('startsAt')),
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      StatusBadge(
                        label: _humanize(booking.string('status')),
                        color: BncColors.brand,
                      ),
                      const Spacer(),
                      if (cancellable) ...[
                        TextButton(
                          onPressed: service.isEmpty
                              ? null
                              : () => showModalBottomSheet<void>(
                                  context: context,
                                  isScrollControlled: true,
                                  useSafeArea: true,
                                  builder: (_) =>
                                      _BookingRescheduleSheet(booking: booking),
                                ),
                          child: const Text('Move'),
                        ),
                        TextButton(
                          onPressed: () async {
                            try {
                              await ref
                                  .read(appRepositoryProvider)
                                  .cancelBooking(booking.string('id'));
                              ref.invalidate(liveBookingsProvider);
                            } on Object catch (error) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('$error')),
                                );
                              }
                            }
                          },
                          child: const Text('Cancel'),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BookingRescheduleSheet extends ConsumerStatefulWidget {
  const _BookingRescheduleSheet({required this.booking});

  final Json booking;

  @override
  ConsumerState<_BookingRescheduleSheet> createState() =>
      _BookingRescheduleSheetState();
}

class _BookingRescheduleSheetState
    extends ConsumerState<_BookingRescheduleSheet> {
  DateTime _date = DateTime.now().add(const Duration(days: 1));
  List<Json> _slots = const [];
  String? _slotKey;
  bool _loading = true;
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    Future.microtask(_load);
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _slotKey = null;
    });
    try {
      final business = _asJson(widget.booking['business']);
      final service = _asJson(widget.booking['service']);
      final date =
          '${_date.year.toString().padLeft(4, '0')}-'
          '${_date.month.toString().padLeft(2, '0')}-'
          '${_date.day.toString().padLeft(2, '0')}';
      final items = await ref
          .read(appRepositoryProvider)
          .bookingSlots(
            businessId: business.string('id'),
            serviceId: service.string('id'),
            date: date,
          );
      if (mounted) setState(() => _slots = items);
    } on Object catch (error) {
      if (mounted) setState(() => _error = '$error');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _chooseDate() async {
    final date = await showDatePicker(
      context: context,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 120)),
      initialDate: _date,
    );
    if (date == null) return;
    setState(() => _date = date);
    await _load();
  }

  Future<void> _submit() async {
    final slot = _slots.where((item) {
      final provider = _asJson(item['provider']);
      return '${provider.string('id')}|${item.string('startsAt')}' == _slotKey;
    }).firstOrNull;
    if (slot == null) return;
    setState(() => _busy = true);
    try {
      final provider = _asJson(slot['provider']);
      await ref
          .read(appRepositoryProvider)
          .rescheduleBooking(
            widget.booking.string('id'),
            startsAt: slot.string('startsAt'),
            providerId: provider.string('id'),
          );
      ref.invalidate(liveBookingsProvider);
      if (mounted) Navigator.pop(context);
    } on Object catch (error) {
      if (mounted) setState(() => _error = '$error');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final keyboard = MediaQuery.viewInsetsOf(context).bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 18, 20, 20 + keyboard),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Choose a new live slot',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: _chooseDate,
            icon: const Icon(Icons.calendar_month_outlined),
            label: Text('${_date.day}/${_date.month}/${_date.year}'),
          ),
          const SizedBox(height: 12),
          if (_loading)
            const Center(child: CircularProgressIndicator())
          else
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final slot in _slots)
                  Builder(
                    builder: (context) {
                      final provider = _asJson(slot['provider']);
                      final key =
                          '${provider.string('id')}|${slot.string('startsAt')}';
                      return ChoiceChip(
                        selected: _slotKey == key,
                        onSelected: (_) => setState(() => _slotKey = key),
                        label: Text(
                          '${_formatDateTime(slot.string('startsAt'))}\n'
                          '${provider.string('name')}',
                        ),
                      );
                    },
                  ),
              ],
            ),
          if (!_loading && _slots.isEmpty)
            const Text('No open slots for this day.'),
          if (_error != null) ...[
            const SizedBox(height: 8),
            Text(
              _error!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ],
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _slotKey == null || _busy ? null : _submit,
            child: Text(_busy ? 'Moving…' : 'Request selected slot'),
          ),
        ],
      ),
    );
  }
}

class _BookingComposer extends ConsumerStatefulWidget {
  const _BookingComposer({this.initialServiceId});

  final String? initialServiceId;

  @override
  ConsumerState<_BookingComposer> createState() => _BookingComposerState();
}

class _BookingComposerState extends ConsumerState<_BookingComposer> {
  late String? _serviceId;
  DateTime _startsAt = DateTime.now().add(const Duration(days: 1));
  List<Json> _slots = const [];
  String? _slotKey;
  bool _loadingSlots = false;
  final _note = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _serviceId = widget.initialServiceId;
    if (_serviceId != null) Future.microtask(_loadSlots);
  }

  @override
  void dispose() {
    _note.dispose();
    super.dispose();
  }

  Future<void> _chooseDate() async {
    final date = await showDatePicker(
      context: context,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      initialDate: _startsAt,
    );
    if (date == null || !mounted) return;
    setState(() {
      _startsAt = DateTime(date.year, date.month, date.day);
      _slotKey = null;
    });
    await _loadSlots();
  }

  Future<void> _loadSlots() async {
    final services = await ref.read(bookableServicesProvider.future);
    final selected = services
        .where((service) => service.id == _serviceId)
        .firstOrNull;
    if (selected == null) return;
    setState(() {
      _loadingSlots = true;
      _error = null;
    });
    try {
      final date =
          '${_startsAt.year.toString().padLeft(4, '0')}-'
          '${_startsAt.month.toString().padLeft(2, '0')}-'
          '${_startsAt.day.toString().padLeft(2, '0')}';
      final items = await ref
          .read(appRepositoryProvider)
          .bookingSlots(
            businessId: selected.businessId,
            serviceId: selected.id,
            date: date,
          );
      if (mounted) setState(() => _slots = items);
    } on Object catch (error) {
      if (mounted) setState(() => _error = '$error');
    } finally {
      if (mounted) setState(() => _loadingSlots = false);
    }
  }

  Future<void> _submit(List<Service> services) async {
    final selected = services
        .where((service) => service.id == _serviceId)
        .firstOrNull;
    if (selected == null) {
      setState(() => _error = 'Choose a service.');
      return;
    }
    final slot = _slots
        .where(
          (item) =>
              '${_asJson(item['provider']).string('id')}|${item.string('startsAt')}' ==
              _slotKey,
        )
        .firstOrNull;
    if (slot == null) {
      setState(() => _error = 'Choose a live provider slot.');
      return;
    }
    final provider = _asJson(slot['provider']);
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(appRepositoryProvider).createBooking({
        'businessId': selected.businessId,
        'serviceId': selected.id,
        'providerId': provider.string('id'),
        'startsAt': slot.string('startsAt'),
        'durationMinutes': slot.integer('durationMinutes', 30),
        if (_note.text.trim().isNotEmpty) 'customerNote': _note.text.trim(),
      });
      ref.invalidate(liveBookingsProvider);
      if (mounted) Navigator.of(context).pop();
    } on Object catch (error) {
      if (mounted) setState(() => _error = '$error');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final services = ref.watch(bookableServicesProvider);
    final keyboard = MediaQuery.viewInsetsOf(context).bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 18, 20, 20 + keyboard),
      child: services.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => ErrorState(
          error: error,
          onRetry: () => ref.invalidate(bookableServicesProvider),
        ),
        data: (items) => items.isEmpty
            ? const EmptyState(
                icon: Icons.event_busy_outlined,
                title: 'No bookable services',
                body:
                    'Businesses need to publish a service before it can be booked.',
              )
            : SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Book an appointment',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: 18),
                    DropdownButtonFormField<String>(
                      initialValue: _serviceId,
                      decoration: const InputDecoration(labelText: 'Service'),
                      items: [
                        for (final service in items)
                          DropdownMenuItem(
                            value: service.id,
                            child: Text(service.name),
                          ),
                      ],
                      onChanged: (value) {
                        setState(() {
                          _serviceId = value;
                          _slots = const [];
                          _slotKey = null;
                        });
                        _loadSlots();
                      },
                    ),
                    const SizedBox(height: 14),
                    OutlinedButton.icon(
                      onPressed: _chooseDate,
                      icon: const Icon(Icons.schedule_outlined),
                      label: Text(
                        '${_startsAt.day}/${_startsAt.month}/${_startsAt.year}',
                      ),
                    ),
                    const SizedBox(height: 14),
                    if (_loadingSlots)
                      const Center(child: CircularProgressIndicator())
                    else if (_serviceId != null && _slots.isEmpty)
                      const Text(
                        'No live slots for this date. Choose another day.',
                      )
                    else
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          for (final slot in _slots)
                            Builder(
                              builder: (context) {
                                final provider = _asJson(slot['provider']);
                                final key =
                                    '${provider.string('id')}|${slot.string('startsAt')}';
                                return ChoiceChip(
                                  selected: _slotKey == key,
                                  onSelected: (_) =>
                                      setState(() => _slotKey = key),
                                  label: Text(
                                    '${_formatDateTime(slot.string('startsAt'))}\n'
                                    '${provider.string('name')}',
                                  ),
                                );
                              },
                            ),
                        ],
                      ),
                    const SizedBox(height: 14),
                    TextField(
                      controller: _note,
                      maxLines: 3,
                      maxLength: 2000,
                      decoration: const InputDecoration(
                        labelText: 'Note (optional)',
                        alignLabelWithHint: true,
                        counterText: '',
                      ),
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
                    ElevatedButton(
                      onPressed: _busy ? null : () => _submit(items),
                      child: Text(
                        _busy ? 'Requesting…' : 'Request appointment',
                      ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}

class BusinessClubScreen extends ConsumerWidget {
  const BusinessClubScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chapters = ref.watch(liveClubChaptersProvider);
    final overview = ref.watch(liveClubOverviewProvider).valueOrNull;
    return Scaffold(
      appBar: AppBar(title: const Text('Business Club')),
      body: chapters.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => ErrorState(
          error: error,
          onRetry: () => ref.invalidate(liveClubChaptersProvider),
        ),
        data: (items) => ListView(
          padding: const EdgeInsets.fromLTRB(18, 10, 18, 30),
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: BncColors.brand,
                borderRadius: BorderRadius.circular(24),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Chapter-wise B2B networking',
                    style: Theme.of(
                      context,
                    ).textTheme.headlineMedium?.copyWith(color: Colors.white),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'A private network for businesses on the top two BNC plans: 5 stars and 6 stars.',
                    style: TextStyle(color: Colors.white70, height: 1.45),
                  ),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: [
                      _ClubMetric(
                        label: 'Registered shops',
                        value:
                            '${overview?.integer('registeredBusinesses') ?? 0}',
                      ),
                      _ClubMetric(
                        label: 'Club memberships',
                        value: '${overview?.integer('clubMembers') ?? 0}',
                      ),
                    ],
                  ),
                ],
              ),
            ),
            if (items.isEmpty)
              const EmptyState(
                icon: Icons.groups_outlined,
                title: 'No active chapters',
                body: 'New regional chapters will appear here.',
              )
            else
              for (final chapter in items) ...[
                const SizedBox(height: 12),
                _ClubChapterCard(chapter: chapter),
              ],
          ],
        ),
      ),
    );
  }
}

class _ClubChapterCard extends ConsumerStatefulWidget {
  const _ClubChapterCard({required this.chapter});

  final Json chapter;

  @override
  ConsumerState<_ClubChapterCard> createState() => _ClubChapterCardState();
}

class _ClubChapterCardState extends ConsumerState<_ClubChapterCard> {
  bool _busy = false;

  Future<void> _join() async {
    setState(() => _busy = true);
    try {
      final businesses = await ref.read(appRepositoryProvider).myBusinesses();
      if (businesses.isEmpty) {
        throw StateError('Create a business profile before joining a chapter.');
      }
      await ref
          .read(appRepositoryProvider)
          .joinClubChapter(widget.chapter.string('id'), businesses.first.id);
      ref.invalidate(liveClubChaptersProvider);
    } on Object catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$error')));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final membership = widget.chapter.jsonList('memberships').firstOrNull;
    final count = _asJson(widget.chapter['_count']);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(17),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.chapter.string('name'),
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 5),
            Text(
              '${widget.chapter.string('city')}, ${widget.chapter.string('district')}',
            ),
            const SizedBox(height: 7),
            Text(widget.chapter.string('description')),
            const SizedBox(height: 12),
            Text(
              '${count.integer('memberships')}/${widget.chapter.integer('capacity', 16)} members · ${count.integer('messages')} messages',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: membership != null
                  ? ElevatedButton.icon(
                      onPressed: () => context.push(
                        '/business-club/${widget.chapter.string('id')}',
                        extra: widget.chapter,
                      ),
                      icon: const Icon(Icons.forum_outlined),
                      label: const Text('Open chapter workspace'),
                    )
                  : OutlinedButton.icon(
                      onPressed: _busy ? null : _join,
                      icon: const Icon(Icons.group_add_outlined),
                      label: Text(_busy ? 'Joining…' : 'Join chapter'),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ClubMetric extends StatelessWidget {
  const _ClubMetric({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 10),
    decoration: BoxDecoration(
      color: Colors.white.withValues(alpha: 0.12),
      borderRadius: BorderRadius.circular(14),
    ),
    child: Text(
      '$value  $label',
      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
    ),
  );
}

class BusinessClubChatScreen extends ConsumerStatefulWidget {
  const BusinessClubChatScreen({
    required this.chapterId,
    super.key,
    this.chapter,
  });

  final String chapterId;
  final Json? chapter;

  @override
  ConsumerState<BusinessClubChatScreen> createState() =>
      _BusinessClubChatScreenState();
}

class _BusinessClubChatScreenState
    extends ConsumerState<BusinessClubChatScreen> {
  final _message = TextEditingController();
  bool _sending = false;

  @override
  void dispose() {
    _message.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final body = _message.text.trim();
    if (body.isEmpty) return;
    setState(() => _sending = true);
    try {
      await ref
          .read(appRepositoryProvider)
          .sendClubMessage(widget.chapterId, body);
      _message.clear();
      ref.invalidate(liveClubMessagesProvider(widget.chapterId));
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(liveClubMessagesProvider(widget.chapterId));
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        appBar: AppBar(
          title: Text(
            widget.chapter?.string('name', 'Chapter workspace') ??
                'Chapter workspace',
          ),
          bottom: const TabBar(
            isScrollable: true,
            tabs: [
              Tab(icon: Icon(Icons.forum_outlined), text: 'Chat'),
              Tab(icon: Icon(Icons.storefront_outlined), text: 'Members'),
              Tab(icon: Icon(Icons.event_outlined), text: 'Events'),
              Tab(icon: Icon(Icons.handshake_outlined), text: 'Referrals'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            Column(
              children: [
                Expanded(
                  child: messages.when(
                    loading: () =>
                        const Center(child: CircularProgressIndicator()),
                    error: (error, stack) => ErrorState(
                      error: error,
                      onRetry: () => ref.invalidate(
                        liveClubMessagesProvider(widget.chapterId),
                      ),
                    ),
                    data: (items) => items.isEmpty
                        ? const EmptyState(
                            icon: Icons.forum_outlined,
                            title: 'Start the conversation',
                            body:
                                'Messages here are visible only to chapter members.',
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: items.length,
                            itemBuilder: (context, index) {
                              final item = items[index];
                              final sender = _asJson(item['sender']);
                              final profile = _asJson(
                                sender['customerProfile'],
                              );
                              return ListTile(
                                contentPadding: EdgeInsets.zero,
                                leading: const CircleAvatar(
                                  child: Icon(Icons.person_outline),
                                ),
                                title: Text(
                                  profile.string('displayName', 'BNC member'),
                                ),
                                subtitle: Text(item.string('body')),
                              );
                            },
                          ),
                  ),
                ),
                SafeArea(
                  top: false,
                  minimum: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _message,
                          minLines: 1,
                          maxLines: 4,
                          decoration: const InputDecoration(
                            hintText: 'Message chapter members',
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton.filled(
                        onPressed: _sending ? null : _send,
                        icon: const Icon(Icons.send_rounded),
                        tooltip: 'Send message',
                      ),
                    ],
                  ),
                ),
              ],
            ),
            _ClubMembersTab(chapterId: widget.chapterId),
            _ClubEventsTab(chapterId: widget.chapterId),
            _ClubReferralsTab(chapterId: widget.chapterId),
          ],
        ),
      ),
    );
  }
}

class _ClubMembersTab extends ConsumerWidget {
  const _ClubMembersTab({required this.chapterId});

  final String chapterId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final members = ref.watch(liveClubMembersProvider(chapterId));
    return members.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => ErrorState(
        error: error,
        onRetry: () => ref.invalidate(liveClubMembersProvider(chapterId)),
      ),
      data: (items) => items.isEmpty
          ? const EmptyState(
              icon: Icons.storefront_outlined,
              title: 'No active member businesses',
              body: 'Eligible member businesses will appear here.',
            )
          : RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(liveClubMembersProvider(chapterId));
                await ref.read(liveClubMembersProvider(chapterId).future);
              },
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: items.length,
                separatorBuilder: (_, _) => const SizedBox(height: 8),
                itemBuilder: (context, index) {
                  final member = items[index];
                  final business = _asJson(member['business']);
                  final subscriptions = business.jsonList('subscriptions');
                  final plan = subscriptions.isEmpty
                      ? <String, dynamic>{}
                      : _asJson(subscriptions.first['plan']);
                  final locations = business.jsonList('locations');
                  final location = locations.isEmpty
                      ? <String, dynamic>{}
                      : locations.first;
                  return Card(
                    child: ListTile(
                      leading: CircleAvatar(
                        child: Text(
                          business
                              .string('name', 'BN')
                              .substring(
                                0,
                                business
                                    .string('name', 'BN')
                                    .length
                                    .clamp(1, 2),
                              ),
                        ),
                      ),
                      title: Text(business.string('name', 'BNC business')),
                      subtitle: Text(
                        '${bncMembershipLabel(plan.integer('starLevel'), plan.string('name'))} · '
                        '${location.string('locality')}, ${location.string('city')}',
                      ),
                      trailing: const Icon(Icons.chevron_right_rounded),
                      onTap: () =>
                          context.push('/business/${business.string('slug')}'),
                    ),
                  );
                },
              ),
            ),
    );
  }
}

class _ClubEventsTab extends ConsumerWidget {
  const _ClubEventsTab({required this.chapterId});

  final String chapterId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final events = ref.watch(liveClubEventsProvider(chapterId));
    return Stack(
      children: [
        events.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, stack) => ErrorState(
            error: error,
            onRetry: () => ref.invalidate(liveClubEventsProvider(chapterId)),
          ),
          data: (items) => items.isEmpty
              ? const EmptyState(
                  icon: Icons.event_outlined,
                  title: 'No chapter events',
                  body: 'Publish the first member meetup or referral session.',
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
                  itemCount: items.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final event = items[index];
                    final registrations = event.jsonList('registrations');
                    final attending =
                        registrations.firstOrNull?.string('status') ==
                        'ATTENDING';
                    final count = _asJson(event['_count']);
                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              event.string('title'),
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: 4),
                            Text(_formatDateTime(event.string('startsAt'))),
                            Text(event.string('venue')),
                            const SizedBox(height: 8),
                            Text(event.string('description')),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Text(
                                  '${count.integer('registrations')} attending',
                                ),
                                const Spacer(),
                                TextButton(
                                  onPressed: () async {
                                    try {
                                      final repository = ref.read(
                                        appRepositoryProvider,
                                      );
                                      if (attending) {
                                        await repository
                                            .cancelClubEventRegistration(
                                              chapterId,
                                              event.string('id'),
                                            );
                                      } else {
                                        await repository.registerClubEvent(
                                          chapterId,
                                          event.string('id'),
                                        );
                                      }
                                      ref.invalidate(
                                        liveClubEventsProvider(chapterId),
                                      );
                                    } on Object catch (error) {
                                      if (context.mounted) {
                                        ScaffoldMessenger.of(
                                          context,
                                        ).showSnackBar(
                                          SnackBar(content: Text('$error')),
                                        );
                                      }
                                    }
                                  },
                                  child: Text(
                                    attending ? 'Cancel RSVP' : 'Attend',
                                  ),
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
        Positioned(
          right: 18,
          bottom: 18,
          child: FloatingActionButton.small(
            heroTag: 'club-event-$chapterId',
            onPressed: () => _create(context, ref),
            child: const Icon(Icons.add_rounded),
          ),
        ),
      ],
    );
  }

  Future<void> _create(BuildContext context, WidgetRef ref) async {
    final title = TextEditingController();
    final venue = TextEditingController();
    final description = TextEditingController();
    final capacity = TextEditingController();
    DateTime startsAt = DateTime.now().add(const Duration(days: 1, hours: 2));
    DateTime endsAt = startsAt.add(const Duration(hours: 2));
    try {
      await showDialog<void>(
        context: context,
        builder: (context) => StatefulBuilder(
          builder: (context, setDialogState) => AlertDialog(
            title: const Text('Publish chapter event'),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: title,
                    decoration: const InputDecoration(labelText: 'Title'),
                  ),
                  TextField(
                    controller: venue,
                    decoration: const InputDecoration(
                      labelText: 'Venue or meeting link',
                    ),
                  ),
                  TextField(
                    controller: description,
                    minLines: 3,
                    maxLines: 5,
                    decoration: const InputDecoration(labelText: 'Agenda'),
                  ),
                  TextField(
                    controller: capacity,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Capacity (optional)',
                    ),
                  ),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Starts'),
                    subtitle: Text(_formatDateTime(startsAt.toIso8601String())),
                    onTap: () async {
                      final date = await showDatePicker(
                        context: context,
                        firstDate: DateTime.now(),
                        lastDate: DateTime.now().add(const Duration(days: 365)),
                        initialDate: startsAt,
                      );
                      if (date == null || !context.mounted) return;
                      final time = await showTimePicker(
                        context: context,
                        initialTime: TimeOfDay.fromDateTime(startsAt),
                      );
                      if (time == null) return;
                      setDialogState(() {
                        startsAt = DateTime(
                          date.year,
                          date.month,
                          date.day,
                          time.hour,
                          time.minute,
                        );
                        endsAt = startsAt.add(const Duration(hours: 2));
                      });
                    },
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: () async {
                  await ref
                      .read(appRepositoryProvider)
                      .createClubEvent(chapterId, {
                        'title': title.text.trim(),
                        'venue': venue.text.trim(),
                        'description': description.text.trim(),
                        'startsAt': startsAt.toUtc().toIso8601String(),
                        'endsAt': endsAt.toUtc().toIso8601String(),
                        if (capacity.text.trim().isNotEmpty)
                          'capacity': int.tryParse(capacity.text.trim()),
                      });
                  ref.invalidate(liveClubEventsProvider(chapterId));
                  if (context.mounted) Navigator.pop(context);
                },
                child: const Text('Publish'),
              ),
            ],
          ),
        ),
      );
    } finally {
      title.dispose();
      venue.dispose();
      description.dispose();
      capacity.dispose();
    }
  }
}

class _ClubReferralsTab extends ConsumerWidget {
  const _ClubReferralsTab({required this.chapterId});

  final String chapterId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final referrals = ref.watch(liveClubReferralsProvider(chapterId));
    return Stack(
      children: [
        referrals.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, stack) => ErrorState(
            error: error,
            onRetry: () => ref.invalidate(liveClubReferralsProvider(chapterId)),
          ),
          data: (items) => items.isEmpty
              ? const EmptyState(
                  icon: Icons.handshake_outlined,
                  title: 'No chapter referrals',
                  body: 'Share the first trusted business introduction.',
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
                  itemCount: items.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final referral = items[index];
                    final membership = _asJson(referral['membership']);
                    final business = _asJson(membership['business']);
                    return Card(
                      child: ListTile(
                        title: Text(referral.string('contactName')),
                        subtitle: Text(
                          '${referral.string('referredBusiness')} · '
                          '${business.string('name')}\n'
                          '${referral.string('notes')}',
                        ),
                        isThreeLine: true,
                        trailing: PopupMenuButton<String>(
                          initialValue: referral.string('status'),
                          onSelected: (status) async {
                            try {
                              await ref
                                  .read(appRepositoryProvider)
                                  .updateClubReferral(
                                    chapterId,
                                    referral.string('id'),
                                    status,
                                  );
                              ref.invalidate(
                                liveClubReferralsProvider(chapterId),
                              );
                            } on Object catch (error) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('$error')),
                                );
                              }
                            }
                          },
                          itemBuilder: (_) => const [
                            PopupMenuItem(value: 'NEW', child: Text('New')),
                            PopupMenuItem(
                              value: 'CONTACTED',
                              child: Text('Contacted'),
                            ),
                            PopupMenuItem(
                              value: 'CONVERTED',
                              child: Text('Converted'),
                            ),
                            PopupMenuItem(
                              value: 'CLOSED',
                              child: Text('Closed'),
                            ),
                          ],
                          child: StatusBadge(
                            label: _humanize(referral.string('status')),
                            color: BncColors.brand,
                          ),
                        ),
                      ),
                    );
                  },
                ),
        ),
        Positioned(
          right: 18,
          bottom: 18,
          child: FloatingActionButton.small(
            heroTag: 'club-referral-$chapterId',
            onPressed: () => _create(context, ref),
            child: const Icon(Icons.add_rounded),
          ),
        ),
      ],
    );
  }

  Future<void> _create(BuildContext context, WidgetRef ref) async {
    final name = TextEditingController();
    final business = TextEditingController();
    final phone = TextEditingController();
    final notes = TextEditingController();
    try {
      await showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Add chapter referral'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: name,
                  decoration: const InputDecoration(labelText: 'Contact name'),
                ),
                TextField(
                  controller: business,
                  decoration: const InputDecoration(
                    labelText: 'Business or organisation',
                  ),
                ),
                TextField(
                  controller: phone,
                  decoration: const InputDecoration(labelText: 'Phone'),
                ),
                TextField(
                  controller: notes,
                  minLines: 3,
                  maxLines: 5,
                  decoration: const InputDecoration(labelText: 'Need or notes'),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                await ref
                    .read(appRepositoryProvider)
                    .createClubReferral(chapterId, {
                      'contactName': name.text.trim(),
                      if (business.text.trim().isNotEmpty)
                        'referredBusiness': business.text.trim(),
                      if (phone.text.trim().isNotEmpty)
                        'phone': phone.text.trim(),
                      if (notes.text.trim().isNotEmpty)
                        'notes': notes.text.trim(),
                    });
                ref.invalidate(liveClubReferralsProvider(chapterId));
                if (context.mounted) Navigator.pop(context);
              },
              child: const Text('Add referral'),
            ),
          ],
        ),
      );
    } finally {
      name.dispose();
      business.dispose();
      phone.dispose();
      notes.dispose();
    }
  }
}

class WeeklyDrawsScreen extends ConsumerWidget {
  const WeeklyDrawsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final draws = ref.watch(weeklyDrawsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Rewards & festival draws')),
      body: draws.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => ErrorState(
          error: error,
          onRetry: () => ref.invalidate(weeklyDrawsProvider),
        ),
        data: (items) => items.isEmpty
            ? const EmptyState(
                icon: Icons.celebration_outlined,
                title: 'No active reward draw',
                body:
                    'Weekly gifts, monthly draws and festival bumpers will appear here when their entry period opens.',
              )
            : ListView.separated(
                padding: const EdgeInsets.all(18),
                itemCount: items.length + 1,
                separatorBuilder: (_, _) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  if (index == 0) return const _ClaimRewardIdCard();
                  final draw = items[index - 1];
                  final winner = _asJson(draw['winner']);
                  final audit = _asJson(draw['audit']);
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          StatusBadge(
                            label: _humanize(draw.string('status')),
                            color: BncColors.brand,
                          ),
                          const SizedBox(height: 10),
                          Text(
                            draw.string('title'),
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 6),
                          Text(draw.string('prizeDescription')),
                          const SizedBox(height: 6),
                          Text(
                            'Purchases from ₹${draw.decimal('minimumPurchase', 200).toStringAsFixed(0)} qualify. '
                            'Eligible BNC orders enter automatically; direct shop purchases use a merchant-issued reward ID.',
                          ),
                          const SizedBox(height: 10),
                          Text(
                            '${_formatDateTime(draw.string('weekStartsAt'))} – ${_formatDateTime(draw.string('weekEndsAt'))}',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                          if (winner.isNotEmpty) ...[
                            const Divider(height: 26),
                            Text(
                              'Winner: ${winner.string('name')} · ${winner.string('city')}',
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            Text('Order ${winner.string('orderNumber')}'),
                          ],
                          if (audit.isNotEmpty) ...[
                            const Divider(height: 26),
                            Text(
                              'Reproducible audit · '
                              '${audit.integer('candidateCount')} entries · '
                              '${audit.integer('usageEventCount')} usage events',
                            ),
                            Text(
                              'Winning index ${audit.integer('selectionIndex')} · '
                              '${audit.string('algorithm')}',
                            ),
                            SelectableText(
                              'Candidate ${audit.string('candidateHash')}\n'
                              'Seed ${audit.string('selectionSeed')}\n'
                              'Selection ${audit.string('selectionHash')}',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ],
                      ),
                    ),
                  );
                },
              ),
      ),
    );
  }
}

class _ClaimRewardIdCard extends ConsumerStatefulWidget {
  const _ClaimRewardIdCard();

  @override
  ConsumerState<_ClaimRewardIdCard> createState() => _ClaimRewardIdCardState();
}

class _ClaimRewardIdCardState extends ConsumerState<_ClaimRewardIdCard> {
  final _code = TextEditingController();
  bool _busy = false;
  String _confirmation = '';

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authenticated = ref.watch(sessionProvider).authenticated;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF082C86), Color(0xFF0867EC)],
        ),
        borderRadius: BorderRadius.circular(22),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.redeem_rounded, color: BncColors.golden, size: 30),
          const SizedBox(height: 10),
          const Text(
            'Claim a shop reward ID',
            style: TextStyle(
              color: Colors.white,
              fontSize: 21,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'After a qualifying direct purchase, enter the unique ID supplied by the merchant.',
            style: TextStyle(color: Colors.white70),
          ),
          if (_confirmation.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              _confirmation,
              style: const TextStyle(
                color: Color(0xFF85F4C3),
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
          const SizedBox(height: 14),
          if (authenticated) ...[
            TextField(
              controller: _code,
              autocorrect: false,
              textCapitalization: TextCapitalization.characters,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'BNC-AB12-CD34',
                hintStyle: const TextStyle(color: Colors.white54),
                filled: true,
                fillColor: Colors.white.withValues(alpha: 0.12),
                prefixIcon: const Icon(Icons.confirmation_number_outlined),
              ),
            ),
            const SizedBox(height: 10),
            FilledButton.icon(
              style: FilledButton.styleFrom(
                backgroundColor: BncColors.golden,
                foregroundColor: BncColors.ink,
              ),
              onPressed: _busy ? null : _claim,
              icon: const Icon(Icons.check_circle_outline_rounded),
              label: Text(_busy ? 'Claiming…' : 'Claim entry'),
            ),
          ] else
            FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: BncColors.brand,
              ),
              onPressed: () => context.push('/login?returnTo=/weekly-draw'),
              child: const Text('Sign in to claim'),
            ),
        ],
      ),
    );
  }

  Future<void> _claim() async {
    final value = _code.text.trim().toUpperCase();
    if (!RegExp(r'^BNC-[A-Z0-9]{4}-[A-Z0-9]{4}$').hasMatch(value)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Enter the reward ID in the shown format.'),
        ),
      );
      return;
    }
    setState(() => _busy = true);
    try {
      final result = await ref
          .read(appRepositoryProvider)
          .claimDrawEntry(value);
      final draw = _asJson(result['draw']);
      setState(() {
        _confirmation =
            'Entry claimed for ${draw.string('title', 'the draw')}.';
        _code.clear();
      });
    } on Object catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$error')));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }
}

class BusinessDeliveriesScreen extends ConsumerWidget {
  const BusinessDeliveriesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final businesses = ref.watch(_myBusinessesForDeliveryProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Delivery management')),
      body: businesses.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => ErrorState(error: error),
        data: (items) {
          if (items.isEmpty) {
            return const EmptyState(
              icon: Icons.local_shipping_outlined,
              title: 'No managed business',
              body: 'Create a business profile to manage deliveries.',
            );
          }
          return _DeliveryList(businessId: items.first.id);
        },
      ),
    );
  }
}

final _myBusinessesForDeliveryProvider = FutureProvider<List<Business>>(
  (ref) => ref.watch(appRepositoryProvider).myBusinesses(),
);

class _DeliveryList extends ConsumerWidget {
  const _DeliveryList({required this.businessId});

  final String businessId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final deliveries = ref.watch(managedDeliveriesProvider(businessId));
    return deliveries.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => ErrorState(
        error: error,
        onRetry: () => ref.invalidate(managedDeliveriesProvider(businessId)),
      ),
      data: (items) => items.isEmpty
          ? const EmptyState(
              icon: Icons.local_shipping_outlined,
              title: 'No delivery orders',
              body:
                  'Paid delivery orders will appear here for quotation and dispatch.',
            )
          : ListView.separated(
              padding: const EdgeInsets.all(18),
              itemCount: items.length,
              separatorBuilder: (_, _) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final row = items[index];
                final shipment = _asJson(row['deliveryShipment']);
                final proof = _asJson(shipment['proof']);
                final settlement = _asJson(shipment['settlement']);
                final orderId = row.string('id');
                final status = shipment.string('status');
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Order ${row.string('orderNumber', orderId)}',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        if (shipment.string('driverName').isNotEmpty)
                          Text(
                            '${shipment.string('driverName')} · '
                            '${shipment.string('vehicleNumber')}',
                          ),
                        if (proof.isNotEmpty)
                          Text(
                            'Received by ${proof.string('receiverName')} · proof secured',
                          ),
                        if (settlement.isNotEmpty)
                          Text(
                            'Settlement ${_humanize(settlement.string('status'))} · '
                            'net ₹${settlement.decimal('netPayable').toStringAsFixed(2)}',
                          ),
                        const SizedBox(height: 5),
                        Text(
                          shipment.isEmpty
                              ? 'Not yet sent to a delivery provider'
                              : '${shipment.string('provider')} · ${_humanize(shipment.string('status'))}',
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          children: [
                            if (shipment.isEmpty)
                              OutlinedButton(
                                onPressed: () => _deliveryAction(
                                  context,
                                  ref,
                                  'quote',
                                  orderId,
                                ),
                                child: const Text('Quote'),
                              ),
                            if (shipment.isEmpty ||
                                const [
                                  'QUOTED',
                                  'FAILED',
                                  'CANCELLED',
                                ].contains(status))
                              ElevatedButton(
                                onPressed: () => _deliveryAction(
                                  context,
                                  ref,
                                  'create',
                                  orderId,
                                ),
                                child: const Text('Dispatch'),
                              ),
                            if (shipment.isNotEmpty &&
                                !const [
                                  'DELIVERED',
                                  'CANCELLED',
                                  'FAILED',
                                ].contains(status))
                              TextButton(
                                onPressed: () => _deliveryAction(
                                  context,
                                  ref,
                                  'track',
                                  orderId,
                                ),
                                child: const Text('Track'),
                              ),
                            if (status == 'REQUESTED')
                              TextButton(
                                onPressed: () => _dispatch(
                                  context,
                                  ref,
                                  orderId,
                                  'ASSIGNED',
                                  shipment,
                                ),
                                child: const Text('Assign driver'),
                              ),
                            if (status == 'ASSIGNED')
                              TextButton(
                                onPressed: () => _dispatch(
                                  context,
                                  ref,
                                  orderId,
                                  'PICKED_UP',
                                  shipment,
                                ),
                                child: const Text('Picked up'),
                              ),
                            if (const [
                              'PICKED_UP',
                              'IN_TRANSIT',
                            ].contains(status)) ...[
                              TextButton(
                                onPressed: () => _dispatch(
                                  context,
                                  ref,
                                  orderId,
                                  'IN_TRANSIT',
                                  shipment,
                                ),
                                child: const Text('In transit'),
                              ),
                              ElevatedButton.icon(
                                onPressed: () =>
                                    _captureProof(context, ref, orderId),
                                icon: const Icon(Icons.camera_alt_outlined),
                                label: const Text('Proof'),
                              ),
                            ],
                            if (settlement.string('status') == 'READY')
                              ElevatedButton.icon(
                                onPressed: () =>
                                    _settle(context, ref, orderId, settlement),
                                icon: const Icon(
                                  Icons.account_balance_wallet_outlined,
                                ),
                                label: const Text('Settle'),
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }

  Future<void> _deliveryAction(
    BuildContext context,
    WidgetRef ref,
    String action,
    String orderId,
  ) async {
    try {
      final repository = ref.read(appRepositoryProvider);
      final result = switch (action) {
        'quote' => await repository.quoteDelivery(orderId),
        'create' => await repository.createDelivery(orderId),
        _ => await repository.trackDelivery(orderId),
      };
      ref.invalidate(managedDeliveriesProvider(businessId));
      if (context.mounted) {
        final message = action == 'quote'
            ? 'Delivery quote ₹${result.decimal('quotedFee').toStringAsFixed(2)}'
            : 'Delivery ${_humanize(result.string('status', action))}';
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(message)));
      }
    } on Object catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$error')));
      }
    }
  }

  Future<void> _dispatch(
    BuildContext context,
    WidgetRef ref,
    String orderId,
    String status,
    Json shipment,
  ) async {
    var payload = <String, dynamic>{'status': status};
    if (status == 'ASSIGNED' && shipment.string('driverName').isEmpty) {
      final name = TextEditingController();
      final phone = TextEditingController();
      final vehicle = TextEditingController();
      try {
        final result = await showDialog<Json>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Assign driver'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: name,
                  decoration: const InputDecoration(labelText: 'Driver name'),
                ),
                TextField(
                  controller: phone,
                  decoration: const InputDecoration(labelText: 'Phone'),
                ),
                TextField(
                  controller: vehicle,
                  decoration: const InputDecoration(labelText: 'Vehicle'),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: () => Navigator.pop(context, {
                  'driverName': name.text.trim(),
                  if (phone.text.trim().isNotEmpty)
                    'driverPhone': phone.text.trim(),
                  if (vehicle.text.trim().isNotEmpty)
                    'vehicleNumber': vehicle.text.trim(),
                }),
                child: const Text('Assign'),
              ),
            ],
          ),
        );
        if (result == null) return;
        payload = {...payload, ...result};
      } finally {
        name.dispose();
        phone.dispose();
        vehicle.dispose();
      }
    }
    try {
      await ref
          .read(appRepositoryProvider)
          .updateDeliveryDispatch(orderId, payload);
      ref.invalidate(managedDeliveriesProvider(businessId));
    } on Object catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$error')));
      }
    }
  }

  Future<void> _captureProof(
    BuildContext context,
    WidgetRef ref,
    String orderId,
  ) async {
    final image = await ImagePicker().pickImage(
      source: ImageSource.camera,
      imageQuality: 82,
      maxWidth: 1920,
    );
    if (image == null || !context.mounted) return;
    final receiver = TextEditingController();
    final notes = TextEditingController();
    try {
      final details = await showDialog<Json>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Complete delivery'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: receiver,
                decoration: const InputDecoration(labelText: 'Received by'),
              ),
              TextField(
                controller: notes,
                minLines: 2,
                maxLines: 4,
                decoration: const InputDecoration(labelText: 'Note'),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, {
                'receiverName': receiver.text.trim(),
                if (notes.text.trim().isNotEmpty) 'notes': notes.text.trim(),
              }),
              child: const Text('Save proof'),
            ),
          ],
        ),
      );
      if (details == null) return;
      final bytes = await image.readAsBytes();
      final extension = image.name.split('.').last.toLowerCase();
      final contentType = extension == 'png'
          ? 'image/png'
          : extension == 'webp'
          ? 'image/webp'
          : 'image/jpeg';
      final repository = ref.read(appRepositoryProvider);
      final objectKey = await repository.uploadPrivateImage(
        bytes: bytes,
        fileName: image.name,
        contentType: contentType,
        purpose: 'delivery_proof',
        businessId: businessId,
      );
      Position? position;
      try {
        position = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high,
            timeLimit: Duration(seconds: 8),
          ),
        );
      } on Object {
        position = null;
      }
      await repository.captureDeliveryProof(orderId, {
        ...details,
        'objectKey': objectKey,
        if (position != null) 'latitude': position.latitude,
        if (position != null) 'longitude': position.longitude,
      });
      ref.invalidate(managedDeliveriesProvider(businessId));
    } on Object catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$error')));
      }
    } finally {
      receiver.dispose();
      notes.dispose();
    }
  }

  Future<void> _settle(
    BuildContext context,
    WidgetRef ref,
    String orderId,
    Json settlement,
  ) async {
    final fee = TextEditingController(
      text: settlement.decimal('providerFee').toStringAsFixed(2),
    );
    final reference = TextEditingController();
    try {
      final payload = await showDialog<Json>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Record settlement'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: fee,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Provider fee'),
              ),
              TextField(
                controller: reference,
                decoration: const InputDecoration(
                  labelText: 'Payout reference',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, {
                'providerFee': double.tryParse(fee.text) ?? 0,
                'reference': reference.text.trim(),
              }),
              child: const Text('Mark settled'),
            ),
          ],
        ),
      );
      if (payload == null) return;
      await ref.read(appRepositoryProvider).settleDelivery(orderId, payload);
      ref.invalidate(managedDeliveriesProvider(businessId));
    } on Object catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$error')));
      }
    } finally {
      fee.dispose();
      reference.dispose();
    }
  }
}

class LocationsScreen extends ConsumerStatefulWidget {
  const LocationsScreen({super.key});

  @override
  ConsumerState<LocationsScreen> createState() => _LocationsScreenState();
}

class _LocationsScreenState extends ConsumerState<LocationsScreen> {
  bool _locating = false;

  Future<void> _useCurrentLocation() async {
    setState(() => _locating = true);
    try {
      if (!await Geolocator.isLocationServiceEnabled()) {
        throw StateError('Turn on device location and try again.');
      }
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        throw StateError(
          'Location permission is required to search around you.',
        );
      }
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.medium,
          timeLimit: Duration(seconds: 12),
        ),
      );
      await ref
          .read(appSettingsProvider.notifier)
          .setLocation(
            city: currentAreaLocation,
            latitude: position.latitude,
            longitude: position.longitude,
          );
      ref.invalidate(featuredBusinessesProvider);
      ref.invalidate(offersProvider);
      if (mounted) context.push('/search');
    } on Object catch (error) {
      if (!mounted) return;
      final message = error is StateError
          ? error.message
          : 'Your current location could not be read.';
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(message.toString())));
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  Future<void> _selectCity(String city) async {
    final coordinates = bncCityCoordinates[city];
    if (coordinates == null) {
      if (mounted) {
        context.push('/search?location=${Uri.encodeQueryComponent(city)}');
      }
      return;
    }
    await ref
        .read(appSettingsProvider.notifier)
        .setLocation(
          city: city,
          latitude: coordinates.$1,
          longitude: coordinates.$2,
        );
    ref.invalidate(featuredBusinessesProvider);
    ref.invalidate(offersProvider);
    if (mounted) context.push('/search');
  }

  @override
  Widget build(BuildContext context) {
    final cities = ref.watch(liveCitiesProvider);
    final activeLocation = ref.watch(appSettingsProvider).city;
    return Scaffold(
      appBar: AppBar(title: const Text('Locations')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(liveCitiesProvider);
          await ref.read(liveCitiesProvider.future);
        },
        child: cities.when(
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
                onRetry: () => ref.invalidate(liveCitiesProvider),
              ),
            ],
          ),
          data: (items) => ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(18, 10, 18, 30),
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: BncColors.brand,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Search around you',
                      style: Theme.of(
                        context,
                      ).textTheme.headlineSmall?.copyWith(color: Colors.white),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Use your device position for a real nearby radius, or choose a Kerala city.',
                      style: TextStyle(color: Color(0xFFDDE7FF)),
                    ),
                    const SizedBox(height: 16),
                    FilledButton.icon(
                      style: FilledButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: BncColors.deepBlue,
                      ),
                      onPressed: _locating ? null : _useCurrentLocation,
                      icon: _locating
                          ? const SizedBox.square(
                              dimension: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.my_location_rounded),
                      label: Text(
                        _locating
                            ? 'Finding your location…'
                            : activeLocation == currentAreaLocation
                            ? 'Current location active'
                            : 'Use current location',
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'Active Kerala cities',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 10),
              if (items.isEmpty)
                const SizedBox(
                  height: 360,
                  child: EmptyState(
                    icon: Icons.location_city_outlined,
                    title: 'No active locations',
                    body:
                        'Cities will appear when live businesses publish active locations.',
                  ),
                )
              else
                for (var index = 0; index < items.length; index++) ...[
                  Builder(
                    builder: (context) {
                      final city = items[index];
                      final name = city.string('city');
                      final district = city.string('district');
                      final count = city.integer('businessCount');
                      final selected =
                          activeLocation.toLowerCase() == name.toLowerCase();
                      return Card(
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: selected
                                ? BncColors.brand
                                : const Color(0xFFE4EDFF),
                            foregroundColor: selected
                                ? Colors.white
                                : BncColors.brand,
                            child: Icon(
                              selected
                                  ? Icons.check_rounded
                                  : Icons.location_on_outlined,
                            ),
                          ),
                          title: Text(name),
                          subtitle: Text(
                            [
                              if (district.isNotEmpty) district,
                              '$count active ${count == 1 ? 'business' : 'businesses'}',
                            ].join(' · '),
                          ),
                          trailing: const Icon(Icons.arrow_forward_rounded),
                          onTap: () => _selectCity(name),
                        ),
                      );
                    },
                  ),
                  if (index != items.length - 1) const SizedBox(height: 10),
                ],
            ],
          ),
        ),
      ),
    );
  }
}

Json _asJson(dynamic value) => value is Map
    ? value.map((key, item) => MapEntry('$key', item))
    : <String, dynamic>{};

String _humanize(String value) => value
    .toLowerCase()
    .split('_')
    .where((part) => part.isNotEmpty)
    .map((part) => '${part[0].toUpperCase()}${part.substring(1)}')
    .join(' ');

String _formatDateTime(String value) {
  final parsed = DateTime.tryParse(value)?.toLocal();
  if (parsed == null) return value;
  final hour = parsed.hour == 0
      ? 12
      : parsed.hour > 12
      ? parsed.hour - 12
      : parsed.hour;
  final minute = parsed.minute.toString().padLeft(2, '0');
  final period = parsed.hour >= 12 ? 'PM' : 'AM';
  return '${parsed.day}/${parsed.month}/${parsed.year} · $hour:$minute $period';
}
