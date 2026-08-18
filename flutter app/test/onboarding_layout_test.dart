import 'package:bnc_mobile/core/storage/app_preferences.dart';
import 'package:bnc_mobile/design_system/bnc_theme.dart';
import 'package:bnc_mobile/design_system/components.dart';
import 'package:bnc_mobile/features/onboarding/presentation/onboarding_screens.dart';
import 'package:bnc_mobile/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('splash is flat blue with only a large BNC wordmark', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(theme: BncTheme.light, home: const SplashBrand()),
    );

    final scaffold = tester.widget<Scaffold>(find.byType(Scaffold));
    final wordmark = tester.widget<Text>(find.text('BNC'));

    expect(scaffold.backgroundColor, BncColors.brand);
    expect(wordmark.style?.fontSize, 68);
    expect(wordmark.style?.fontWeight, FontWeight.w900);
    expect(wordmark.style?.color, Colors.white);
    expect(find.byType(BncLogo), findsNothing);
    expect(find.byType(CircularProgressIndicator), findsNothing);
    expect(find.text('Trusted local discovery across Kerala'), findsNothing);
  });

  testWidgets('onboarding pages are immersive and card-free', (tester) async {
    SharedPreferences.setMockInitialValues(const {});
    final preferences = await SharedPreferences.getInstance();
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      ProviderScope(
        overrides: [sharedPreferencesProvider.overrideWithValue(preferences)],
        child: MaterialApp(
          theme: BncTheme.light,
          supportedLocales: AppLocalizations.supportedLocales,
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          home: const OnboardingScreen(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Your neighbourhood, one tap away.'), findsOneWidget);
    expect(find.text('DISCOVER LOCAL'), findsOneWidget);
    expect(find.text('BNC'), findsOneWidget);
    expect(find.byType(BncLogo), findsNothing);
    expect(find.text('Made for Kerala'), findsNothing);
    expect(find.text('18k+ local businesses'), findsNothing);
    expect(find.byType(Card), findsNothing);

    await tester.drag(find.byType(PageView), const Offset(-360, 0));
    await tester.pumpAndSettle();
    expect(find.text('See what’s truly nearby'), findsOneWidget);
    expect(find.text('RIGHT AROUND YOU'), findsOneWidget);
    expect(find.text('Accurate distance'), findsNothing);
    expect(find.text('Across Kerala'), findsNothing);

    await tester.drag(find.byType(PageView), const Offset(-360, 0));
    await tester.pumpAndSettle();
    expect(find.text('Choose with confidence'), findsOneWidget);
    expect(find.text('TRUSTED CHOICES'), findsOneWidget);
    expect(find.text('Verified profiles'), findsNothing);
    expect(find.text('Genuine feedback'), findsNothing);
    expect(find.byType(Card), findsNothing);
    expect(tester.takeException(), isNull);
  });
}
