import 'package:bnc_mobile/core/data/app_repository.dart';
import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/core/state/app_state.dart';
import 'package:bnc_mobile/design_system/bnc_theme.dart';
import 'package:bnc_mobile/design_system/components.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(notificationsProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          TextButton(
            onPressed: () async {
              await ref.read(appRepositoryProvider).markAllNotificationsRead();
              ref.invalidate(notificationsProvider);
            },
            child: const Text('Read all'),
          ),
          IconButton(
            onPressed: () => _preferences(context),
            icon: const Icon(Icons.tune_rounded),
          ),
        ],
      ),
      body: state.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => ErrorState(error: error),
        data: (items) => items.isEmpty
            ? const EmptyState(
                icon: Icons.notifications_none_rounded,
                title: 'All quiet for now',
                body: 'Useful enquiry, order and account updates appear here.',
              )
            : ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 30),
                itemCount: items.length,
                separatorBuilder: (_, index) => const SizedBox(height: 8),
                itemBuilder: (context, index) =>
                    _NotificationCard(notification: items[index]),
              ),
      ),
    );
  }

  Future<void> _preferences(BuildContext context) async {
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) => const _NotificationPreferences(),
    );
  }
}

class _NotificationCard extends ConsumerWidget {
  const _NotificationCard({required this.notification});

  final AppNotification notification;

  IconData get icon => switch (notification.type) {
    'ORDER_UPDATE' => Icons.local_shipping_outlined,
    'CUSTOMER_RESPONSE' => Icons.chat_bubble_outline_rounded,
    'REVIEW_REPLY' => Icons.rate_review_outlined,
    'PAYMENT_CONFIRMATION' => Icons.receipt_long_outlined,
    'BOOKING_REMINDER' => Icons.event_available_outlined,
    'NEARBY_OFFER' => Icons.local_offer_outlined,
    'WEEKLY_DRAW' => Icons.emoji_events_outlined,
    'SUPPORT_UPDATE' => Icons.support_agent_outlined,
    _ => Icons.notifications_none_rounded,
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      color: notification.read ? null : BncColors.brand.withValues(alpha: .045),
      child: ListTile(
        onTap: () async {
          if (!notification.read) {
            await ref
                .read(appRepositoryProvider)
                .markNotificationRead(notification.id);
            ref.invalidate(notificationsProvider);
          }
          final destination = notification.destination;
          if (destination != null && context.mounted) {
            context.push(destination);
          }
        },
        minTileHeight: 84,
        leading: Stack(
          children: [
            Container(
              width: 45,
              height: 45,
              decoration: BoxDecoration(
                color: BncColors.brand.withValues(alpha: .09),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: BncColors.brand),
            ),
            if (!notification.read)
              const Positioned(
                right: 0,
                top: 0,
                child: CircleAvatar(
                  radius: 5,
                  backgroundColor: BncColors.brand,
                ),
              ),
          ],
        ),
        title: Text(
          notification.title,
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
            fontWeight: notification.read ? FontWeight.w600 : FontWeight.w800,
          ),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Text(
            '${notification.body}\n${notification.createdAt}',
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        isThreeLine: true,
      ),
    );
  }
}

class _NotificationPreferences extends ConsumerStatefulWidget {
  const _NotificationPreferences();

  @override
  ConsumerState<_NotificationPreferences> createState() =>
      _NotificationPreferencesState();
}

class _NotificationPreferencesState
    extends ConsumerState<_NotificationPreferences> {
  bool loading = true;
  bool saving = false;
  bool responses = true;
  bool orders = true;
  bool offers = false;
  bool bookingReminders = true;
  bool reviewReplies = true;
  bool weeklyDraws = true;
  String? error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final preferences = await ref
          .read(appRepositoryProvider)
          .notificationPreferences();
      bool valueFor(String type, bool fallback) {
        final matches = preferences.where(
          (preference) => preference['type'] == type,
        );
        return matches.isEmpty
            ? fallback
            : matches.first['inApp'] as bool? ?? fallback;
      }

      if (!mounted) return;
      setState(() {
        responses = valueFor('CUSTOMER_RESPONSE', true);
        orders = valueFor('ORDER_UPDATE', true);
        offers = valueFor('NEARBY_OFFER', false);
        bookingReminders = valueFor('BOOKING_REMINDER', true);
        reviewReplies = valueFor('REVIEW_REPLY', true);
        weeklyDraws = valueFor('WEEKLY_DRAW', true);
        loading = false;
      });
    } on Object catch (exception) {
      if (!mounted) return;
      setState(() {
        loading = false;
        error = '$exception';
      });
    }
  }

  Future<void> _save() async {
    setState(() {
      saving = true;
      error = null;
    });
    try {
      final repository = ref.read(appRepositoryProvider);
      await Future.wait([
        repository.updateNotificationPreference(
          'CUSTOMER_RESPONSE',
          inApp: responses,
          push: responses,
        ),
        repository.updateNotificationPreference(
          'ORDER_UPDATE',
          inApp: orders,
          push: orders,
        ),
        repository.updateNotificationPreference(
          'NEARBY_OFFER',
          inApp: offers,
          push: offers,
        ),
        repository.updateNotificationPreference(
          'BOOKING_REMINDER',
          inApp: bookingReminders,
          push: bookingReminders,
        ),
        repository.updateNotificationPreference(
          'REVIEW_REPLY',
          inApp: reviewReplies,
          push: reviewReplies,
        ),
        repository.updateNotificationPreference(
          'WEEKLY_DRAW',
          inApp: weeklyDraws,
          push: weeklyDraws,
        ),
      ]);
      if (mounted) Navigator.pop(context);
    } on Object catch (exception) {
      if (!mounted) return;
      setState(() {
        saving = false;
        error = '$exception';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Notification preferences',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 8),
            const Text(
              'Critical security and payment messages cannot be disabled.',
            ),
            const SizedBox(height: 12),
            if (loading)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 32),
                child: Center(child: CircularProgressIndicator()),
              ),
            if (!loading) ...[
              SwitchListTile(
                value: responses,
                onChanged: saving
                    ? null
                    : (value) => setState(() => responses = value),
                title: const Text('Enquiries and messages'),
                subtitle: const Text(
                  'Replies from businesses and appointment status changes.',
                ),
              ),
              SwitchListTile(
                value: orders,
                onChanged: saving
                    ? null
                    : (value) => setState(() => orders = value),
                title: const Text('Order updates'),
              ),
              SwitchListTile(
                value: bookingReminders,
                onChanged: saving
                    ? null
                    : (value) => setState(() => bookingReminders = value),
                title: const Text('Appointment reminders'),
              ),
              SwitchListTile(
                value: reviewReplies,
                onChanged: saving
                    ? null
                    : (value) => setState(() => reviewReplies = value),
                title: const Text('Replies to my reviews'),
              ),
              SwitchListTile(
                value: offers,
                onChanged: saving
                    ? null
                    : (value) => setState(() => offers = value),
                title: const Text('Nearby offers'),
              ),
              SwitchListTile(
                value: weeklyDraws,
                onChanged: saving
                    ? null
                    : (value) => setState(() => weeklyDraws = value),
                title: const Text('Weekly draw updates'),
              ),
            ],
            if (error != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: loading || saving ? null : _save,
                child: Text(saving ? 'Saving…' : 'Save preferences'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
