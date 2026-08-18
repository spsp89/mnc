import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('mobile route graph exposes only the customer workspace', () {
    final router = File('lib/app/router.dart').readAsStringSync();

    expect(router, isNot(contains('features/admin/')));
    expect(router, isNot(contains('features/business_manager/')));
    expect(router, isNot(contains("path: '/admin")));
    expect(router, isNot(contains("path: '/business-dashboard'")));
    expect(router, isNot(contains("path: '/business-leads'")));
    expect(router, isNot(contains("path: '/business-catalogue'")));
    expect(router, isNot(contains("path: '/business-orders'")));
    expect(router, isNot(contains("path: '/business-manage'")));
    expect(router, isNot(contains("path: '/business-club'")));
    expect(router, isNot(contains("path: '/pricing'")));
    expect(router, isNot(contains('BusinessShell')));
    expect(router, contains("path: '/business/:slug'"));
    expect(router, isNot(contains('AdminPanelScreen')));
  });

  test('customer account has no merchant workspace entry point', () {
    final account = File(
      'lib/features/account/presentation/account_screens.dart',
    ).readAsStringSync();

    expect(account, isNot(contains('For business owners')));
    expect(account, isNot(contains('Open merchant workspace')));
    expect(account, isNot(contains('List or claim a business')));
  });

  test('mobile login has no owner or administrator portal selector', () {
    final login = File(
      'lib/features/auth/presentation/auth_screens.dart',
    ).readAsStringSync();

    expect(login, isNot(contains('Business owner')));
    expect(login, isNot(contains('Administrator')));
    expect(login, isNot(contains('Business mode')));
  });

  test('customer notification controls expose no owner event preferences', () {
    final notifications = File(
      'lib/features/notifications/presentation/notifications_screen.dart',
    ).readAsStringSync();

    expect(notifications, isNot(contains('NEW_LEAD')));
    expect(notifications, isNot(contains('NEW_ENQUIRY')));
    expect(notifications, isNot(contains('New matching leads')));
    expect(notifications, contains('REVIEW_REPLY'));
    expect(notifications, contains('SUPPORT_UPDATE'));
  });

  test(
    'customer search uses native speech recognition without fake results',
    () {
      final search = File(
        'lib/features/discovery/presentation/search_screen.dart',
      ).readAsStringSync();

      expect(search, contains('SpeechToText'));
      expect(search, contains('SpeechListenOptions'));
      expect(search, contains('SpeechRecognitionResult'));
      expect(search, contains('Search by voice'));
      expect(search, isNot(contains('photographer near me')));
    },
  );
}
