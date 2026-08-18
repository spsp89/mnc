import 'dart:convert';

import 'package:bnc_mobile/core/models/models.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

final sharedPreferencesProvider = Provider<SharedPreferences>(
  (ref) => throw UnimplementedError('SharedPreferences must be overridden.'),
);

const _liveOnlyStorageMarker = 'live_only_storage_v1';

FlutterSecureStorage createSecureStorage() => const FlutterSecureStorage(
  aOptions: AndroidOptions(),
  iOptions: IOSOptions(
    accessibility: KeychainAccessibility.first_unlock_this_device,
  ),
);

/// Clears record-bearing state left by builds that predate the live-only
/// repository. The marker makes this a one-time in-place upgrade migration.
Future<void> migrateToLiveOnlyStorage(
  SharedPreferences preferences, {
  Future<void> Function()? clearSecureSession,
}) async {
  if (preferences.getBool(_liveOnlyStorageMarker) == true) return;

  final clearSession = clearSecureSession ?? createSecureStorage().deleteAll;
  await clearSession();
  const obsoleteKeys = {
    'saved_businesses',
    'recent_searches',
    'applied_jobs',
    'booked_appointments',
    'business_club_member',
    'blocked_businesses',
    'business_mode',
  };
  final recordKeys = preferences
      .getKeys()
      .where((key) => obsoleteKeys.contains(key) || key.startsWith('cache_'))
      .toList();
  for (final key in recordKeys) {
    await preferences.remove(key);
  }
  await preferences.setBool(_liveOnlyStorageMarker, true);
}

final secureStorageProvider = Provider<FlutterSecureStorage>(
  (ref) => createSecureStorage(),
);

const bncCityCoordinates = <String, (double, double)>{
  'Kochi': (9.9312, 76.2673),
  'Kozhikode': (11.2588, 75.7804),
  'Thiruvananthapuram': (8.5241, 76.9366),
  'Thrissur': (10.5276, 76.2144),
  'Kannur': (11.8745, 75.3704),
  'Kottayam': (9.5916, 76.5222),
};

const currentAreaLocation = 'Current area';

class AppSettings {
  const AppSettings({
    this.onboardingComplete = false,
    this.locale = const Locale('en'),
    this.city = 'Kochi',
    this.latitude = 9.9312,
    this.longitude = 76.2673,
    this.searchRadiusKm = 5,
    this.businessMode = false,
  });

  final bool onboardingComplete;
  final Locale locale;
  final String city;
  final double latitude;
  final double longitude;
  final int searchRadiusKm;
  final bool businessMode;

  bool get usesDeviceLocation => city == currentAreaLocation;
  String get apiLocation => usesDeviceLocation ? '' : city;
  bool get hasSearchCoordinates =>
      usesDeviceLocation || bncCityCoordinates.containsKey(city);
  double? get apiLatitude => hasSearchCoordinates ? latitude : null;
  double? get apiLongitude => hasSearchCoordinates ? longitude : null;

  AppSettings copyWith({
    bool? onboardingComplete,
    Locale? locale,
    String? city,
    double? latitude,
    double? longitude,
    int? searchRadiusKm,
    bool? businessMode,
  }) => AppSettings(
    onboardingComplete: onboardingComplete ?? this.onboardingComplete,
    locale: locale ?? this.locale,
    city: city ?? this.city,
    latitude: latitude ?? this.latitude,
    longitude: longitude ?? this.longitude,
    searchRadiusKm: searchRadiusKm ?? this.searchRadiusKm,
    businessMode: businessMode ?? this.businessMode,
  );
}

class AppSettingsController extends StateNotifier<AppSettings> {
  AppSettingsController(this._preferences)
    : super(
        AppSettings(
          onboardingComplete:
              _preferences.getBool('onboarding_complete') ?? false,
          locale: Locale(_preferences.getString('locale') ?? 'en'),
          city: _preferences.getString('city') ?? 'Kochi',
          latitude: _preferences.getDouble('latitude') ?? 9.9312,
          longitude: _preferences.getDouble('longitude') ?? 76.2673,
          searchRadiusKm: _preferences.getInt('search_radius_km') ?? 5,
          businessMode: _preferences.getBool('business_mode') ?? false,
        ),
      );

  final SharedPreferences _preferences;

  Future<void> completeOnboarding() async {
    state = state.copyWith(onboardingComplete: true);
    await _preferences.setBool('onboarding_complete', true);
  }

  Future<void> setLocale(Locale locale) async {
    state = state.copyWith(locale: locale);
    await _preferences.setString('locale', locale.languageCode);
  }

  Future<void> setLocation({
    required String city,
    required double latitude,
    required double longitude,
  }) async {
    state = state.copyWith(
      city: city,
      latitude: latitude,
      longitude: longitude,
    );
    await Future.wait([
      _preferences.setString('city', city),
      _preferences.setDouble('latitude', latitude),
      _preferences.setDouble('longitude', longitude),
    ]);
  }

  Future<void> setSearchRadius(int radiusKm) async {
    if (!const {1, 3, 5, 10, 25, 50}.contains(radiusKm)) {
      throw ArgumentError.value(radiusKm, 'radiusKm');
    }
    state = state.copyWith(searchRadiusKm: radiusKm);
    await _preferences.setInt('search_radius_km', radiusKm);
  }

  Future<void> setBusinessMode(bool enabled) async {
    state = state.copyWith(businessMode: enabled);
    await _preferences.setBool('business_mode', enabled);
  }
}

final appSettingsProvider =
    StateNotifierProvider<AppSettingsController, AppSettings>(
      (ref) => AppSettingsController(ref.watch(sharedPreferencesProvider)),
    );

class SessionStore {
  SessionStore(this._secureStorage);

  static const _accessTokenKey = 'bnc_access_token';
  static const _refreshTokenKey = 'bnc_refresh_token';
  static const _userKey = 'bnc_session_user';

  final FlutterSecureStorage _secureStorage;

  Future<String?> get accessToken => _secureStorage.read(key: _accessTokenKey);
  Future<String?> get refreshToken =>
      _secureStorage.read(key: _refreshTokenKey);

  Future<UserProfile?> get user async {
    final value = await _secureStorage.read(key: _userKey);
    if (value == null || value.isEmpty) return null;
    try {
      return UserProfile.fromJson(
        Map<String, dynamic>.from(jsonDecode(value) as Map),
      );
    } on FormatException {
      return null;
    }
  }

  Future<void> saveSession({
    required String accessToken,
    required String refreshToken,
    required Json user,
  }) async {
    await _secureStorage.write(key: _accessTokenKey, value: accessToken);
    await _secureStorage.write(key: _refreshTokenKey, value: refreshToken);
    await _secureStorage.write(key: _userKey, value: jsonEncode(user));
  }

  Future<void> updateTokens({
    required String accessToken,
    required String refreshToken,
    Json? user,
  }) async {
    await _secureStorage.write(key: _accessTokenKey, value: accessToken);
    await _secureStorage.write(key: _refreshTokenKey, value: refreshToken);
    if (user != null) {
      await _secureStorage.write(key: _userKey, value: jsonEncode(user));
    }
  }

  Future<void> clear() => _secureStorage.deleteAll();
}

final sessionStoreProvider = Provider<SessionStore>(
  (ref) => SessionStore(ref.watch(secureStorageProvider)),
);
