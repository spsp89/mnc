import 'package:bnc_mobile/core/data/app_repository.dart';
import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/core/state/app_state.dart';
import 'package:bnc_mobile/core/storage/app_preferences.dart';
import 'package:bnc_mobile/design_system/bnc_theme.dart';
import 'package:bnc_mobile/design_system/components.dart';
import 'package:bnc_mobile/features/business_manager/presentation/business_dashboard_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class BusinessOnboardingScreen extends ConsumerStatefulWidget {
  const BusinessOnboardingScreen({super.key});

  @override
  ConsumerState<BusinessOnboardingScreen> createState() =>
      _BusinessOnboardingScreenState();
}

class _BusinessOnboardingScreenState
    extends ConsumerState<BusinessOnboardingScreen> {
  final _name = TextEditingController();
  final _legalName = TextEditingController();
  final _description = TextEditingController();
  final _shortDescription = TextEditingController();
  final _phone = TextEditingController();
  final _whatsapp = TextEditingController();
  final _email = TextEditingController();
  final _address = TextEditingController();
  final _locality = TextEditingController();
  final _city = TextEditingController(text: 'Kochi');
  final _constituency = TextEditingController();
  final _district = TextEditingController(text: 'Ernakulam');
  final _postalCode = TextEditingController();
  int _step = 0;
  String? _categoryId;
  String _planSlug = 'bronze';
  bool _publicPhone = true;
  bool _submitting = false;
  String? _error;
  double _latitude = 9.9312;
  double _longitude = 76.2673;

  @override
  void initState() {
    super.initState();
    final settings = ref.read(appSettingsProvider);
    _city.text = settings.city == 'Current area' ? 'Kochi' : settings.city;
    _latitude = settings.latitude;
    _longitude = settings.longitude;
    final user = ref.read(sessionProvider).user;
    _legalName.text = user?.displayName ?? '';
    _phone.text = user?.phone ?? '';
    _email.text = user?.email ?? '';
  }

  @override
  void dispose() {
    for (final controller in [
      _name,
      _legalName,
      _description,
      _shortDescription,
      _phone,
      _whatsapp,
      _email,
      _address,
      _locality,
      _city,
      _constituency,
      _district,
      _postalCode,
    ]) {
      controller.dispose();
    }
    super.dispose();
  }

  bool _validateStep() {
    final message = switch (_step) {
      0 when _name.text.trim().length < 2 => 'Enter the public business name.',
      0 when _legalName.text.trim().length < 2 =>
        'Enter the owner’s legal name.',
      0 when _categoryId == null => 'Choose a primary category.',
      1 when _planSlug != 'bronze' && _description.text.trim().length < 30 =>
        'Write at least 30 characters about the business.',
      1 when _planSlug != 'bronze' && _shortDescription.text.trim().isEmpty =>
        'Add a short one-line description.',
      2 when _address.text.trim().length < 3 => 'Enter the street address.',
      2 when _locality.text.trim().length < 2 => 'Enter the locality.',
      2 when _constituency.text.trim().length < 2 =>
        'Enter the assembly constituency.',
      2 when !RegExp(r'^\d{6}$').hasMatch(_postalCode.text.trim()) =>
        'Enter a valid 6-digit PIN code.',
      3 when _phone.text.replaceAll(RegExp(r'\D'), '').length < 10 =>
        'Enter a valid phone number.',
      _ => null,
    };
    setState(() => _error = message);
    return message == null;
  }

  Future<void> _next() async {
    if (!_validateStep()) return;
    if (_step < 3) {
      setState(() => _step++);
      return;
    }
    await _submit();
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    try {
      final phoneDigits = _phone.text.replaceAll(RegExp(r'\D'), '');
      final whatsappDigits = _whatsapp.text.replaceAll(RegExp(r'\D'), '');
      await ref.read(appRepositoryProvider).createBusiness({
        'planSlug': _planSlug,
        'billingCycle': 'monthly',
        'name': _name.text.trim(),
        'slug': _slugify(_name.text),
        'ownerLegalName': _legalName.text.trim(),
        'legalName': _legalName.text.trim(),
        if (_planSlug != 'bronze') 'description': _description.text.trim(),
        if (_planSlug != 'bronze')
          'shortDescription': _shortDescription.text.trim(),
        'phone': phoneDigits.length == 10 ? '+91$phoneDigits' : '+$phoneDigits',
        'displayPhonePublicly': _publicPhone,
        if (whatsappDigits.length >= 10)
          'whatsapp': whatsappDigits.length == 10
              ? '+91$whatsappDigits'
              : '+$whatsappDigits',
        if (_email.text.trim().isNotEmpty) 'email': _email.text.trim(),
        'categoryId': _categoryId,
        'location': {
          'addressLine1': _address.text.trim(),
          'locality': _locality.text.trim(),
          'city': _city.text.trim(),
          'constituency': _constituency.text.trim(),
          'district': _district.text.trim(),
          'state': 'Kerala',
          'postalCode': _postalCode.text.trim(),
          'latitude': _latitude,
          'longitude': _longitude,
          'serviceRadiusKm': 5,
        },
        'workingHours': [
          for (var day = 0; day < 7; day++)
            {
              'dayOfWeek': day,
              'opensAt': '09:00',
              'closesAt': '18:00',
              'closed': day == 0,
            },
        ],
      });
      ref.invalidate(myBusinessesProvider);
      await ref.read(appSettingsProvider.notifier).setBusinessMode(true);
      if (mounted) context.go('/business-dashboard');
    } on Object catch (error) {
      setState(() => _error = '$error');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final categories = ref.watch(categoriesProvider).valueOrNull ?? const [];
    return Scaffold(
      appBar: AppBar(
        title: const Text('List your business'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(5),
          child: LinearProgressIndicator(value: (_step + 1) / 4, minHeight: 5),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 240),
                child: SingleChildScrollView(
                  key: ValueKey(_step),
                  padding: const EdgeInsets.all(20),
                  child: switch (_step) {
                    0 => _IdentityStep(
                      name: _name,
                      legalName: _legalName,
                      categories: categories,
                      categoryId: _categoryId,
                      onCategory: (value) =>
                          setState(() => _categoryId = value),
                      planSlug: _planSlug,
                      onPlan: (value) =>
                          setState(() => _planSlug = value ?? 'bronze'),
                    ),
                    1 => _StoryStep(
                      description: _description,
                      shortDescription: _shortDescription,
                      descriptionsEnabled: _planSlug != 'bronze',
                    ),
                    2 => _LocationStep(
                      address: _address,
                      locality: _locality,
                      city: _city,
                      constituency: _constituency,
                      district: _district,
                      postalCode: _postalCode,
                    ),
                    _ => _ContactReviewStep(
                      name: _name.text,
                      city: _city.text,
                      phone: _phone,
                      whatsapp: _whatsapp,
                      email: _email,
                      publicPhone: _publicPhone,
                      onPublicPhone: (value) =>
                          setState(() => _publicPhone = value),
                    ),
                  },
                ),
              ),
            ),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Text(
                  _error!,
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.error,
                    fontWeight: FontWeight.w700,
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
                      onPressed: _submitting ? null : _next,
                      child: _submitting
                          ? const SizedBox.square(
                              dimension: 20,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : Text(
                              _step == 3 ? 'Create draft profile' : 'Continue',
                            ),
                    ),
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

class _IdentityStep extends StatelessWidget {
  const _IdentityStep({
    required this.name,
    required this.legalName,
    required this.categories,
    required this.categoryId,
    required this.onCategory,
    required this.planSlug,
    required this.onPlan,
  });

  final TextEditingController name;
  final TextEditingController legalName;
  final List<Category> categories;
  final String? categoryId;
  final ValueChanged<String?> onCategory;
  final String planSlug;
  final ValueChanged<String?> onPlan;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Start with the essentials',
          style: Theme.of(context).textTheme.headlineLarge,
        ),
        const SizedBox(height: 8),
        Text(
          'This creates a private draft. You decide when the profile is ready for verification.',
          style: Theme.of(
            context,
          ).textTheme.bodyLarge?.copyWith(color: BncColors.muted),
        ),
        const SizedBox(height: 24),
        TextField(
          controller: name,
          textCapitalization: TextCapitalization.words,
          decoration: const InputDecoration(
            labelText: 'Public business name',
            prefixIcon: Icon(Icons.storefront_outlined),
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: legalName,
          textCapitalization: TextCapitalization.words,
          decoration: const InputDecoration(
            labelText: 'Owner legal name',
            prefixIcon: Icon(Icons.badge_outlined),
          ),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          initialValue: categoryId,
          items: categories
              .map(
                (category) => DropdownMenuItem(
                  value: category.id,
                  child: Text(category.name),
                ),
              )
              .toList(),
          onChanged: onCategory,
          decoration: const InputDecoration(
            labelText: 'Primary category',
            prefixIcon: Icon(Icons.category_outlined),
          ),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          initialValue: planSlug,
          items: const [
            DropdownMenuItem(
              value: 'bronze',
              child: Text('Bronze · ₹499/month'),
            ),
            DropdownMenuItem(
              value: 'silver',
              child: Text('Silver · ₹999/month'),
            ),
            DropdownMenuItem(value: 'gold', child: Text('Gold · ₹2,999/month')),
            DropdownMenuItem(
              value: 'platinum',
              child: Text('Platinum · ₹4,999/month'),
            ),
            DropdownMenuItem(
              value: 'diamond',
              child: Text('Diamond · ₹9,999/month'),
            ),
            DropdownMenuItem(
              value: 'ruby',
              child: Text('Ruby · ₹14,999/month'),
            ),
          ],
          onChanged: onPlan,
          decoration: const InputDecoration(
            labelText: 'Membership plan',
            prefixIcon: Icon(Icons.workspace_premium_outlined),
          ),
        ),
        const SizedBox(height: 20),
        TextButton.icon(
          onPressed: () => _claimInfo(context),
          icon: const Icon(Icons.verified_user_outlined),
          label: const Text(
            'Is your business already on BNC? Learn about claiming',
          ),
        ),
      ],
    );
  }
}

class _StoryStep extends StatelessWidget {
  const _StoryStep({
    required this.description,
    required this.shortDescription,
    required this.descriptionsEnabled,
  });

  final TextEditingController description;
  final TextEditingController shortDescription;
  final bool descriptionsEnabled;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Help customers understand you',
          style: Theme.of(context).textTheme.headlineLarge,
        ),
        const SizedBox(height: 8),
        Text(
          descriptionsEnabled
              ? 'Clear, factual descriptions build trust and improve organic discovery.'
              : 'Business descriptions are not included in Bronze. Upgrade to Silver or above to add one.',
          style: Theme.of(
            context,
          ).textTheme.bodyLarge?.copyWith(color: BncColors.muted),
        ),
        if (descriptionsEnabled) ...[
          const SizedBox(height: 24),
          TextField(
            controller: shortDescription,
            maxLength: 240,
            textCapitalization: TextCapitalization.sentences,
            decoration: const InputDecoration(
              labelText: 'One-line summary',
              hintText: 'Same-day laptop repair with pickup.',
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: description,
            minLines: 6,
            maxLines: 10,
            maxLength: 5000,
            textCapitalization: TextCapitalization.sentences,
            decoration: const InputDecoration(
              labelText: 'Business description',
              alignLabelWithHint: true,
              hintText:
                  'Explain your specialties, experience and how you work…',
            ),
          ),
        ],
      ],
    );
  }
}

class _LocationStep extends StatelessWidget {
  const _LocationStep({
    required this.address,
    required this.locality,
    required this.city,
    required this.constituency,
    required this.district,
    required this.postalCode,
  });

  final TextEditingController address;
  final TextEditingController locality;
  final TextEditingController city;
  final TextEditingController constituency;
  final TextEditingController district;
  final TextEditingController postalCode;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Where can customers find you?',
          style: Theme.of(context).textTheme.headlineLarge,
        ),
        const SizedBox(height: 8),
        Text(
          'The precise point powers distance and local radius search.',
          style: Theme.of(
            context,
          ).textTheme.bodyLarge?.copyWith(color: BncColors.muted),
        ),
        const SizedBox(height: 24),
        TextField(
          controller: address,
          textCapitalization: TextCapitalization.words,
          decoration: const InputDecoration(
            labelText: 'Street address',
            prefixIcon: Icon(Icons.location_on_outlined),
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: constituency,
          textCapitalization: TextCapitalization.words,
          decoration: const InputDecoration(labelText: 'Assembly constituency'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: locality,
          textCapitalization: TextCapitalization.words,
          decoration: const InputDecoration(labelText: 'Locality'),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: city,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(labelText: 'City'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: TextField(
                controller: district,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(labelText: 'District'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        TextField(
          controller: postalCode,
          keyboardType: TextInputType.number,
          inputFormatters: [
            FilteringTextInputFormatter.digitsOnly,
            LengthLimitingTextInputFormatter(6),
          ],
          decoration: const InputDecoration(labelText: 'PIN code'),
        ),
        const SizedBox(height: 18),
        Card(
          color: BncColors.sky,
          child: const Padding(
            padding: EdgeInsets.all(16),
            child: Row(
              children: [
                Icon(Icons.schedule_rounded, color: BncColors.brand),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Default hours are Monday–Saturday, 9 AM–6 PM. You can fine-tune hours after creating the draft.',
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _ContactReviewStep extends StatelessWidget {
  const _ContactReviewStep({
    required this.name,
    required this.city,
    required this.phone,
    required this.whatsapp,
    required this.email,
    required this.publicPhone,
    required this.onPublicPhone,
  });

  final String name;
  final String city;
  final TextEditingController phone;
  final TextEditingController whatsapp;
  final TextEditingController email;
  final bool publicPhone;
  final ValueChanged<bool> onPublicPhone;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Contact and review',
          style: Theme.of(context).textTheme.headlineLarge,
        ),
        const SizedBox(height: 8),
        Text(
          'Confirm how customers can reach the business. Private details remain encrypted.',
          style: Theme.of(
            context,
          ).textTheme.bodyLarge?.copyWith(color: BncColors.muted),
        ),
        const SizedBox(height: 24),
        TextField(
          controller: phone,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(
            labelText: 'Business phone',
            prefixIcon: Icon(Icons.phone_outlined),
          ),
        ),
        const SizedBox(height: 12),
        SwitchListTile(
          value: publicPhone,
          onChanged: onPublicPhone,
          contentPadding: EdgeInsets.zero,
          title: const Text('Show phone on the public profile'),
          subtitle: const Text(
            'If off, customers can use consented enquiry and messaging.',
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: whatsapp,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(
            labelText: 'WhatsApp (optional)',
            prefixIcon: Icon(Icons.chat_outlined),
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: email,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(
            labelText: 'Business email (optional)',
            prefixIcon: Icon(Icons.email_outlined),
          ),
        ),
        const SizedBox(height: 22),
        Card(
          child: ListTile(
            leading: const Icon(
              Icons.storefront_rounded,
              color: BncColors.brand,
            ),
            title: Text(name.isEmpty ? 'Your business' : name),
            subtitle: Text('$city · Draft profile'),
            trailing: const StatusBadge(
              label: 'Private draft',
              color: BncColors.deepBlue,
            ),
          ),
        ),
      ],
    );
  }
}

String _slugify(String value) {
  final slug = value
      .trim()
      .toLowerCase()
      .replaceAll(RegExp(r'[^a-z0-9]+'), '-')
      .replaceAll(RegExp(r'^-+|-+$'), '');
  return '$slug-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
}

Future<void> _claimInfo(BuildContext context) async {
  await showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    builder: (context) => Padding(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Claim an existing profile',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 8),
          const Text(
            'Search for your business first. A claim requires proof that you own or represent it; BNC support reviews the evidence before granting access.',
          ),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                context.go('/search');
              },
              child: const Text('Search BNC'),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'The current domain API does not yet expose a self-service claim mutation. Existing claims remain handled by the protected web workflow.',
            style: TextStyle(color: BncColors.muted, fontSize: 12),
          ),
        ],
      ),
    ),
  );
}
