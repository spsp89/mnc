import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import 'catalog_api_config.dart';

class AppSettings {
  const AppSettings({
    this.siteName = 'BNC Nearu',
    this.tagline = 'Local shops, services, offers, and bookings in one place.',
    this.primaryColor = const Color(0xFF0B2F74),
    this.secondaryColor = const Color(0xFF1C4EA1),
    this.accentColor = const Color(0xFFF4B227),
    this.backgroundColor = const Color(0xFFF8F6EF),
    this.surfaceColor = const Color(0xFFFFFCF7),
    this.mutedTextColor = const Color(0xFF6B7E9D),
    this.logoUrl = '/assets/branding/bnc-logo.png',
    this.defaultCity = 'Kozhikode',
    this.defaultRegion = 'Kerala',
    this.supportPhone = '+91 98765 00000',
    this.supportWhatsApp = '+91 98765 00000',
    this.supportEmail = 'support@bncnearu.com',
    this.currencyCode = 'INR',
    this.enableDeals = true,
    this.enableDoctorBookings = true,
    this.updateIntervalSeconds = 30,
  });

  static const brandNavyFallback = Color(0xFF0B2F74);
  static const brandNavyBrightFallback = Color(0xFF1C4EA1);
  static const brandGoldFallback = Color(0xFFF4B227);
  static const brandCanvasFallback = Color(0xFFF8F6EF);
  static const brandSurfaceFallback = Color(0xFFFFFCF7);
  static const brandMutedFallback = Color(0xFF6B7E9D);

  final String siteName;
  final String tagline;
  final Color primaryColor;
  final Color secondaryColor;
  final Color accentColor;
  final Color backgroundColor;
  final Color surfaceColor;
  final Color mutedTextColor;
  final String logoUrl;
  final String defaultCity;
  final String defaultRegion;
  final String supportPhone;
  final String supportWhatsApp;
  final String supportEmail;
  final String currencyCode;
  final bool enableDeals;
  final bool enableDoctorBookings;
  final int updateIntervalSeconds;

  factory AppSettings.fromJson(Map<String, dynamic> json) {
    return AppSettings(
      siteName: _string(json['siteName'], 'BNC Nearu'),
      tagline: _string(
        json['tagline'],
        'Local shops, services, offers, and bookings in one place.',
      ),
      primaryColor: _color(json['primaryColor'], brandNavyFallback),
      secondaryColor: _color(json['secondaryColor'], brandNavyBrightFallback),
      accentColor: _color(json['accentColor'], brandGoldFallback),
      backgroundColor: _color(json['backgroundColor'], brandCanvasFallback),
      surfaceColor: _color(json['surfaceColor'], brandSurfaceFallback),
      mutedTextColor: _color(json['mutedTextColor'], brandMutedFallback),
      logoUrl: _string(json['logoUrl'], '/assets/branding/bnc-logo.png'),
      defaultCity: _string(json['defaultCity'], 'Kozhikode'),
      defaultRegion: _string(json['defaultRegion'], 'Kerala'),
      supportPhone: _string(json['supportPhone'], '+91 98765 00000'),
      supportWhatsApp: _string(json['supportWhatsApp'], '+91 98765 00000'),
      supportEmail: _string(json['supportEmail'], 'support@bncnearu.com'),
      currencyCode: _string(json['currencyCode'], 'INR'),
      enableDeals: json['enableDeals'] is bool ? json['enableDeals'] as bool : true,
      enableDoctorBookings: json['enableDoctorBookings'] is bool
          ? json['enableDoctorBookings'] as bool
          : true,
      updateIntervalSeconds: _int(json['updateIntervalSeconds'], 30),
    );
  }
}

class AppSettingsService {
  AppSettingsService({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  void close() {
    _client.close();
  }

  Future<AppSettings> fetchSettings() async {
    final response = await _client
        .get(
          catalogApiUri('/api/app-settings'),
          headers: const {'accept': 'application/json'},
        )
        .timeout(catalogApiTimeout);

    if (response.statusCode != 200) {
      throw Exception('Could not load app settings.');
    }

    final decoded = json.decode(response.body);
    if (decoded is Map<String, dynamic> && decoded['settings'] is Map<String, dynamic>) {
      return AppSettings.fromJson(decoded['settings'] as Map<String, dynamic>);
    }
    throw Exception('Unexpected app settings response.');
  }
}

String _string(Object? value, String fallback) {
  final text = value?.toString().trim() ?? '';
  return text.isEmpty ? fallback : text;
}

int _int(Object? value, int fallback) {
  if (value is int) {
    return value;
  }
  return int.tryParse(value?.toString() ?? '') ?? fallback;
}

Color _color(Object? value, Color fallback) {
  final text = value?.toString().trim().replaceFirst('#', '') ?? '';
  if (text.length != 6) {
    return fallback;
  }
  final parsed = int.tryParse('FF$text', radix: 16);
  return parsed == null ? fallback : Color(parsed);
}
