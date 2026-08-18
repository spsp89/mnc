import 'package:bnc_mobile/core/data/app_repository.dart';
import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/core/state/app_state.dart';
import 'package:bnc_mobile/core/storage/app_preferences.dart';
import 'package:bnc_mobile/design_system/bnc_theme.dart';
import 'package:bnc_mobile/design_system/components.dart';
import 'package:bnc_mobile/features/business_manager/presentation/business_dashboard_screen.dart';
import 'package:crypto/crypto.dart';
import 'package:file_selector/file_selector.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

List<Category> _flattenManageCategories(List<Category> categories) => [
  for (final category in categories) ...[
    category,
    ..._flattenManageCategories(category.children),
  ],
];

class BusinessManageScreen extends ConsumerWidget {
  const BusinessManageScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(activeManagedBusinessProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Manage business')),
      body: state.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => ErrorState(error: error),
        data: (business) => business == null
            ? EmptyState(
                icon: Icons.add_business_rounded,
                title: 'No managed business',
                body: 'List or claim a business before using owner tools.',
                action: () => context.push('/business/onboarding'),
                actionLabel: 'List a business',
              )
            : ListView(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
                children: [
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [BncColors.deepBlue, Color(0xFF1644B1)],
                      ),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Row(
                      children: [
                        SizedBox(
                          width: 60,
                          height: 60,
                          child: BncNetworkImage(
                            url: business.coverImageUrl,
                            borderRadius: BorderRadius.circular(17),
                          ),
                        ),
                        const SizedBox(width: 13),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                business.name,
                                style: Theme.of(context).textTheme.titleLarge
                                    ?.copyWith(color: Colors.white),
                              ),
                              Text(
                                '${business.locality} · Owner workspace',
                                style: const TextStyle(color: Colors.white70),
                              ),
                            ],
                          ),
                        ),
                        if (business.verified)
                          const Icon(
                            Icons.verified_rounded,
                            color: Color(0xFF63E6A6),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 22),
                  Text(
                    'Business profile',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Card(
                    child: Column(
                      children: [
                        SettingsTile(
                          icon: Icons.edit_note_rounded,
                          title: 'Edit profile',
                          subtitle:
                              'Description, contact, media and availability',
                          onTap: () => context.push(
                            '/business/profile/${business.id}',
                            extra: business,
                          ),
                        ),
                        const Divider(indent: 64),
                        SettingsTile(
                          icon: Icons.verified_user_outlined,
                          title: 'Verification',
                          subtitle: business.verified
                              ? 'Verified business'
                              : 'Submit private business evidence',
                          onTap: () => context.push(
                            '/business/verification/${business.id}',
                          ),
                        ),
                        const Divider(indent: 64),
                        SettingsTile(
                          icon: Icons.people_outline_rounded,
                          title: 'Team access',
                          subtitle: 'Owners and active team members',
                          onTap: () => context.push('/business/team'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 22),
                  Text(
                    'Customers & operations',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Card(
                    child: Column(
                      children: [
                        SettingsTile(
                          icon: Icons.request_quote_outlined,
                          title: 'Business enquiries',
                          subtitle: 'Direct enquiries and their status',
                          onTap: () => context.push('/business/enquiries'),
                        ),
                        const Divider(indent: 64),
                        SettingsTile(
                          icon: Icons.handshake_outlined,
                          title: 'Referrals',
                          subtitle:
                              'Record introductions and conversion status',
                          onTap: () => context.push('/business/referrals'),
                        ),
                        const Divider(indent: 64),
                        SettingsTile(
                          icon: Icons.work_outline_rounded,
                          title: 'Job vacancies',
                          subtitle: 'Post jobs and manage applicants',
                          onTap: () => context.push('/business/jobs'),
                        ),
                        const Divider(indent: 64),
                        SettingsTile(
                          icon: Icons.star_outline_rounded,
                          title: 'Reviews & replies',
                          subtitle: 'Respond thoughtfully to customer feedback',
                          onTap: () => context.push('/business/reviews'),
                        ),
                        const Divider(indent: 64),
                        SettingsTile(
                          icon: Icons.chat_bubble_outline_rounded,
                          title: 'Conversations',
                          subtitle: 'Customer messages',
                          onTap: () => context.push('/business/messages'),
                        ),
                        if (business.bookingEnabled) ...[
                          const Divider(indent: 64),
                          SettingsTile(
                            icon: Icons.event_available_outlined,
                            title: 'Appointments',
                            subtitle: 'Clinic, salon and service bookings',
                            onTap: () => context.push('/business/bookings'),
                          ),
                        ],
                        if (business.deliveryEnabled) ...[
                          const Divider(indent: 64),
                          SettingsTile(
                            icon: Icons.local_shipping_outlined,
                            title: 'Deliveries',
                            subtitle:
                                'Quote, dispatch and track eligible orders',
                            onTap: () => context.push('/business/deliveries'),
                          ),
                        ],
                        const Divider(indent: 64),
                        SettingsTile(
                          icon: Icons.groups_2_outlined,
                          title: 'Business Club',
                          subtitle: 'Plan-gated chapter networking and chat',
                          onTap: () => context.push('/business-club'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 22),
                  Text(
                    'Plan & money',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Card(
                    child: Column(
                      children: [
                        SettingsTile(
                          icon: Icons.workspace_premium_outlined,
                          title: 'Subscription',
                          subtitle: 'Plan, lead quota and billing cycle',
                          onTap: () => context.push(
                            '/business/subscription/${business.id}',
                          ),
                        ),
                        const Divider(indent: 64),
                        SettingsTile(
                          icon: Icons.payments_outlined,
                          title: 'Payments',
                          subtitle: 'Server-confirmed payment history',
                          onTap: () => context.push('/business/payments'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 22),
                  Text(
                    'Growth & workspace',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Card(
                    child: Column(
                      children: [
                        SettingsTile(
                          icon: Icons.analytics_outlined,
                          title: 'Analytics',
                          subtitle: 'Discovery, conversion and search demand',
                          onTap: () => context.push('/business/analytics'),
                        ),
                        const Divider(indent: 64),
                        SettingsTile(
                          icon: Icons.auto_graph_rounded,
                          title: 'Growth walkthrough',
                          subtitle: 'See how a complete profile becomes demand',
                          onTap: () =>
                              context.push('/business/success-stories'),
                        ),
                        const Divider(indent: 64),
                        SettingsTile(
                          icon: Icons.settings_outlined,
                          title: 'Workspace settings',
                          subtitle: 'Lead alerts, channels and team safeguards',
                          onTap: () => context.push('/business/settings'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 22),
                  Card(
                    child: Column(
                      children: [
                        SettingsTile(
                          icon: Icons.notifications_none_rounded,
                          title: 'Business notifications',
                          onTap: () => context.push('/business/notifications'),
                        ),
                        const Divider(indent: 64),
                        SettingsTile(
                          icon: Icons.person_outline_rounded,
                          title: 'Switch to customer mode',
                          onTap: () async {
                            await ref
                                .read(appSettingsProvider.notifier)
                                .setBusinessMode(false);
                            if (context.mounted) context.go('/home');
                          },
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

class BusinessProfileEditScreen extends ConsumerStatefulWidget {
  const BusinessProfileEditScreen({
    required this.businessId,
    super.key,
    this.initialBusiness,
  });

  final String businessId;
  final Business? initialBusiness;

  @override
  ConsumerState<BusinessProfileEditScreen> createState() =>
      _BusinessProfileEditScreenState();
}

class _BusinessProfileEditScreenState
    extends ConsumerState<BusinessProfileEditScreen> {
  static const _socialNetworks = <String, String>{
    'facebook': 'Facebook URL',
    'instagram': 'Instagram URL',
    'youtube': 'YouTube URL',
    'linkedin': 'LinkedIn URL',
    'x': 'X URL',
    'tiktok': 'TikTok URL',
  };
  late final TextEditingController _name;
  late final TextEditingController _short;
  late final TextEditingController _description;
  late final TextEditingController _phone;
  late final TextEditingController _permanentDiscountPercent;
  late final TextEditingController _permanentDiscountLabel;
  late final TextEditingController _upiId;
  late final TextEditingController _paymentAccountName;
  late final Map<String, TextEditingController> _socialControllers;
  late final List<String> _visibleSocialNetworks;
  late List<String> _categoryIds;
  late String _primaryCategoryId;
  bool _acceptEnquiries = true;
  bool _busy = false;

  Future<void> _uploadBusinessImage(String kind) async {
    final file = await ImagePicker().pickImage(
      source: ImageSource.gallery,
      maxWidth: 1920,
      maxHeight: 1920,
      imageQuality: 82,
    );
    if (file == null) return;
    setState(() => _busy = true);
    try {
      final bytes = await file.readAsBytes();
      final extension = file.name.split('.').last.toLowerCase();
      final contentType = extension == 'png'
          ? 'image/png'
          : extension == 'webp'
          ? 'image/webp'
          : 'image/jpeg';
      final objectKey = await ref
          .read(appRepositoryProvider)
          .uploadPrivateImage(
            bytes: bytes,
            fileName: file.name,
            contentType: contentType,
            purpose: 'business_image',
            businessId: widget.businessId,
          );
      await ref
          .read(appRepositoryProvider)
          .attachBusinessImage(
            businessId: widget.businessId,
            kind: kind,
            objectKey: objectKey,
            altText: '${_name.text.trim()} $kind',
          );
      ref.invalidate(myBusinessesProvider);
      ref.invalidate(activeManagedBusinessProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '${kind[0].toUpperCase()}${kind.substring(1)} image saved.',
            ),
          ),
        );
      }
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
  void initState() {
    super.initState();
    final business = widget.initialBusiness;
    _name = TextEditingController(text: business?.name);
    _short = TextEditingController(text: business?.shortDescription);
    _description = TextEditingController(text: business?.description);
    _phone = TextEditingController(text: business?.phone);
    _permanentDiscountPercent = TextEditingController(
      text: business == null || business.permanentDiscountPercent == 0
          ? ''
          : '${business.permanentDiscountPercent}',
    );
    _permanentDiscountLabel = TextEditingController(
      text: business?.permanentDiscountLabel,
    );
    _upiId = TextEditingController(text: business?.paymentUpiId);
    _paymentAccountName = TextEditingController(
      text: business?.paymentAccountName,
    );
    _socialControllers = {
      for (final key in _socialNetworks.keys)
        key: TextEditingController(text: business?.socialLinks[key]),
    };
    _visibleSocialNetworks = _socialNetworks.keys
        .where(
          (key) =>
              key == 'facebook' ||
              key == 'instagram' ||
              (business?.socialLinks[key]?.isNotEmpty ?? false),
        )
        .toList();
    _categoryIds = [...?business?.categoryIds];
    _primaryCategoryId = _categoryIds.firstOrNull ?? '';
  }

  @override
  void dispose() {
    _name.dispose();
    _short.dispose();
    _description.dispose();
    _phone.dispose();
    _permanentDiscountPercent.dispose();
    _permanentDiscountLabel.dispose();
    _upiId.dispose();
    _paymentAccountName.dispose();
    for (final controller in _socialControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    final business = widget.initialBusiness;
    if (_name.text.trim().length < 2 ||
        (business?.descriptionEnabled != false &&
            _description.text.trim().length < 30)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Complete the required profile fields.')),
      );
      return;
    }
    setState(() => _busy = true);
    try {
      await ref.read(appRepositoryProvider).updateBusiness(widget.businessId, {
        'name': _name.text.trim(),
        if (business?.descriptionEnabled != false)
          'shortDescription': _short.text.trim(),
        if (business?.descriptionEnabled != false)
          'description': _description.text.trim(),
        if (_phone.text.trim().isNotEmpty) 'publicPhone': _phone.text.trim(),
        'permanentDiscountPercent':
            int.tryParse(_permanentDiscountPercent.text) ?? 0,
        'permanentDiscountLabel': _permanentDiscountLabel.text.trim().isEmpty
            ? null
            : _permanentDiscountLabel.text.trim(),
        if (business?.socialLinksEnabled != false)
          'socialLinks': {
            for (final entry in _socialControllers.entries)
              if (entry.value.text.trim().isNotEmpty)
                entry.key: entry.value.text.trim(),
          },
        if (_upiId.text.trim().isNotEmpty) 'upiId': _upiId.text.trim(),
        if (_paymentAccountName.text.trim().isNotEmpty)
          'paymentAccountName': _paymentAccountName.text.trim(),
        'acceptNewEnquiries': _acceptEnquiries,
      });
      if (_categoryIds.isNotEmpty) {
        await ref
            .read(appRepositoryProvider)
            .updateBusinessCategories(
              widget.businessId,
              categoryIds: _categoryIds,
              primaryCategoryId: _primaryCategoryId,
            );
      }
      ref.invalidate(myBusinessesProvider);
      ref.invalidate(activeManagedBusinessProvider);
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
    final categoryOptions = _flattenManageCategories(
      ref.watch(categoriesProvider).valueOrNull ?? const [],
    );
    final categoryLimit = widget.initialBusiness?.categoryLimit ?? 1;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit business profile'),
        actions: [
          TextButton(
            onPressed: _busy ? null : _save,
            child: const Text('Save'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(18, 8, 18, 30),
        children: [
          TextField(
            controller: _name,
            textCapitalization: TextCapitalization.words,
            decoration: const InputDecoration(labelText: 'Business name'),
          ),
          const SizedBox(height: 12),
          Text(
            'Business photos',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              OutlinedButton.icon(
                onPressed: _busy ? null : () => _uploadBusinessImage('logo'),
                icon: const Icon(Icons.account_circle_outlined),
                label: const Text('Profile photo'),
              ),
              OutlinedButton.icon(
                onPressed: _busy ? null : () => _uploadBusinessImage('banner'),
                icon: const Icon(Icons.panorama_outlined),
                label: const Text('Banner'),
              ),
              if ((widget.initialBusiness?.galleryLimit ?? 0) > 0)
                OutlinedButton.icon(
                  onPressed: _busy
                      ? null
                      : () => _uploadBusinessImage('gallery'),
                  icon: const Icon(Icons.add_photo_alternate_outlined),
                  label: Text(
                    'Gallery (${widget.initialBusiness?.gallery.length ?? 0}/${widget.initialBusiness?.galleryLimit ?? 0})',
                  ),
                ),
            ],
          ),
          const SizedBox(height: 18),
          if (widget.initialBusiness?.descriptionEnabled != false) ...[
            TextField(
              controller: _short,
              maxLength: 240,
              decoration: const InputDecoration(labelText: 'Short description'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _description,
              minLines: 6,
              maxLines: 12,
              maxLength: 5000,
              decoration: const InputDecoration(
                labelText: 'Full description',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 12),
          ],
          Text(
            'Business categories (${_categoryIds.length}/$categoryLimit)',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 5),
          Text(
            'Products and services can use the categories selected here. Mark one selected category as primary.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 10),
          for (final category in categoryOptions)
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              dense: true,
              value: _categoryIds.contains(category.id),
              title: Text(category.name),
              secondary: _categoryIds.contains(category.id)
                  ? IconButton(
                      tooltip: _primaryCategoryId == category.id
                          ? 'Primary category'
                          : 'Make primary category',
                      icon: Icon(
                        _primaryCategoryId == category.id
                            ? Icons.radio_button_checked_rounded
                            : Icons.radio_button_unchecked_rounded,
                      ),
                      onPressed: () =>
                          setState(() => _primaryCategoryId = category.id),
                    )
                  : null,
              onChanged:
                  !_categoryIds.contains(category.id) &&
                      _categoryIds.length >= categoryLimit
                  ? null
                  : (selected) => setState(() {
                      if (selected == true) {
                        _categoryIds.add(category.id);
                        if (_primaryCategoryId.isEmpty) {
                          _primaryCategoryId = category.id;
                        }
                      } else if (_categoryIds.length > 1) {
                        _categoryIds.remove(category.id);
                        if (_primaryCategoryId == category.id) {
                          _primaryCategoryId = _categoryIds.first;
                        }
                      }
                    }),
            ),
          const SizedBox(height: 12),
          TextField(
            controller: _phone,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(labelText: 'Public phone'),
          ),
          if (widget.initialBusiness?.socialLinksEnabled != false) ...[
            const SizedBox(height: 24),
            Text(
              'Social and video links',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 5),
            const Text(
              'Add up to six public links to your digital business card.',
            ),
            const SizedBox(height: 12),
            for (final network in _visibleSocialNetworks) ...[
              TextField(
                controller: _socialControllers[network],
                keyboardType: TextInputType.url,
                decoration: InputDecoration(
                  labelText: _socialNetworks[network],
                  prefixIcon: const Icon(Icons.link_rounded),
                ),
              ),
              const SizedBox(height: 12),
            ],
            if (_visibleSocialNetworks.length < _socialNetworks.length)
              Align(
                alignment: Alignment.centerLeft,
                child: OutlinedButton.icon(
                  onPressed: () {
                    final next = _socialNetworks.keys.firstWhere(
                      (key) => !_visibleSocialNetworks.contains(key),
                    );
                    setState(() => _visibleSocialNetworks.add(next));
                  },
                  icon: const Icon(Icons.add_rounded),
                  label: const Text('Add another link'),
                ),
              ),
          ],
          const SizedBox(height: 24),
          Text(
            'Permanent BNC discount',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 5),
          const Text(
            'This discount appears on the public profile and digital business card.',
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _permanentDiscountPercent,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              labelText: 'Discount percentage',
              suffixText: '%',
              helperText: 'Use 0 when no permanent discount is offered.',
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _permanentDiscountLabel,
            maxLength: 120,
            decoration: const InputDecoration(
              labelText: 'Discount label',
              hintText: 'For BNC members',
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Direct UPI payment',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 5),
          const Text(
            'Customers pay you directly. BNC does not collect or hold the payment.',
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _upiId,
            autocorrect: false,
            decoration: const InputDecoration(
              labelText: 'UPI ID',
              hintText: 'business@bank',
              prefixIcon: Icon(Icons.qr_code_rounded),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _paymentAccountName,
            textCapitalization: TextCapitalization.words,
            decoration: const InputDecoration(
              labelText: 'Payment display name',
              prefixIcon: Icon(Icons.account_balance_outlined),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: SwitchListTile(
              value: _acceptEnquiries,
              onChanged: (value) => setState(() => _acceptEnquiries = value),
              title: const Text('Accept new enquiries'),
              subtitle: const Text(
                'Turn off temporarily when your team is at capacity.',
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            color: BncColors.sky,
            child: const Padding(
              padding: EdgeInsets.all(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.photo_library_outlined, color: BncColors.brand),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Media upload uses private signed object-storage URLs in production. The current API accepts approved media references but does not yet issue upload URLs from a mobile route.',
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 9, 16, 12),
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
                : const Text('Save profile'),
          ),
        ),
      ),
    );
  }
}

final businessReviewsProvider = FutureProvider.family<List<Review>, String>(
  (ref, businessId) =>
      ref.watch(appRepositoryProvider).businessReviews(businessId),
);

class BusinessReviewsScreen extends ConsumerWidget {
  const BusinessReviewsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final business = ref.watch(selectedManagedBusinessProvider);
    if (business == null) {
      return const Scaffold(
        body: EmptyState(
          icon: Icons.star_outline_rounded,
          title: 'No managed business',
          body: 'Reviews are connected to a business profile.',
        ),
      );
    }
    final state = ref.watch(businessReviewsProvider(business.id));
    return Scaffold(
      appBar: AppBar(title: const Text('Reviews & replies')),
      body: state.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => ErrorState(error: error),
        data: (reviews) => reviews.isEmpty
            ? const EmptyState(
                icon: Icons.rate_review_outlined,
                title: 'No published reviews',
                body: 'Customer feedback will appear here.',
              )
            : ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 30),
                itemCount: reviews.length,
                separatorBuilder: (_, index) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final review = reviews[index];
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(17),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                child: Text(initials(review.author)),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  review.author,
                                  style: Theme.of(
                                    context,
                                  ).textTheme.titleMedium,
                                ),
                              ),
                              RatingLabel(rating: review.rating),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(review.body),
                          if (review.ownerReply != null) ...[
                            const SizedBox(height: 12),
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(13),
                              decoration: BoxDecoration(
                                color: BncColors.sky,
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: Text(
                                'Your response: ${review.ownerReply}',
                              ),
                            ),
                          ] else ...[
                            const SizedBox(height: 10),
                            TextButton.icon(
                              onPressed: () => _reply(context, ref, review),
                              icon: const Icon(Icons.reply_rounded),
                              label: const Text('Reply thoughtfully'),
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

  Future<void> _reply(
    BuildContext context,
    WidgetRef ref,
    Review review,
  ) async {
    final controller = TextEditingController();
    final reply = await showModalBottomSheet<String>(
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
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Reply to ${review.author}',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              minLines: 4,
              maxLines: 8,
              maxLength: 1500,
              decoration: const InputDecoration(
                hintText: 'Acknowledge the experience and be constructive…',
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context, controller.text.trim()),
                child: const Text('Publish reply'),
              ),
            ),
          ],
        ),
      ),
    );
    controller.dispose();
    if (reply == null || reply.length < 5) return;
    await ref.read(appRepositoryProvider).replyToReview(review.id, reply);
    final business = ref.read(selectedManagedBusinessProvider);
    if (business != null) {
      ref.invalidate(businessReviewsProvider(business.id));
    }
  }
}

final businessEnquiriesProvider = FutureProvider<List<Enquiry>>(
  (ref) => ref.watch(appRepositoryProvider).enquiries(business: true),
);

class BusinessEnquiriesScreen extends ConsumerWidget {
  const BusinessEnquiriesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(businessEnquiriesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Business enquiries')),
      body: state.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => ErrorState(error: error),
        data: (items) => items.isEmpty
            ? const EmptyState(
                icon: Icons.request_quote_outlined,
                title: 'No direct enquiries',
                body:
                    'Customer enquiries to this profile will appear here separately from matched leads.',
              )
            : ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 30),
                itemCount: items.length,
                separatorBuilder: (_, index) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final item = items[index];
                  return Card(
                    child: ListTile(
                      minTileHeight: 86,
                      leading: const Icon(
                        Icons.request_quote_rounded,
                        color: BncColors.brand,
                      ),
                      title: Text(
                        item.requirement,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      subtitle: Text('${item.locality} · ${item.status}'),
                      trailing: const Icon(Icons.chevron_right_rounded),
                      onTap: () => context.push('/business/messages'),
                    ),
                  );
                },
              ),
      ),
    );
  }
}

final verificationProvider = FutureProvider.family<List<Json>, String>(
  (ref, businessId) =>
      ref.watch(appRepositoryProvider).verificationRequests(businessId),
);

class VerificationScreen extends ConsumerStatefulWidget {
  const VerificationScreen({required this.businessId, super.key});

  final String businessId;

  @override
  ConsumerState<VerificationScreen> createState() => _VerificationScreenState();
}

class _VerificationScreenState extends ConsumerState<VerificationScreen> {
  String _type = 'GST';
  XFile? _file;
  String? _hash;
  final _privateKey = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _privateKey.dispose();
    super.dispose();
  }

  Future<void> _pick() async {
    const evidenceTypes = XTypeGroup(
      label: 'Verification evidence',
      extensions: ['pdf', 'jpg', 'jpeg', 'png'],
    );
    final file = await openFile(acceptedTypeGroups: [evidenceTypes]);
    if (file == null) return;
    if (await file.length() > 5 * 1024 * 1024) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Evidence must be under 5 MB.')),
        );
      }
      return;
    }
    final bytes = await file.readAsBytes();
    setState(() {
      _file = file;
      _hash = sha256.convert(bytes).toString();
    });
  }

  Future<void> _submit() async {
    if (_file == null || _hash == null) return;
    if (_privateKey.text.trim().length < 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'A private object key from the signed upload adapter is required.',
          ),
        ),
      );
      return;
    }
    setState(() => _busy = true);
    try {
      await ref.read(appRepositoryProvider).createVerification({
        'businessId': widget.businessId,
        'documentType': _type,
        'documentKey': _privateKey.text.trim(),
        'documentHash': _hash,
      });
      ref.invalidate(verificationProvider(widget.businessId));
      setState(() {
        _file = null;
        _hash = null;
        _privateKey.clear();
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

  @override
  Widget build(BuildContext context) {
    final requests = ref.watch(verificationProvider(widget.businessId));
    return Scaffold(
      appBar: AppBar(title: const Text('Business verification')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(18, 8, 18, 30),
        children: [
          Card(
            color: BncColors.sky,
            child: const Padding(
              padding: EdgeInsets.all(17),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.verified_user_rounded,
                    color: BncColors.verified,
                    size: 28,
                  ),
                  SizedBox(width: 11),
                  Expanded(
                    child: Text(
                      'Verification proves a business identity. Evidence remains private, is never stored as a public URL, and must pass production type, size and malware checks.',
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Previous requests',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          requests.when(
            loading: () => const BncSkeleton(height: 76),
            error: (error, stack) => ErrorState(error: error),
            data: (items) => Card(
              child: items.isEmpty
                  ? const ListTile(title: Text('No request submitted yet'))
                  : Column(
                      children: items
                          .map(
                            (item) => ListTile(
                              leading: const Icon(Icons.description_outlined),
                              title: Text(item.string('documentType')),
                              subtitle: Text(item.string('createdAt')),
                              trailing: StatusBadge(
                                label: item.string('status', 'PENDING'),
                                color: item.string('status') == 'APPROVED'
                                    ? BncColors.verified
                                    : BncColors.brand,
                              ),
                            ),
                          )
                          .toList(),
                    ),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Submit evidence',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 10),
          DropdownButtonFormField<String>(
            initialValue: _type,
            items: const [
              DropdownMenuItem(value: 'GST', child: Text('GST registration')),
              DropdownMenuItem(
                value: 'UDYAM',
                child: Text('Udyam certificate'),
              ),
              DropdownMenuItem(
                value: 'TRADE_LICENSE',
                child: Text('Trade licence'),
              ),
              DropdownMenuItem(
                value: 'PROFESSIONAL_REGISTRATION',
                child: Text('Professional registration'),
              ),
              DropdownMenuItem(
                value: 'ADDRESS_PROOF',
                child: Text('Address proof'),
              ),
              DropdownMenuItem(value: 'OTHER', child: Text('Other evidence')),
            ],
            onChanged: (value) => setState(() => _type = value ?? 'GST'),
            decoration: const InputDecoration(labelText: 'Document type'),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: _pick,
            icon: const Icon(Icons.upload_file_rounded),
            label: Text(
              _file == null ? 'Choose PDF, JPEG or PNG' : _file!.name,
            ),
          ),
          if (_file != null) ...[
            const SizedBox(height: 12),
            TextField(
              controller: _privateKey,
              decoration: const InputDecoration(
                labelText: 'Private uploaded object key',
                helperText:
                    'Returned by the production signed-upload adapter; never a public URL.',
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'SHA-256: ${_hash?.substring(0, 18)}…',
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: BncColors.muted),
            ),
          ],
          const SizedBox(height: 12),
          const Text(
            'The API validates an evidence key and hash but does not expose a signed-upload URL endpoint. Configure the object-storage upload adapter before submission.',
            style: TextStyle(color: BncColors.offer),
          ),
          const SizedBox(height: 18),
          ElevatedButton(
            onPressed: _busy ? null : _submit,
            child: _busy
                ? const SizedBox.square(
                    dimension: 20,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  )
                : const Text('Submit for review'),
          ),
        ],
      ),
    );
  }
}

final plansProvider = FutureProvider<List<SubscriptionPlan>>(
  (ref) => ref.watch(appRepositoryProvider).subscriptionPlans(),
);
final currentSubscriptionProvider = FutureProvider.family<Json?, String>(
  (ref, businessId) =>
      ref.watch(appRepositoryProvider).currentSubscription(businessId),
);

class SubscriptionScreen extends ConsumerWidget {
  const SubscriptionScreen({required this.businessId, super.key});

  final String businessId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final current = ref.watch(currentSubscriptionProvider(businessId));
    final plans = ref.watch(plansProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Business plan')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 30),
        children: [
          Text(
            'Current subscription',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 9),
          current.when(
            loading: () => const BncSkeleton(height: 110),
            error: (error, stack) => ErrorState(error: error),
            data: (subscription) => Card(
              color: BncColors.sky,
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: subscription == null
                    ? const Text('No active subscription')
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          StatusBadge(
                            label: subscription.string('status', 'ACTIVE'),
                            color: BncColors.verified,
                          ),
                          const SizedBox(height: 10),
                          Text(
                            subscription['plan'] is Map
                                ? Map<String, dynamic>.from(
                                    subscription['plan'] as Map,
                                  ).string('name', 'Current plan')
                                : 'Current plan',
                            style: Theme.of(context).textTheme.headlineMedium
                                ?.copyWith(color: BncColors.deepBlue),
                          ),
                          Text(
                            '${subscription.string('billingCycle', 'monthly')} billing · Renews ${subscription.string('renewsAt', 'automatically')}',
                          ),
                        ],
                      ),
              ),
            ),
          ),
          const SizedBox(height: 28),
          Text(
            'Available plans',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 10),
          plans.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, stack) => ErrorState(error: error),
            data: (items) => Column(
              children: items
                  .map(
                    (plan) => Padding(
                      padding: const EdgeInsets.only(bottom: 11),
                      child: _PlanCard(
                        plan: plan,
                        onChoose: () => _choosePlan(context, ref, plan),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'Sponsored placement and organic ranking are separate. Paid visibility is always labelled, and plans do not guarantee review or verification status.',
            style: TextStyle(color: BncColors.muted),
          ),
        ],
      ),
    );
  }

  Future<void> _choosePlan(
    BuildContext context,
    WidgetRef ref,
    SubscriptionPlan plan,
  ) async {
    final subscription = await ref
        .read(appRepositoryProvider)
        .createSubscription(
          businessId: businessId,
          planId: plan.id,
          billingCycle: 'monthly',
        );
    if (plan.price > 0) {
      await ref
          .read(appRepositoryProvider)
          .createSubscriptionCheckout(subscription.string('id'));
      if (context.mounted) {
        await showDialog<void>(
          context: context,
          builder: (context) => AlertDialog(
            icon: const Icon(Icons.payments_outlined, color: BncColors.brand),
            title: const Text('Subscription checkout ready'),
            content: const Text(
              'Continue through Razorpay. Activation occurs only after the signed payment webhook is processed.',
            ),
            actions: [
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Done'),
              ),
            ],
          ),
        );
      }
    }
    ref.invalidate(currentSubscriptionProvider(businessId));
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({required this.plan, required this.onChoose});

  final SubscriptionPlan plan;
  final VoidCallback onChoose;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: plan.recommended ? BncColors.deepBlue : null,
      child: Padding(
        padding: const EdgeInsets.all(19),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (plan.recommended)
              const StatusBadge(label: 'Recommended', color: BncColors.offer),
            if (plan.recommended) const SizedBox(height: 10),
            Text(
              plan.name,
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                color: plan.recommended ? Colors.white : null,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              plan.price == 0
                  ? 'Free'
                  : '${formatCurrency(plan.price)} / ${plan.interval}',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: plan.recommended ? Colors.white : BncColors.brand,
              ),
            ),
            const SizedBox(height: 14),
            ...plan.features.map(
              (feature) => Padding(
                padding: const EdgeInsets.only(bottom: 7),
                child: Row(
                  children: [
                    Icon(
                      Icons.check_circle_rounded,
                      size: 17,
                      color: plan.recommended
                          ? const Color(0xFF63E6A6)
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
            ),
            const SizedBox(height: 13),
            SizedBox(
              width: double.infinity,
              child: plan.recommended
                  ? ElevatedButton(
                      onPressed: onChoose,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: BncColors.deepBlue,
                      ),
                      child: const Text('Choose plan'),
                    )
                  : OutlinedButton(
                      onPressed: onChoose,
                      child: const Text('Choose plan'),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

final paymentsProvider = FutureProvider<List<Json>>(
  (ref) => ref.watch(appRepositoryProvider).payments(),
);

class BusinessPaymentsScreen extends ConsumerWidget {
  const BusinessPaymentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(paymentsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Payments')),
      body: state.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => ErrorState(error: error),
        data: (items) => items.isEmpty
            ? const EmptyState(
                icon: Icons.payments_outlined,
                title: 'No payment history',
                body: 'Subscription and marketplace payments appear here.',
              )
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: items.length,
                separatorBuilder: (_, index) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final item = items[index];
                  return Card(
                    child: ListTile(
                      minTileHeight: 78,
                      leading: const Icon(
                        Icons.receipt_long_outlined,
                        color: BncColors.brand,
                      ),
                      title: Text(formatCurrency(item.decimal('amount'))),
                      subtitle: Text(
                        '${item.string('provider', 'razorpay')} · ${item.string('createdAt')}',
                      ),
                      trailing: StatusBadge(
                        label: item.string('status'),
                        color: item.string('status') == 'CAPTURED'
                            ? BncColors.verified
                            : BncColors.offer,
                      ),
                    ),
                  );
                },
              ),
      ),
    );
  }
}

final businessTeamProvider = FutureProvider.family<Json, String>(
  (ref, businessId) =>
      ref.watch(appRepositoryProvider).businessTeam(businessId),
);

class BusinessTeamScreen extends ConsumerWidget {
  const BusinessTeamScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final business = ref.watch(activeManagedBusinessProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Team access')),
      floatingActionButton: business.valueOrNull == null
          ? null
          : FloatingActionButton.extended(
              onPressed: () =>
                  _addMember(context, ref, business.requireValue!.id),
              icon: const Icon(Icons.person_add_alt_1_rounded),
              label: const Text('Add member'),
            ),
      body: business.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => ErrorState(error: error),
        data: (business) {
          if (business == null) {
            return const EmptyState(
              icon: Icons.groups_outlined,
              title: 'No managed business',
              body: 'Create or claim a business before adding team members.',
            );
          }
          final team = ref.watch(businessTeamProvider(business.id));
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(businessTeamProvider(business.id));
              await ref.read(businessTeamProvider(business.id).future);
            },
            child: team.when(
              loading: () => ListView(
                padding: const EdgeInsets.all(16),
                children: const [BncSkeleton(height: 88)],
              ),
              error: (error, stack) => ListView(
                children: [
                  ErrorState(
                    error: error,
                    onRetry: () =>
                        ref.invalidate(businessTeamProvider(business.id)),
                  ),
                ],
              ),
              data: (data) {
                final owner = data['owner'] is Map
                    ? Map<String, dynamic>.from(data['owner'] as Map)
                    : <String, dynamic>{};
                final members = data.jsonList('members');
                return ListView(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                  children: [
                    Card(
                      color: BncColors.sky,
                      child: const Padding(
                        padding: EdgeInsets.all(16),
                        child: Text(
                          'Each colleague signs in with their own verified BNC account. Access changes are recorded by the server.',
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    if (owner.isNotEmpty)
                      Card(
                        child: ListTile(
                          minTileHeight: 82,
                          leading: CircleAvatar(
                            child: Text(initials(owner.string('name'))),
                          ),
                          title: Text(owner.string('name', 'Account owner')),
                          subtitle: Text(
                            owner.string(
                              'email',
                              owner.string('phone', 'Full business access'),
                            ),
                          ),
                          trailing: const StatusBadge(
                            label: 'Owner',
                            color: BncColors.deepBlue,
                          ),
                        ),
                      ),
                    for (final member in members)
                      Card(
                        child: ListTile(
                          minTileHeight: 86,
                          leading: CircleAvatar(
                            child: Text(initials(member.string('name'))),
                          ),
                          title: Text(member.string('name', 'Team member')),
                          subtitle: Text(
                            '${member.string('email', member.string('phone'))}\n'
                            '${member.boolean('active') ? 'Active' : 'Access removed'}',
                          ),
                          isThreeLine: true,
                          trailing: PopupMenuButton<String>(
                            onSelected: (value) => _updateMember(
                              context,
                              ref,
                              business.id,
                              member,
                              value,
                            ),
                            itemBuilder: (context) => [
                              for (final role in const [
                                'ADMIN',
                                'MANAGER',
                                'CATALOG_EDITOR',
                                'LEAD_AGENT',
                                'VIEWER',
                              ])
                                PopupMenuItem(
                                  value: 'role:$role',
                                  child: Text('Set ${role.toLowerCase()}'),
                                ),
                              PopupMenuItem(
                                value: member.boolean('active')
                                    ? 'disable'
                                    : 'enable',
                                child: Text(
                                  member.boolean('active')
                                      ? 'Remove access'
                                      : 'Restore access',
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    if (members.isEmpty)
                      const EmptyState(
                        icon: Icons.group_add_outlined,
                        title: 'No colleagues yet',
                        body:
                            'Add an existing verified BNC user by email address.',
                      ),
                  ],
                );
              },
            ),
          );
        },
      ),
    );
  }

  Future<void> _addMember(
    BuildContext context,
    WidgetRef ref,
    String businessId,
  ) async {
    final email = TextEditingController();
    var role = 'VIEWER';
    final saved = await showDialog<bool>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Add a colleague'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: email,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: 'Email address'),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: role,
                decoration: const InputDecoration(labelText: 'Workspace role'),
                items: const [
                  DropdownMenuItem(value: 'ADMIN', child: Text('Admin')),
                  DropdownMenuItem(value: 'MANAGER', child: Text('Manager')),
                  DropdownMenuItem(
                    value: 'CATALOG_EDITOR',
                    child: Text('Catalogue editor'),
                  ),
                  DropdownMenuItem(
                    value: 'LEAD_AGENT',
                    child: Text('Lead agent'),
                  ),
                  DropdownMenuItem(value: 'VIEWER', child: Text('Viewer')),
                ],
                onChanged: (value) => setState(() => role = value ?? 'VIEWER'),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                await ref.read(appRepositoryProvider).addBusinessTeamMember(
                  businessId,
                  {'email': email.text.trim(), 'role': role},
                );
                if (context.mounted) Navigator.pop(context, true);
              },
              child: const Text('Add member'),
            ),
          ],
        ),
      ),
    );
    email.dispose();
    if (saved == true) ref.invalidate(businessTeamProvider(businessId));
  }

  Future<void> _updateMember(
    BuildContext context,
    WidgetRef ref,
    String businessId,
    Json member,
    String action,
  ) async {
    final payload = action.startsWith('role:')
        ? <String, dynamic>{'role': action.substring(5)}
        : <String, dynamic>{'active': action == 'enable'};
    try {
      await ref
          .read(appRepositoryProvider)
          .updateBusinessTeamMember(businessId, member.string('id'), payload);
      ref.invalidate(businessTeamProvider(businessId));
    } on Object catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$error')));
      }
    }
  }
}
