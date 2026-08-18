import 'dart:async';

import 'package:bnc_mobile/core/config/app_config.dart';
import 'package:bnc_mobile/core/state/app_state.dart';
import 'package:bnc_mobile/design_system/bnc_theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key, this.returnTo});

  final String? returnTo;

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  bool _useEmail = false;
  bool _register = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _phoneController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  String get _phone =>
      '+91${_phoneController.text.replaceAll(RegExp(r'\D'), '')}';

  Future<void> _requestCode() async {
    if (!_formKey.currentState!.validate()) return;
    final ok = await ref.read(sessionProvider.notifier).requestOtp(_phone);
    if (ok && mounted) {
      context.push(_authStepLocation('/otp', widget.returnTo), extra: _phone);
    }
  }

  Future<void> _submitEmail() async {
    if (!_formKey.currentState!.validate()) return;
    final email = _emailController.text.trim().toLowerCase();
    if (_register) {
      final ok = await ref
          .read(sessionProvider.notifier)
          .registerEmail(
            email: email,
            password: _passwordController.text,
            displayName: _nameController.text.trim(),
          );
      if (ok && mounted) {
        context.push(
          _authStepLocation('/email-verify', widget.returnTo),
          extra: email,
        );
      }
      return;
    }
    final ok = await ref
        .read(sessionProvider.notifier)
        .loginEmail(email, _passwordController.text);
    if (!ok || !mounted) return;
    context.go(customerAuthDestination(widget.returnTo));
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionProvider);
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: BncColors.brand,
        statusBarIconBrightness: Brightness.light,
        statusBarBrightness: Brightness.dark,
        systemNavigationBarColor: Color(0xFFF7F9FE),
        systemNavigationBarIconBrightness: Brightness.dark,
      ),
      child: Scaffold(
        backgroundColor: const Color(0xFFF7F9FE),
        appBar: AppBar(
          backgroundColor: BncColors.brand,
          foregroundColor: Colors.white,
        ),
        body: SafeArea(
          top: false,
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 36, 24, 30),
            child: Form(
              key: _formKey,
              child: AutofillGroup(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Welcome to BNC',
                      style: Theme.of(context).textTheme.headlineLarge
                          ?.copyWith(
                            color: const Color(0xFF10213F),
                            fontWeight: FontWeight.w900,
                          ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      _useEmail
                          ? (_register
                                ? 'Create a verified BNC account with your email address.'
                                : 'Sign in with your verified email and password.')
                          : 'Enter your mobile number. We’ll send a secure one-time code—no password needed.',
                      style: Theme.of(
                        context,
                      ).textTheme.bodyLarge?.copyWith(color: BncColors.muted),
                    ),
                    const SizedBox(height: 24),
                    SegmentedButton<bool>(
                      segments: const [
                        ButtonSegment(
                          value: false,
                          icon: Icon(Icons.phone_iphone_rounded),
                          label: Text('Phone'),
                        ),
                        ButtonSegment(
                          value: true,
                          icon: Icon(Icons.email_outlined),
                          label: Text('Email'),
                        ),
                      ],
                      selected: {_useEmail},
                      onSelectionChanged: (selection) {
                        setState(() => _useEmail = selection.first);
                      },
                    ),
                    const SizedBox(height: 24),
                    if (!_useEmail)
                      TextFormField(
                        key: const ValueKey('phone-field'),
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        textInputAction: TextInputAction.done,
                        autofillHints: const [AutofillHints.telephoneNumber],
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                          LengthLimitingTextInputFormatter(10),
                        ],
                        onFieldSubmitted: (_) => _requestCode(),
                        decoration: const InputDecoration(
                          labelText: 'Mobile number',
                          prefixText: '+91  ',
                          hintText: '98765 43210',
                        ),
                        validator: (value) {
                          final digits = value?.replaceAll(RegExp(r'\D'), '');
                          return digits?.length == 10
                              ? null
                              : 'Enter a valid 10-digit mobile number';
                        },
                      )
                    else ...[
                      if (_register) ...[
                        TextFormField(
                          controller: _nameController,
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
                            if (length > 100) {
                              return 'Use no more than 100 characters';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 12),
                      ],
                      TextFormField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        autofillHints: const [AutofillHints.email],
                        maxLength: 254,
                        decoration: const InputDecoration(
                          labelText: 'Email address',
                          prefixIcon: Icon(Icons.email_outlined),
                          counterText: '',
                        ),
                        validator: (value) {
                          final email = value?.trim() ?? '';
                          if (email.length > 254) {
                            return 'Use no more than 254 characters';
                          }
                          return RegExp(
                                r'^[^@\s]+@[^@\s]+\.[^@\s]+$',
                              ).hasMatch(email)
                              ? null
                              : 'Enter a valid email address';
                        },
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _passwordController,
                        obscureText: _obscurePassword,
                        maxLength: 128,
                        autofillHints: _register
                            ? const [AutofillHints.newPassword]
                            : const [AutofillHints.password],
                        textInputAction: TextInputAction.done,
                        onFieldSubmitted: (_) => _submitEmail(),
                        decoration: InputDecoration(
                          labelText: 'Password',
                          prefixIcon: const Icon(Icons.lock_outline_rounded),
                          counterText: '',
                          suffixIcon: IconButton(
                            onPressed: () => setState(
                              () => _obscurePassword = !_obscurePassword,
                            ),
                            icon: Icon(
                              _obscurePassword
                                  ? Icons.visibility_outlined
                                  : Icons.visibility_off_outlined,
                            ),
                          ),
                        ),
                        validator: (value) {
                          final length = value?.length ?? 0;
                          if (length < 10) return 'Use at least 10 characters';
                          if (length > 128) {
                            return 'Use no more than 128 characters';
                          }
                          return null;
                        },
                      ),
                    ],
                    if (!_useEmail && AppConfig.testingOtpCode.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: BncColors.sky,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Text(
                          'Testing mode: use ${AppConfig.testingOtpCode} for every mobile number.',
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(
                                color: BncColors.deepBlue,
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                      ),
                    ],
                    if (session.error != null) ...[
                      const SizedBox(height: 14),
                      _InlineError(message: session.error!),
                    ],
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        key: const ValueKey('request-otp-button'),
                        onPressed: session.busy
                            ? null
                            : (_useEmail ? _submitEmail : _requestCode),
                        child: session.busy
                            ? const SizedBox.square(
                                dimension: 20,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                            : Text(
                                _useEmail
                                    ? (_register
                                          ? 'Create account'
                                          : 'Sign in with email')
                                    : 'Send secure code',
                              ),
                      ),
                    ),
                    if (_useEmail)
                      Center(
                        child: TextButton(
                          onPressed: session.busy
                              ? null
                              : () => setState(() => _register = !_register),
                          child: Text(
                            _register
                                ? 'Already registered? Sign in'
                                : 'New to BNC? Create an account',
                          ),
                        ),
                      ),
                    const SizedBox(height: 16),
                    Text(
                      'Your login identifier is used only for authentication and account updates. It is never shown publicly without your choice.',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: BncColors.muted,
                        height: 1.45,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class OtpScreen extends ConsumerStatefulWidget {
  const OtpScreen({required this.phone, super.key, this.returnTo});

  final String phone;
  final String? returnTo;

  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  final _codeController = TextEditingController();
  Timer? _timer;
  int _remaining = 30;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    _timer?.cancel();
    _remaining = 30;
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_remaining <= 1) {
        timer.cancel();
        if (mounted) setState(() => _remaining = 0);
      } else if (mounted) {
        setState(() => _remaining--);
      }
    });
  }

  Future<void> _verify() async {
    if (_codeController.text.length != 6) return;
    final ok = await ref
        .read(sessionProvider.notifier)
        .verifyOtp(widget.phone, _codeController.text);
    if (!ok || !mounted) return;
    context.go(customerAuthDestination(widget.returnTo));
  }

  Future<void> _resend() async {
    final ok = await ref
        .read(sessionProvider.notifier)
        .requestOtp(widget.phone);
    if (ok) _startTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _codeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionProvider);
    final configuredTestCode = AppConfig.testingOtpCode;
    final availableCode = session.developmentCode ?? configuredTestCode;
    final isFixedTestMode = configuredTestCode.isNotEmpty;
    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 30),
          child: AutofillGroup(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Check your messages',
                  style: Theme.of(context).textTheme.headlineLarge,
                ),
                const SizedBox(height: 10),
                Text(
                  'Enter the 6-digit code sent to ${widget.phone}.',
                  style: Theme.of(
                    context,
                  ).textTheme.bodyLarge?.copyWith(color: BncColors.muted),
                ),
                if (availableCode.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  Card(
                    color: BncColors.sky,
                    child: ListTile(
                      title: Text(
                        isFixedTestMode
                            ? 'Temporary testing code'
                            : 'Development code',
                      ),
                      subtitle: Text(
                        availableCode,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: BncColors.deepBlue,
                          letterSpacing: 5,
                        ),
                      ),
                      trailing: TextButton(
                        onPressed: () {
                          _codeController.text = availableCode;
                          _verify();
                        },
                        child: const Text('Use code'),
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 28),
                TextField(
                  controller: _codeController,
                  autofocus: true,
                  keyboardType: TextInputType.number,
                  textInputAction: TextInputAction.done,
                  autofillHints: const [AutofillHints.oneTimeCode],
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(6),
                  ],
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    letterSpacing: 9,
                    fontWeight: FontWeight.w800,
                  ),
                  decoration: const InputDecoration(
                    labelText: 'One-time code',
                    hintText: '••••••',
                  ),
                  onChanged: (value) {
                    if (value.length == 6) _verify();
                  },
                  onSubmitted: (_) => _verify(),
                ),
                if (session.error != null) ...[
                  const SizedBox(height: 12),
                  _InlineError(message: session.error!),
                ],
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: session.busy ? null : _verify,
                    child: session.busy
                        ? const SizedBox.square(
                            dimension: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : const Text('Verify and continue'),
                  ),
                ),
                const SizedBox(height: 16),
                Center(
                  child: _remaining > 0
                      ? Text(
                          'You can request another code in $_remaining s',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(color: BncColors.muted),
                        )
                      : TextButton(
                          onPressed: session.busy ? null : _resend,
                          child: const Text('Send another code'),
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class EmailVerificationScreen extends ConsumerStatefulWidget {
  const EmailVerificationScreen({
    required this.email,
    super.key,
    this.returnTo,
  });

  final String email;
  final String? returnTo;

  @override
  ConsumerState<EmailVerificationScreen> createState() =>
      _EmailVerificationScreenState();
}

class _EmailVerificationScreenState
    extends ConsumerState<EmailVerificationScreen> {
  final _code = TextEditingController();

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    if (_code.text.length != 6) return;
    final ok = await ref
        .read(sessionProvider.notifier)
        .verifyEmail(widget.email, _code.text);
    if (!ok || !mounted) return;
    context.go(customerAuthDestination(widget.returnTo));
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Verify email')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 30),
          children: [
            Text(
              'Check your inbox',
              style: Theme.of(context).textTheme.headlineLarge,
            ),
            const SizedBox(height: 10),
            Text(
              'Enter the 6-digit verification code sent to ${widget.email}.',
              style: Theme.of(
                context,
              ).textTheme.bodyLarge?.copyWith(color: BncColors.muted),
            ),
            if (session.developmentCode != null) ...[
              const SizedBox(height: 18),
              Card(
                color: BncColors.sky,
                child: ListTile(
                  title: const Text('Development code'),
                  subtitle: Text(
                    session.developmentCode!,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: BncColors.deepBlue,
                      letterSpacing: 5,
                    ),
                  ),
                  trailing: TextButton(
                    onPressed: () {
                      _code.text = session.developmentCode!;
                      _verify();
                    },
                    child: const Text('Use code'),
                  ),
                ),
              ),
            ],
            const SizedBox(height: 24),
            TextField(
              controller: _code,
              autofocus: true,
              keyboardType: TextInputType.number,
              autofillHints: const [AutofillHints.oneTimeCode],
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                LengthLimitingTextInputFormatter(6),
              ],
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                letterSpacing: 9,
                fontWeight: FontWeight.w800,
              ),
              decoration: const InputDecoration(
                labelText: 'Verification code',
                hintText: '••••••',
              ),
              onChanged: (value) {
                if (value.length == 6) _verify();
              },
            ),
            if (session.error != null) ...[
              const SizedBox(height: 12),
              _InlineError(message: session.error!),
            ],
            const SizedBox(height: 18),
            ElevatedButton(
              onPressed: session.busy ? null : _verify,
              child: session.busy
                  ? const SizedBox.square(
                      dimension: 20,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : const Text('Verify and continue'),
            ),
          ],
        ),
      ),
    );
  }
}

class _InlineError extends StatelessWidget {
  const _InlineError({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      liveRegion: true,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.errorContainer,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(
              Icons.error_outline_rounded,
              color: Theme.of(context).colorScheme.onErrorContainer,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                message,
                style: TextStyle(
                  color: Theme.of(context).colorScheme.onErrorContainer,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

String _authStepLocation(String path, String? returnTo) {
  final destination = customerAuthDestination(returnTo);
  if (destination == '/home') return path;
  return '$path?returnTo=${Uri.encodeQueryComponent(destination)}';
}

String customerAuthDestination(String? value) {
  if (value == null || value.trim().isEmpty) return '/home';
  final uri = Uri.tryParse(value.trim());
  if (uri == null ||
      uri.hasScheme ||
      uri.hasAuthority ||
      !uri.path.startsWith('/')) {
    return '/home';
  }
  final path = uri.path;
  if (path == '/login' ||
      path == '/otp' ||
      path == '/email-verify' ||
      path == '/splash' ||
      path == '/onboarding' ||
      isWebsiteOnlyMobilePath(path)) {
    return '/home';
  }
  return uri.toString();
}

bool isWebsiteOnlyMobilePath(String path) {
  if (path.startsWith('/admin') ||
      path.startsWith('/business-dashboard') ||
      path.startsWith('/business-leads') ||
      path.startsWith('/business-catalogue') ||
      path.startsWith('/business-orders') ||
      path.startsWith('/business-manage') ||
      path.startsWith('/business-club') ||
      path == '/pricing') {
    return true;
  }
  const websiteOnlyBusinessPaths = {
    '/business/add',
    '/business/claim',
    '/business/onboarding',
    '/business/profile',
    '/business/reviews',
    '/business/enquiries',
    '/business/messages',
    '/business/notifications',
    '/business/payments',
    '/business/team',
    '/business/analytics',
    '/business/settings',
    '/business/success-stories',
    '/business/deliveries',
    '/business/bookings',
    '/business/jobs',
    '/business/referrals',
    '/business/products',
    '/business/services',
    '/business/offers',
    '/business/subscription',
    '/business/club',
  };
  return websiteOnlyBusinessPaths.any(
    (prefix) => path == prefix || path.startsWith('$prefix/'),
  );
}
