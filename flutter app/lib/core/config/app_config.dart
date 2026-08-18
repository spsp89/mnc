import 'dart:io';

import 'package:flutter/foundation.dart';

abstract final class AppConfig {
  static const String configuredApiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: '',
  );

  static const String configuredSiteBaseUrl = String.fromEnvironment(
    'SITE_BASE_URL',
    defaultValue: '',
  );

  static const String mapboxToken = String.fromEnvironment(
    'MAPBOX_ACCESS_TOKEN',
  );

  static const String razorpayKeyId = String.fromEnvironment('RAZORPAY_KEY_ID');

  static const bool enableFirebasePush = bool.fromEnvironment(
    'ENABLE_FIREBASE_PUSH',
    defaultValue: false,
  );

  static const String testingOtpCode = String.fromEnvironment(
    'TEST_OTP_CODE',
    defaultValue: '',
  );

  static String get apiBaseUrl {
    if (configuredApiBaseUrl.isNotEmpty) {
      return configuredApiBaseUrl.replaceFirst(RegExp(r'/$'), '');
    }
    if (!kIsWeb && Platform.isAndroid) {
      return 'http://10.0.2.2:4000/api/v1';
    }
    return 'http://127.0.0.1:4000/api/v1';
  }

  static String get siteBaseUrl {
    if (configuredSiteBaseUrl.isNotEmpty) {
      return configuredSiteBaseUrl.replaceFirst(RegExp(r'/$'), '');
    }
    return 'http://127.0.0.1:3000';
  }

  static String get mapTileUrl {
    if (mapboxToken.isNotEmpty) {
      return 'https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/'
          '256/{z}/{x}/{y}@2x?access_token=$mapboxToken';
    }
    return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  }
}
