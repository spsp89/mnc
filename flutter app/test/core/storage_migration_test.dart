import 'package:bnc_mobile/core/storage/app_preferences.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test(
    'live-only migration clears legacy record-bearing storage once',
    () async {
      SharedPreferences.setMockInitialValues({
        'onboarding_complete': true,
        'city': 'Kochi',
        'saved_businesses': ['old-business'],
        'recent_searches': ['old-query'],
        'applied_jobs': ['old-job'],
        'booked_appointments': ['old-appointment'],
        'business_club_member': true,
        'blocked_businesses': ['old-block'],
        'business_mode': true,
        'cache_catalogue': '{"record":true}',
      });
      final preferences = await SharedPreferences.getInstance();
      var secureClearCount = 0;

      await migrateToLiveOnlyStorage(
        preferences,
        clearSecureSession: () async => secureClearCount++,
      );

      expect(secureClearCount, 1);
      expect(preferences.getBool('onboarding_complete'), isTrue);
      expect(preferences.getString('city'), 'Kochi');
      for (final key in [
        'saved_businesses',
        'recent_searches',
        'applied_jobs',
        'booked_appointments',
        'business_club_member',
        'blocked_businesses',
        'business_mode',
        'cache_catalogue',
      ]) {
        expect(preferences.containsKey(key), isFalse, reason: key);
      }

      await migrateToLiveOnlyStorage(
        preferences,
        clearSecureSession: () async => secureClearCount++,
      );
      expect(secureClearCount, 1);
    },
  );

  test('customer search radius loads, validates and persists', () async {
    SharedPreferences.setMockInitialValues({'search_radius_km': 10});
    final preferences = await SharedPreferences.getInstance();
    final controller = AppSettingsController(preferences);

    expect(controller.state.searchRadiusKm, 10);

    await controller.setSearchRadius(25);
    expect(controller.state.searchRadiusKm, 25);
    expect(preferences.getInt('search_radius_km'), 25);

    await expectLater(controller.setSearchRadius(7), throwsArgumentError);
    expect(controller.state.searchRadiusKm, 25);
  });

  test('device location uses coordinates without a fake city filter', () async {
    SharedPreferences.setMockInitialValues({});
    final preferences = await SharedPreferences.getInstance();
    final controller = AppSettingsController(preferences);

    await controller.setLocation(
      city: currentAreaLocation,
      latitude: 10.01,
      longitude: 76.31,
    );

    expect(controller.state.apiLocation, isEmpty);
    expect(controller.state.apiLatitude, 10.01);
    expect(controller.state.apiLongitude, 76.31);
    expect(preferences.getString('city'), currentAreaLocation);
  });

  test('unknown city does not reuse unrelated search coordinates', () async {
    SharedPreferences.setMockInitialValues({
      'city': 'Palakkad',
      'latitude': 9.9312,
      'longitude': 76.2673,
    });
    final preferences = await SharedPreferences.getInstance();
    final controller = AppSettingsController(preferences);

    expect(controller.state.apiLocation, 'Palakkad');
    expect(controller.state.apiLatitude, isNull);
    expect(controller.state.apiLongitude, isNull);
  });
}
