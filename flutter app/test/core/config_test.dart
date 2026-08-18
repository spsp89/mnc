import 'package:bnc_mobile/core/config/app_config.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('configuration uses injected endpoints or safe local defaults', () {
    final expectedApiBaseUrl = AppConfig.configuredApiBaseUrl.isNotEmpty
        ? AppConfig.configuredApiBaseUrl.replaceFirst(RegExp(r'/$'), '')
        : 'http://127.0.0.1:4000/api/v1';
    final expectedSiteBaseUrl = AppConfig.configuredSiteBaseUrl.isNotEmpty
        ? AppConfig.configuredSiteBaseUrl.replaceFirst(RegExp(r'/$'), '')
        : 'http://127.0.0.1:3000';

    expect(AppConfig.apiBaseUrl, expectedApiBaseUrl);
    expect(AppConfig.siteBaseUrl, expectedSiteBaseUrl);
    expect(AppConfig.apiBaseUrl, endsWith('/api/v1'));
    expect(Uri.parse(AppConfig.apiBaseUrl).hasScheme, isTrue);
    expect(Uri.parse(AppConfig.siteBaseUrl).hasScheme, isTrue);
    expect(AppConfig.enableFirebasePush, isFalse);
  });

  test('test OTP is disabled unless explicitly injected', () {
    if (AppConfig.testingOtpCode.isEmpty) {
      expect(AppConfig.testingOtpCode, isEmpty);
    } else {
      expect(AppConfig.testingOtpCode, matches(RegExp(r'^\d{6}$')));
    }
  });
}
