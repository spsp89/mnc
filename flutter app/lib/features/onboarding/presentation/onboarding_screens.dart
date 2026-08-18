import 'dart:async';

import 'package:bnc_mobile/core/state/app_state.dart';
import 'package:bnc_mobile/core/storage/app_preferences.dart';
import 'package:bnc_mobile/design_system/bnc_theme.dart';
import 'package:bnc_mobile/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    unawaited(
      SystemChrome.setEnabledSystemUIMode(
        SystemUiMode.manual,
        overlays: SystemUiOverlay.values,
      ),
    );
    unawaited(_continue());
  }

  Future<void> _continue() async {
    await Future<void>.delayed(const Duration(milliseconds: 1150));
    while (ref.read(sessionProvider).restoring) {
      await Future<void>.delayed(const Duration(milliseconds: 60));
    }
    if (!mounted) return;
    final onboarded = ref.read(appSettingsProvider).onboardingComplete;
    await SystemChrome.setEnabledSystemUIMode(
      SystemUiMode.manual,
      overlays: SystemUiOverlay.values,
    );
    if (!mounted) return;
    context.go(onboarded ? '/home' : '/onboarding');
  }

  @override
  Widget build(BuildContext context) => const SplashBrand();
}

class SplashBrand extends StatelessWidget {
  const SplashBrand({super.key});

  @override
  Widget build(BuildContext context) {
    const overlayStyle = SystemUiOverlayStyle(
      statusBarColor: BncColors.brand,
      statusBarIconBrightness: Brightness.light,
      statusBarBrightness: Brightness.dark,
      systemNavigationBarColor: BncColors.brand,
      systemNavigationBarIconBrightness: Brightness.light,
      systemNavigationBarDividerColor: BncColors.brand,
    );

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: overlayStyle,
      child: Scaffold(
        backgroundColor: BncColors.brand,
        body: Center(
          child: Text(
            'BNC',
            style: Theme.of(context).textTheme.displayLarge?.copyWith(
              color: Colors.white,
              fontSize: 68,
              fontWeight: FontWeight.w900,
              letterSpacing: 5,
              height: 1,
            ),
          ),
        ),
      ),
    );
  }
}

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _controller = PageController();
  int _page = 0;
  bool _locating = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _finish() async {
    await ref.read(appSettingsProvider.notifier).completeOnboarding();
    if (mounted) context.go('/home');
  }

  Future<void> _requestLocation() async {
    setState(() => _locating = true);
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        if (mounted) _chooseCity();
        return;
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
      await _finish();
    } on Object {
      if (mounted) _chooseCity();
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  Future<void> _chooseCity() async {
    const cities = bncCityCoordinates;
    final selected = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                AppLocalizations.of(context).chooseCity,
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 12),
              ...cities.keys.map(
                (city) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(
                    Icons.location_city_rounded,
                    color: BncColors.brand,
                  ),
                  title: Text(city),
                  trailing: const Icon(Icons.chevron_right_rounded),
                  onTap: () => Navigator.pop(context, city),
                ),
              ),
            ],
          ),
        ),
      ),
    );
    if (selected == null) return;
    final coordinates = cities[selected]!;
    await ref
        .read(appSettingsProvider.notifier)
        .setLocation(
          city: selected,
          latitude: coordinates.$1,
          longitude: coordinates.$2,
        );
    await _finish();
  }

  @override
  Widget build(BuildContext context) {
    final strings = AppLocalizations.of(context);
    final pages = [
      _OnboardingPage(
        title: strings.welcome,
        body: strings.welcomeBody,
        kicker: 'DISCOVER LOCAL',
        colors: const [Color(0xFF06185B), Color(0xFF0847D5), Color(0xFF0787FF)],
      ),
      _OnboardingPage(
        title: strings.locationTitle,
        body: strings.locationBody,
        kicker: 'RIGHT AROUND YOU',
        colors: const [Color(0xFF043F57), Color(0xFF087D7B), Color(0xFF16B785)],
      ),
      _OnboardingPage(
        title: strings.trustTitle,
        body: strings.trustBody,
        kicker: 'TRUSTED CHOICES',
        colors: const [Color(0xFF32105C), Color(0xFF7A278D), Color(0xFFF06A49)],
        reservesExtraBottomSpace: true,
      ),
    ];
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
        statusBarBrightness: Brightness.dark,
        systemNavigationBarColor: Colors.transparent,
        systemNavigationBarDividerColor: Colors.transparent,
        systemNavigationBarIconBrightness: Brightness.light,
      ),
      child: Scaffold(
        backgroundColor: pages[_page].colors.first,
        body: Stack(
          children: [
            PageView(
              controller: _controller,
              onPageChanged: (value) => setState(() => _page = value),
              children: pages,
            ),
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 10, 20, 14),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Text(
                          'BNC',
                          style: Theme.of(context).textTheme.headlineSmall
                              ?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w900,
                                letterSpacing: .4,
                              ),
                        ),
                        const Spacer(),
                        TextButton(
                          onPressed: _finish,
                          style: TextButton.styleFrom(
                            foregroundColor: Colors.white,
                            backgroundColor: Colors.white.withValues(
                              alpha: .12,
                            ),
                            side: BorderSide(
                              color: Colors.white.withValues(alpha: .2),
                            ),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 10,
                            ),
                          ),
                          child: Text(strings.skip),
                        ),
                      ],
                    ),
                    const Spacer(),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(
                        pages.length,
                        (index) => AnimatedContainer(
                          duration: const Duration(milliseconds: 260),
                          curve: Curves.easeOutCubic,
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          width: index == _page ? 34 : 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: index == _page
                                ? Colors.white
                                : Colors.white.withValues(alpha: .32),
                            borderRadius: BorderRadius.circular(99),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),
                    AnimatedSize(
                      duration: const Duration(milliseconds: 280),
                      curve: Curves.easeOutCubic,
                      child: _page < pages.length - 1
                          ? SizedBox(
                              key: const ValueKey('continue'),
                              width: double.infinity,
                              child: ElevatedButton.icon(
                                onPressed: () => _controller.nextPage(
                                  duration: const Duration(milliseconds: 420),
                                  curve: Curves.easeOutCubic,
                                ),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.white,
                                  foregroundColor: pages[_page].colors.first,
                                  minimumSize: const Size.fromHeight(58),
                                  elevation: 0,
                                ),
                                icon: const Icon(
                                  Icons.arrow_forward_rounded,
                                  size: 20,
                                ),
                                label: Text(strings.continueLabel),
                              ),
                            )
                          : Column(
                              key: const ValueKey('location-actions'),
                              children: [
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton.icon(
                                    onPressed: _locating
                                        ? null
                                        : _requestLocation,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.white,
                                      foregroundColor:
                                          pages[_page].colors.first,
                                      disabledBackgroundColor: Colors.white70,
                                      minimumSize: const Size.fromHeight(58),
                                      elevation: 0,
                                    ),
                                    icon: _locating
                                        ? SizedBox.square(
                                            dimension: 18,
                                            child: CircularProgressIndicator(
                                              color: pages[_page].colors.first,
                                              strokeWidth: 2,
                                            ),
                                          )
                                        : const Icon(Icons.my_location_rounded),
                                    label: Text(strings.useLocation),
                                  ),
                                ),
                                const SizedBox(height: 10),
                                SizedBox(
                                  width: double.infinity,
                                  child: OutlinedButton.icon(
                                    onPressed: _chooseCity,
                                    style: OutlinedButton.styleFrom(
                                      foregroundColor: Colors.white,
                                      side: BorderSide(
                                        color: Colors.white.withValues(
                                          alpha: .55,
                                        ),
                                      ),
                                      backgroundColor: Colors.white.withValues(
                                        alpha: .08,
                                      ),
                                      minimumSize: const Size.fromHeight(54),
                                    ),
                                    icon: const Icon(
                                      Icons.location_city_rounded,
                                      size: 20,
                                    ),
                                    label: Text(strings.chooseCity),
                                  ),
                                ),
                              ],
                            ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OnboardingPage extends StatelessWidget {
  const _OnboardingPage({
    required this.title,
    required this.body,
    required this.kicker,
    required this.colors,
    this.reservesExtraBottomSpace = false,
  });

  final String title;
  final String body;
  final String kicker;
  final List<Color> colors;
  final bool reservesExtraBottomSpace;

  @override
  Widget build(BuildContext context) {
    final media = MediaQuery.of(context);
    return Semantics(
      label: '$title. $body',
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: colors,
            stops: const [0, .55, 1],
          ),
        ),
        child: Stack(
          children: [
            Positioned.fill(
              child: CustomPaint(
                painter: _OnboardingBackdropPainter(accent: colors.last),
              ),
            ),
            Padding(
              padding: EdgeInsets.fromLTRB(
                22,
                media.padding.top + 78,
                22,
                media.padding.bottom + (reservesExtraBottomSpace ? 202 : 128),
              ),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final compact = constraints.maxHeight < 570;
                  return Column(
                    children: [
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 13,
                          vertical: 7,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: .12),
                          borderRadius: BorderRadius.circular(99),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: .2),
                          ),
                        ),
                        child: Text(
                          kicker,
                          style: Theme.of(context).textTheme.labelSmall
                              ?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 1.2,
                              ),
                        ),
                      ),
                      SizedBox(height: compact ? 10 : 16),
                      Text(
                        title,
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.displaySmall
                            ?.copyWith(
                              color: Colors.white,
                              fontSize: compact ? 29 : 34,
                              height: 1.04,
                              letterSpacing: -1,
                            ),
                      ),
                      SizedBox(height: compact ? 8 : 12),
                      Text(
                        body,
                        textAlign: TextAlign.center,
                        maxLines: compact ? 2 : 3,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          color: Colors.white.withValues(alpha: .78),
                          height: 1.35,
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OnboardingBackdropPainter extends CustomPainter {
  const _OnboardingBackdropPainter({required this.accent});

  final Color accent;

  @override
  void paint(Canvas canvas, Size size) {
    final glow = Paint()
      ..shader =
          RadialGradient(
            colors: [
              accent.withValues(alpha: .34),
              accent.withValues(alpha: 0),
            ],
          ).createShader(
            Rect.fromCircle(
              center: Offset(size.width * .86, size.height * .2),
              radius: size.width * .72,
            ),
          );
    canvas.drawRect(Offset.zero & size, glow);

    final soft = Paint()..color = Colors.white.withValues(alpha: .045);
    canvas.drawCircle(
      Offset(size.width * 1.02, size.height * .42),
      size.width * .44,
      soft,
    );
    canvas.drawCircle(
      Offset(-size.width * .08, size.height * .78),
      size.width * .34,
      soft,
    );

    final route = Paint()
      ..color = Colors.white.withValues(alpha: .1)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;
    final path = Path()
      ..moveTo(-20, size.height * .7)
      ..cubicTo(
        size.width * .18,
        size.height * .59,
        size.width * .64,
        size.height * .78,
        size.width + 20,
        size.height * .61,
      );
    canvas.drawPath(path, route);

    final dot = Paint()..color = Colors.white.withValues(alpha: .14);
    for (var index = 0; index < 10; index++) {
      final x = size.width * ((index * 37) % 100) / 100;
      final y = size.height * (.16 + ((index * 23) % 68) / 100);
      canvas.drawCircle(Offset(x, y), index.isEven ? 2.2 : 1.4, dot);
    }
  }

  @override
  bool shouldRepaint(covariant _OnboardingBackdropPainter oldDelegate) =>
      oldDelegate.accent != accent;
}
