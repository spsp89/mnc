import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/core/state/app_state.dart';
import 'package:bnc_mobile/core/storage/app_preferences.dart';
import 'package:bnc_mobile/design_system/bnc_theme.dart';
import 'package:bnc_mobile/features/community/presentation/community_screens.dart';
import 'package:bnc_mobile/features/discovery/presentation/home_screen.dart';
import 'package:bnc_mobile/features/jobs/presentation/jobs_screens.dart';
import 'package:bnc_mobile/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('empty home collections show compact content instead of gaps', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({
      'onboarding_complete': true,
      'city': 'Kochi',
    });
    final preferences = await SharedPreferences.getInstance();
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(preferences),
          categoriesProvider.overrideWith((ref) async => const <Category>[]),
          featuredBusinessesProvider.overrideWith(
            (ref) async => const <Business>[],
          ),
          productsProvider.overrideWith((ref) async => const <Product>[]),
          bestSellerProductsProvider.overrideWith(
            (ref) async => const <Product>[],
          ),
          topServicesProvider.overrideWith((ref) async => const <Service>[]),
          offersProvider.overrideWith((ref) async => const <Offer>[]),
          liveCitiesProvider.overrideWith((ref) async => const <Json>[]),
          bookableServicesProvider.overrideWith(
            (ref) async => const <Service>[],
          ),
          liveJobsProvider.overrideWith((ref) async => const <Json>[]),
        ],
        child: MaterialApp(
          theme: BncTheme.light,
          supportedLocales: AppLocalizations.supportedLocales,
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          home: const HomeScreen(),
        ),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    final hero = tester.widget<DecoratedBox>(
      find.byKey(const ValueKey('home-hero-background')),
    );
    final heroDecoration = hero.decoration as BoxDecoration;
    expect(heroDecoration.color, BncColors.brand);
    expect(heroDecoration.gradient, isNull);
    expect(find.text('Find shops, services\n& deals near you'), findsOneWidget);
    expect(find.text('EVERYTHING LOCAL, ONE TAP AWAY'), findsNothing);
    expect(
      find.textContaining('Trusted local businesses and exclusive offers'),
      findsNothing,
    );
    expect(find.text('Explore what’s nearby'), findsNothing);
    expect(find.byIcon(Icons.notifications_none_rounded), findsNothing);
    expect(find.text('Star shops'), findsNothing);
    expect(find.text('Best match'), findsNothing);
    final page = find.byWidgetPredicate(
      (widget) =>
          widget is Scrollable && widget.axisDirection == AxisDirection.down,
    );
    await tester.scrollUntilVisible(
      find.text('Fresh deals are on the way'),
      240,
      scrollable: page,
    );
    expect(find.text('Fresh deals are on the way'), findsOneWidget);

    await tester.scrollUntilVisible(
      find.text('More categories are coming'),
      240,
      scrollable: page,
    );
    expect(find.text('More categories are coming'), findsOneWidget);
    expect(find.text('Can’t find the right option?'), findsNothing);
    await tester.scrollUntilVisible(
      find.text('No businesses found in this radius'),
      240,
      scrollable: page,
    );
    expect(find.text('No businesses found in this radius'), findsOneWidget);
    expect(
      tester
          .widget<ChoiceChip>(find.widgetWithText(ChoiceChip, '5 km'))
          .selected,
      isTrue,
    );
    await tester.tap(find.widgetWithText(ChoiceChip, '10 km'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
    expect(preferences.getInt('search_radius_km'), 10);

    await tester.scrollUntilVisible(
      find.text('No products to show yet'),
      240,
      scrollable: page,
    );
    expect(find.text('No products to show yet'), findsOneWidget);
    expect(find.text('Shop local. Enter the weekly lucky draw.'), findsNothing);
    expect(tester.takeException(), isNull);
  });

  testWidgets('home exposes live appointment and local job discovery', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({
      'onboarding_complete': true,
      'city': 'Kochi',
    });
    final preferences = await SharedPreferences.getInstance();
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(preferences),
          categoriesProvider.overrideWith((ref) async => const <Category>[]),
          featuredBusinessesProvider.overrideWith(
            (ref) async => const <Business>[],
          ),
          productsProvider.overrideWith((ref) async => const <Product>[]),
          bestSellerProductsProvider.overrideWith(
            (ref) async => const <Product>[],
          ),
          topServicesProvider.overrideWith((ref) async => const <Service>[]),
          offersProvider.overrideWith((ref) async => const <Offer>[]),
          liveCitiesProvider.overrideWith((ref) async => const <Json>[]),
          bookableServicesProvider.overrideWith(
            (ref) async => const [
              Service(
                id: 'service-1',
                name: 'Dental consultation',
                startingPrice: 500,
                pricingUnit: 'per visit',
                businessName: 'Kochi Dental Care',
                businessLocality: 'Kaloor',
                duration: '30 min',
              ),
            ],
          ),
          liveJobsProvider.overrideWith(
            (ref) async => const [
              {
                'id': 'job-1',
                'title': 'Clinic receptionist',
                'employmentType': 'FULL_TIME',
                'city': 'Kochi',
                'salaryMin': 18000,
                'salaryMax': 24000,
                'business': {'name': 'Kochi Dental Care'},
              },
            ],
          ),
        ],
        child: MaterialApp(
          theme: BncTheme.light,
          supportedLocales: AppLocalizations.supportedLocales,
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          home: const HomeScreen(),
        ),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    final page = find.byWidgetPredicate(
      (widget) =>
          widget is Scrollable && widget.axisDirection == AxisDirection.down,
    );
    await tester.scrollUntilVisible(
      find.text('Book a local expert'),
      260,
      scrollable: page,
    );
    expect(find.text('Dental consultation'), findsOneWidget);

    await tester.scrollUntilVisible(
      find.text('Latest local jobs'),
      260,
      scrollable: page,
    );
    expect(find.text('Clinic receptionist'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
