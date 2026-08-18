import 'package:bnc_mobile/core/data/app_repository.dart';
import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/core/state/app_state.dart';
import 'package:bnc_mobile/core/storage/app_preferences.dart';
import 'package:bnc_mobile/design_system/bnc_theme.dart';
import 'package:bnc_mobile/design_system/components.dart';
import 'package:bnc_mobile/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

final accountCitiesProvider = FutureProvider<List<Json>>(
  (ref) => ref.watch(appRepositoryProvider).cities(),
);

class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionProvider);
    final settings = ref.watch(appSettingsProvider);
    final strings = AppLocalizations.of(context);
    if (!session.authenticated) {
      return Scaffold(
        appBar: AppBar(title: Text(strings.account)),
        body: EmptyState(
          icon: Icons.account_circle_outlined,
          title: 'Your BNC account',
          body:
              'Sign in to save businesses, track enquiries, manage orders and control your privacy.',
          action: () => context.push(
            '/login?returnTo=${Uri.encodeQueryComponent('/account')}',
          ),
          actionLabel: strings.login,
        ),
      );
    }
    final user = session.user!;
    return Scaffold(
      appBar: AppBar(
        title: Text(strings.account),
        actions: [
          IconButton(
            onPressed: () => context.push('/notifications'),
            icon: const Icon(Icons.notifications_none_rounded),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: BncColors.brand,
              borderRadius: BorderRadius.circular(26),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 33,
                  backgroundColor: Colors.white,
                  child: Text(
                    initials(user.displayName),
                    style: Theme.of(
                      context,
                    ).textTheme.titleLarge?.copyWith(color: BncColors.deepBlue),
                  ),
                ),
                const SizedBox(width: 15),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user.displayName,
                        style: Theme.of(
                          context,
                        ).textTheme.titleLarge?.copyWith(color: Colors.white),
                      ),
                      Text(
                        user.phone.isEmpty ? user.email : user.phone,
                        style: Theme.of(
                          context,
                        ).textTheme.bodyMedium?.copyWith(color: Colors.white70),
                      ),
                      const SizedBox(height: 8),
                      const StatusBadge(
                        label: 'Customer account',
                        color: Color(0x4435AE79),
                        icon: Icons.lock_outline_rounded,
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => context.push('/account/profile'),
                  style: IconButton.styleFrom(
                    backgroundColor: Colors.white.withValues(alpha: .12),
                    foregroundColor: Colors.white,
                  ),
                  icon: const Icon(Icons.edit_outlined),
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),
          Text('Your activity', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Card(
            child: Column(
              children: [
                SettingsTile(
                  icon: Icons.request_quote_outlined,
                  title: 'My enquiries',
                  subtitle: 'Matches, quotes and responses',
                  onTap: () => context.push('/account/enquiries'),
                ),
                const Divider(indent: 64),
                SettingsTile(
                  icon: Icons.event_available_outlined,
                  title: 'Appointments',
                  subtitle: 'Upcoming bookings and appointment history',
                  onTap: () => context.push('/bookings'),
                ),
                const Divider(indent: 64),
                SettingsTile(
                  icon: Icons.work_outline_rounded,
                  title: 'Job applications',
                  subtitle: 'Submitted local roles and their progress',
                  onTap: () => context.push('/account/job-applications'),
                ),
                const Divider(indent: 64),
                SettingsTile(
                  icon: Icons.shopping_bag_outlined,
                  title: strings.orders,
                  subtitle: 'Track purchases, returns and payments',
                  onTap: () => context.push('/orders'),
                ),
                const Divider(indent: 64),
                SettingsTile(
                  icon: Icons.star_outline_rounded,
                  title: 'My reviews',
                  subtitle: 'Published feedback and helpful votes',
                  onTap: () => context.push('/account/reviews'),
                ),
                const Divider(indent: 64),
                SettingsTile(
                  icon: Icons.history_rounded,
                  title: 'Search history',
                  subtitle: 'Recent searches and viewed businesses',
                  onTap: () => context.push('/account/history'),
                ),
                const Divider(indent: 64),
                SettingsTile(
                  icon: Icons.location_on_outlined,
                  title: 'Saved addresses',
                  subtitle: 'Delivery and service locations',
                  onTap: () => context.push('/account/addresses'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),
          Text('Preferences', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Card(
            child: Column(
              children: [
                SettingsTile(
                  icon: Icons.tune_rounded,
                  title: 'App preferences',
                  subtitle:
                      '${settings.locale.languageCode == 'ml' ? 'മലയാളം' : 'English'}'
                      ' · ${settings.city} · ${settings.searchRadiusKm} km',
                  onTap: () => context.push('/account/settings'),
                ),
                const Divider(indent: 64),
                SettingsTile(
                  icon: Icons.notifications_none_rounded,
                  title: strings.notifications,
                  subtitle: 'Delivery channels and useful updates',
                  onTap: () => context.push('/notifications'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),
          Text(
            'Trust & support',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Card(
            child: Column(
              children: [
                SettingsTile(
                  icon: Icons.shield_outlined,
                  title: strings.privacy,
                  subtitle: 'Sessions, consent, blocks, export and deletion',
                  onTap: () => context.push('/account/privacy'),
                ),
                const Divider(indent: 64),
                SettingsTile(
                  icon: Icons.block_outlined,
                  title: 'Blocked businesses',
                  subtitle: 'Control who can contact or match with you',
                  onTap: () => context.push('/account/blocked'),
                ),
                const Divider(indent: 64),
                SettingsTile(
                  icon: Icons.support_agent_rounded,
                  title: 'Support requests',
                  subtitle: 'Track requests sent to BNC',
                  onTap: () => context.push('/account/support'),
                ),
                const Divider(indent: 64),
                SettingsTile(
                  icon: Icons.help_outline_rounded,
                  title: 'Help centre',
                  subtitle: 'Get help with BNC',
                  onTap: () => context.push('/help'),
                ),
                const Divider(indent: 64),
                SettingsTile(
                  icon: Icons.info_outline_rounded,
                  title: 'About & legal',
                  subtitle: 'About BNC, privacy, terms and refunds',
                  onTap: () => _showLegalLinks(context),
                ),
                const Divider(indent: 64),
                SettingsTile(
                  icon: Icons.logout_rounded,
                  title: strings.logout,
                  onTap: () async {
                    await ref.read(sessionProvider.notifier).logout();
                    if (context.mounted) context.go('/home');
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showLegalLinks(BuildContext context) =>
      showModalBottomSheet<void>(
        context: context,
        showDragHandle: true,
        builder: (context) => SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 4, 12, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ListTile(
                  leading: const Icon(Icons.info_outline_rounded),
                  title: const Text('About BNC'),
                  onTap: () {
                    Navigator.pop(context);
                    context.push('/about');
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.privacy_tip_outlined),
                  title: const Text('Privacy policy'),
                  onTap: () {
                    Navigator.pop(context);
                    context.push('/privacy');
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.gavel_outlined),
                  title: const Text('Terms of use'),
                  onTap: () {
                    Navigator.pop(context);
                    context.push('/terms');
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.currency_exchange_outlined),
                  title: const Text('Refunds & cancellations'),
                  onTap: () {
                    Navigator.pop(context);
                    context.push('/refunds');
                  },
                ),
              ],
            ),
          ),
        ),
      );
}

class AccountSettingsScreen extends ConsumerStatefulWidget {
  const AccountSettingsScreen({super.key});

  @override
  ConsumerState<AccountSettingsScreen> createState() =>
      _AccountSettingsScreenState();
}

class _AccountSettingsScreenState extends ConsumerState<AccountSettingsScreen> {
  late String _language;
  late String _city;
  late int _radiusKm;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final settings = ref.read(appSettingsProvider);
    _language = settings.locale.languageCode;
    _city = settings.city;
    _radiusKm = const {3, 5, 10, 25}.contains(settings.searchRadiusKm)
        ? settings.searchRadiusKm
        : 5;
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      final controller = ref.read(appSettingsProvider.notifier);
      final current = ref.read(appSettingsProvider);
      await controller.setLocale(Locale(_language));
      final coordinates = bncCityCoordinates[_city];
      await controller.setLocation(
        city: _city,
        latitude: coordinates?.$1 ?? current.latitude,
        longitude: coordinates?.$2 ?? current.longitude,
      );
      await controller.setSearchRadius(_radiusKm);
      ref.invalidate(featuredBusinessesProvider);
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('App preferences saved.')));
      Navigator.pop(context);
    } on Object catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$error')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cityState = ref.watch(accountCitiesProvider);
    final liveCities =
        cityState.valueOrNull
            ?.map((item) => item.string('city'))
            .where((city) => city.isNotEmpty)
            .toSet() ??
        <String>{};
    final cities = {_city, ...liveCities}.toList()..sort();
    return Scaffold(
      appBar: AppBar(title: const Text('App preferences')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(18, 10, 18, 30),
        children: [
          Text(
            'Discovery defaults',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 8),
          const Text(
            'These choices control the language and starting area used across customer discovery.',
          ),
          const SizedBox(height: 22),
          DropdownButtonFormField<String>(
            initialValue: _language,
            decoration: const InputDecoration(
              labelText: 'Preferred language',
              prefixIcon: Icon(Icons.translate_rounded),
            ),
            items: const [
              DropdownMenuItem(value: 'en', child: Text('English')),
              DropdownMenuItem(value: 'ml', child: Text('മലയാളം')),
            ],
            onChanged: _saving
                ? null
                : (value) => setState(() => _language = value ?? _language),
          ),
          const SizedBox(height: 14),
          DropdownButtonFormField<String>(
            initialValue: _city,
            decoration: InputDecoration(
              labelText: 'Default city',
              prefixIcon: const Icon(Icons.location_city_outlined),
              suffixIcon: cityState.isLoading
                  ? const Padding(
                      padding: EdgeInsets.all(14),
                      child: SizedBox.square(
                        dimension: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    )
                  : null,
            ),
            items: [
              for (final city in cities)
                DropdownMenuItem(value: city, child: Text(city)),
            ],
            onChanged: _saving
                ? null
                : (value) => setState(() => _city = value ?? _city),
          ),
          if (cityState.hasError)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                'Live city refresh is unavailable. Your current city can still be saved.',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
          const SizedBox(height: 22),
          Text(
            'Default search radius',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          SegmentedButton<int>(
            segments: const [
              ButtonSegment(value: 3, label: Text('3 km')),
              ButtonSegment(value: 5, label: Text('5 km')),
              ButtonSegment(value: 10, label: Text('10 km')),
              ButtonSegment(value: 25, label: Text('25 km')),
            ],
            selected: {_radiusKm},
            onSelectionChanged: _saving
                ? null
                : (value) => setState(() => _radiusKm = value.first),
          ),
          const SizedBox(height: 18),
          Card(
            color: BncColors.sky,
            child: ListTile(
              leading: const Icon(
                Icons.notifications_none_rounded,
                color: BncColors.brand,
              ),
              title: const Text('Notification preferences'),
              subtitle: const Text(
                'Choose customer messages, order updates, reminders and offers.',
              ),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: () => context.push('/notifications'),
            ),
          ),
          const SizedBox(height: 22),
          ElevatedButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox.square(
                    dimension: 20,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  )
                : const Text('Save preferences'),
          ),
        ],
      ),
    );
  }
}

class ProfileEditScreen extends ConsumerStatefulWidget {
  const ProfileEditScreen({super.key});

  @override
  ConsumerState<ProfileEditScreen> createState() => _ProfileEditScreenState();
}

class _ProfileEditScreenState extends ConsumerState<ProfileEditScreen> {
  late final TextEditingController _nameController;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(
      text: ref.read(sessionProvider).user?.displayName,
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_nameController.text.trim().length < 2) return;
    setState(() => _busy = true);
    try {
      final user = await ref.read(appRepositoryProvider).updateProfile({
        'displayName': _nameController.text.trim(),
      });
      await ref.read(sessionProvider.notifier).updateUser(user);
      if (mounted) Navigator.pop(context);
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
    final user = ref.watch(sessionProvider).user;
    return Scaffold(
      appBar: AppBar(title: const Text('Edit profile')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Center(
            child: CircleAvatar(
              radius: 46,
              backgroundColor: BncColors.brand.withValues(alpha: .1),
              child: Text(
                initials(_nameController.text),
                style: Theme.of(
                  context,
                ).textTheme.headlineMedium?.copyWith(color: BncColors.brand),
              ),
            ),
          ),
          const SizedBox(height: 30),
          TextField(
            controller: _nameController,
            textCapitalization: TextCapitalization.words,
            maxLength: 100,
            decoration: const InputDecoration(
              labelText: 'Display name',
              prefixIcon: Icon(Icons.person_outline_rounded),
              counterText: '',
            ),
          ),
          const SizedBox(height: 13),
          TextFormField(
            enabled: false,
            initialValue: user?.phone,
            decoration: const InputDecoration(
              labelText: 'Verified mobile number',
              prefixIcon: Icon(Icons.verified_user_outlined),
            ),
          ),
          const SizedBox(height: 13),
          TextFormField(
            enabled: false,
            initialValue: user?.email,
            decoration: const InputDecoration(
              labelText: 'Email',
              prefixIcon: Icon(Icons.email_outlined),
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _busy ? null : _save,
              child: _busy
                  ? const SizedBox.square(
                      dimension: 20,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : const Text('Save changes'),
            ),
          ),
        ],
      ),
    );
  }
}

final historyProvider = FutureProvider.autoDispose<List<SearchHistoryEntry>>(
  (ref) => ref.watch(appRepositoryProvider).searchHistory(),
);
final recentBusinessesProvider = FutureProvider<List<Business>>(
  (ref) => ref.watch(appRepositoryProvider).recentBusinesses(),
);

class HistoryScreen extends ConsumerWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(historyProvider);
    final recent = ref.watch(recentBusinessesProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Search history'),
        actions: [
          TextButton(
            onPressed: () async {
              await ref.read(appRepositoryProvider).clearSearchHistory();
              ref.invalidate(historyProvider);
            },
            child: const Text('Clear'),
          ),
        ],
      ),
      body: state.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => ErrorState(error: error),
        data: (items) => items.isEmpty && (recent.valueOrNull?.isEmpty ?? true)
            ? const EmptyState(
                icon: Icons.history_rounded,
                title: 'No recent activity',
                body:
                    'Searches and business profiles you view will be easy to revisit here.',
              )
            : ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 30),
                children: [
                  if (items.isNotEmpty) ...[
                    Text(
                      'Recent searches',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    SizedBox(
                      height: 112,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: items.length,
                        separatorBuilder: (_, index) =>
                            const SizedBox(width: 10),
                        itemBuilder: (context, index) => SizedBox(
                          width: 280,
                          child: Card(
                            child: InkWell(
                              onTap: () => context.go(
                                items[index].destination.toString(),
                              ),
                              borderRadius: BorderRadius.circular(22),
                              child: Padding(
                                padding: const EdgeInsets.all(14),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 44,
                                      height: 44,
                                      decoration: BoxDecoration(
                                        color: BncColors.sky,
                                        borderRadius: BorderRadius.circular(14),
                                      ),
                                      child: const Icon(
                                        Icons.history_rounded,
                                        color: BncColors.brand,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            items[index].query,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: Theme.of(
                                              context,
                                            ).textTheme.titleSmall,
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            [
                                              if (items[index]
                                                  .filters
                                                  .location
                                                  .isNotEmpty)
                                                items[index].filters.location,
                                              '${items[index].resultCount} '
                                                  '${items[index].resultCount == 1 ? 'result' : 'results'}',
                                            ].join(' · '),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: Theme.of(context)
                                                .textTheme
                                                .bodySmall
                                                ?.copyWith(
                                                  color: BncColors.muted,
                                                ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const Icon(
                                      Icons.arrow_forward_rounded,
                                      color: BncColors.brand,
                                      size: 18,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 22),
                  ],
                  Text(
                    'Recently viewed',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  recent.when(
                    loading: () => const BncSkeleton(height: 92),
                    error: (error, stack) => ErrorState(error: error),
                    data: (businesses) => businesses.isEmpty
                        ? const Card(
                            child: ListTile(
                              leading: Icon(Icons.storefront_outlined),
                              title: Text('No recently viewed businesses'),
                            ),
                          )
                        : SizedBox(
                            height: 132,
                            child: ListView.separated(
                              scrollDirection: Axis.horizontal,
                              itemCount: businesses.length,
                              separatorBuilder: (_, index) =>
                                  const SizedBox(width: 10),
                              itemBuilder: (context, index) => BusinessCard(
                                business: businesses[index],
                                compact: true,
                                width: 330,
                              ),
                            ),
                          ),
                  ),
                ],
              ),
      ),
    );
  }
}

final addressesProvider = FutureProvider<List<Json>>(
  (ref) => ref.watch(appRepositoryProvider).addresses(),
);

class AddressesScreen extends ConsumerWidget {
  const AddressesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(addressesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Saved addresses')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _editAddress(context, ref),
        icon: const Icon(Icons.add_location_alt_outlined),
        label: const Text('Add address'),
      ),
      body: state.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => ErrorState(error: error),
        data: (items) => items.isEmpty
            ? EmptyState(
                icon: Icons.location_on_outlined,
                title: 'No saved addresses',
                body:
                    'Save a delivery or service address for quicker checkout.',
                action: () => _editAddress(context, ref),
                actionLabel: 'Add address',
              )
            : ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                itemCount: items.length,
                separatorBuilder: (_, index) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final item = items[index];
                  return Card(
                    child: ListTile(
                      minTileHeight: 88,
                      leading: Icon(
                        item.boolean('isDefault')
                            ? Icons.home_rounded
                            : Icons.location_on_outlined,
                        color: BncColors.brand,
                      ),
                      title: Row(
                        children: [
                          Text(item.string('label')),
                          if (item.boolean('isDefault')) ...[
                            const SizedBox(width: 8),
                            const StatusBadge(
                              label: 'Default',
                              color: BncColors.verified,
                            ),
                          ],
                        ],
                      ),
                      subtitle: Text(
                        '${item.string('addressLine1')}, '
                        '${item.string('locality')}, ${item.string('city', 'Kochi')} '
                        '${item.string('postalCode')}',
                      ),
                      trailing: PopupMenuButton<String>(
                        onSelected: (value) async {
                          if (value == 'edit') {
                            await _editAddress(context, ref, existing: item);
                          } else if (value == 'delete') {
                            await ref
                                .read(appRepositoryProvider)
                                .removeAddress(item.string('id'));
                            ref.invalidate(addressesProvider);
                          }
                        },
                        itemBuilder: (context) => const [
                          PopupMenuItem(value: 'edit', child: Text('Edit')),
                          PopupMenuItem(value: 'delete', child: Text('Delete')),
                        ],
                      ),
                    ),
                  );
                },
              ),
      ),
    );
  }

  Future<void> _editAddress(
    BuildContext context,
    WidgetRef ref, {
    Json? existing,
  }) async {
    final formKey = GlobalKey<FormState>();
    final recipient = TextEditingController(
      text:
          existing?.string('recipient') ??
          ref.read(sessionProvider).user?.displayName,
    );
    final label = TextEditingController(
      text: existing?.string('label', 'Home') ?? 'Home',
    );
    final line = TextEditingController(text: existing?.string('addressLine1'));
    final locality = TextEditingController(text: existing?.string('locality'));
    final city = TextEditingController(
      text: existing?.string('city') ?? ref.read(appSettingsProvider).city,
    );
    final postalCode = TextEditingController(
      text: existing?.string('postalCode'),
    );
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (context) => Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          4,
          20,
          MediaQuery.viewInsetsOf(context).bottom + 20,
        ),
        child: Form(
          key: formKey,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  existing == null ? 'Add an address' : 'Edit address',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: label,
                  maxLength: 40,
                  decoration: const InputDecoration(
                    labelText: 'Label',
                    counterText: '',
                  ),
                  validator: (value) {
                    final length = value?.trim().length ?? 0;
                    if (length < 2) return 'Required';
                    if (length > 40) return 'Use no more than 40 characters';
                    return null;
                  },
                ),
                const SizedBox(height: 10),
                TextFormField(
                  controller: recipient,
                  maxLength: 100,
                  decoration: const InputDecoration(
                    labelText: 'Recipient',
                    counterText: '',
                  ),
                  validator: (value) {
                    final length = value?.trim().length ?? 0;
                    if (length < 2) return 'Required';
                    if (length > 100) return 'Use no more than 100 characters';
                    return null;
                  },
                ),
                const SizedBox(height: 10),
                TextFormField(
                  controller: line,
                  maxLength: 180,
                  decoration: const InputDecoration(
                    labelText: 'Address line',
                    counterText: '',
                  ),
                  validator: (value) {
                    final length = value?.trim().length ?? 0;
                    if (length < 3) return 'Required';
                    if (length > 180) return 'Use no more than 180 characters';
                    return null;
                  },
                ),
                const SizedBox(height: 10),
                TextFormField(
                  controller: locality,
                  maxLength: 100,
                  decoration: const InputDecoration(
                    labelText: 'Locality',
                    counterText: '',
                  ),
                  validator: (value) {
                    final length = value?.trim().length ?? 0;
                    if (length < 2) return 'Required';
                    if (length > 100) return 'Use no more than 100 characters';
                    return null;
                  },
                ),
                const SizedBox(height: 10),
                TextFormField(
                  controller: city,
                  maxLength: 100,
                  decoration: const InputDecoration(
                    labelText: 'City',
                    counterText: '',
                  ),
                  validator: (value) {
                    final length = value?.trim().length ?? 0;
                    if (length < 2) return 'Required';
                    if (length > 100) return 'Use no more than 100 characters';
                    return null;
                  },
                ),
                const SizedBox(height: 10),
                TextFormField(
                  controller: postalCode,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  decoration: const InputDecoration(
                    labelText: 'PIN code',
                    counterText: '',
                  ),
                  validator: (value) =>
                      RegExp(r'^[1-9]\d{5}$').hasMatch(value ?? '')
                      ? null
                      : 'Enter a valid 6-digit PIN',
                ),
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () async {
                      if (!formKey.currentState!.validate()) return;
                      final payload = <String, dynamic>{
                        'label': label.text.trim(),
                        'recipient': recipient.text.trim(),
                        'addressLine1': line.text.trim(),
                        'locality': locality.text.trim(),
                        'city': city.text.trim(),
                        'state': 'Kerala',
                        'postalCode': postalCode.text.trim(),
                        'isDefault': existing?.boolean('isDefault') ?? false,
                      };
                      if (existing == null) {
                        await ref
                            .read(appRepositoryProvider)
                            .addAddress(payload);
                      } else {
                        await ref
                            .read(appRepositoryProvider)
                            .updateAddress(existing.string('id'), payload);
                      }
                      if (context.mounted) Navigator.pop(context, true);
                    },
                    child: Text(
                      existing == null ? 'Save address' : 'Update address',
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
    recipient.dispose();
    label.dispose();
    line.dispose();
    locality.dispose();
    city.dispose();
    postalCode.dispose();
    if (saved == true) ref.invalidate(addressesProvider);
  }
}

final sessionsProvider = FutureProvider<List<Json>>(
  (ref) => ref.watch(appRepositoryProvider).sessions(),
);
final consentsProvider = FutureProvider<List<Json>>(
  (ref) => ref.watch(appRepositoryProvider).consents(),
);
final blockedProvider = FutureProvider<List<Business>>(
  (ref) => ref.watch(appRepositoryProvider).blockedBusinesses(),
);

class PrivacyScreen extends ConsumerWidget {
  const PrivacyScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessions = ref.watch(sessionsProvider);
    final consents = ref.watch(consentsProvider);
    final blocked = ref.watch(blockedProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Privacy & security')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 30),
        children: [
          Card(
            color: BncColors.sky,
            child: const Padding(
              padding: EdgeInsets.all(17),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.shield_rounded,
                    color: BncColors.verified,
                    size: 27,
                  ),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'BNC encrypts enquiry contact data and checks consent before releasing details to an accepted business match.',
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Active sessions',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          _AsyncPrivacyList(
            value: sessions,
            empty: 'No active sessions found',
            builder: (item) => ListTile(
              leading: const Icon(Icons.phone_iphone_rounded),
              title: Text(item.string('userAgent', 'BNC mobile')),
              subtitle: Text(
                '${item.string('createdAt')} · ${item.string('lastUsedAt')}',
              ),
              trailing: item.boolean('current')
                  ? const StatusBadge(
                      label: 'Current',
                      color: BncColors.verified,
                    )
                  : null,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Consent records',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          _AsyncPrivacyList(
            value: consents,
            empty: 'No consent records',
            builder: (item) => ListTile(
              leading: const Icon(Icons.fact_check_outlined),
              title: Text(item.string('type').replaceAll('_', ' ')),
              subtitle: Text(item.string('createdAt')),
              trailing: Icon(
                item.boolean('granted')
                    ? Icons.check_circle_rounded
                    : Icons.cancel_rounded,
                color: item.boolean('granted')
                    ? BncColors.verified
                    : BncColors.muted,
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Blocked businesses',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          blocked.when(
            loading: () => const BncSkeleton(height: 72),
            error: (error, stack) => ErrorState(error: error),
            data: (items) => Card(
              child: items.isEmpty
                  ? const ListTile(
                      leading: Icon(Icons.block_outlined),
                      title: Text('No blocked businesses'),
                    )
                  : Column(
                      children: items
                          .map(
                            (business) => ListTile(
                              leading: const Icon(Icons.block_rounded),
                              title: Text(business.name),
                            ),
                          )
                          .toList(),
                    ),
            ),
          ),
          const SizedBox(height: 24),
          Text('Your data', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Card(
            child: Column(
              children: [
                SettingsTile(
                  icon: Icons.download_outlined,
                  title: 'Export my data',
                  subtitle: 'Prepare a secure copy of your BNC information',
                  onTap: () async {
                    final result = await ref
                        .read(appRepositoryProvider)
                        .requestDataExport();
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            result.string(
                              'message',
                              'Your export is being prepared.',
                            ),
                          ),
                        ),
                      );
                    }
                  },
                ),
                const Divider(indent: 64),
                SettingsTile(
                  icon: Icons.delete_forever_outlined,
                  title: 'Delete account',
                  subtitle: 'Permanently close your BNC account',
                  danger: true,
                  onTap: () => _deleteAccount(context, ref),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _deleteAccount(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        icon: Icon(
          Icons.warning_amber_rounded,
          color: Theme.of(context).colorScheme.error,
          size: 38,
        ),
        title: const Text('Delete your account?'),
        content: const Text(
          'This is permanent. Legal payment or audit records may be retained only where required, while personal account access is removed.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Keep account'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete permanently'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    await ref.read(appRepositoryProvider).deleteAccount();
    await ref.read(sessionProvider.notifier).logout();
    if (context.mounted) context.go('/home');
  }
}

class _AsyncPrivacyList extends StatelessWidget {
  const _AsyncPrivacyList({
    required this.value,
    required this.empty,
    required this.builder,
  });

  final AsyncValue<List<Json>> value;
  final String empty;
  final Widget Function(Json item) builder;

  @override
  Widget build(BuildContext context) {
    return value.when(
      loading: () => const BncSkeleton(height: 72),
      error: (error, stack) => ErrorState(error: error),
      data: (items) => Card(
        child: items.isEmpty
            ? ListTile(title: Text(empty))
            : Column(children: items.map(builder).toList()),
      ),
    );
  }
}
