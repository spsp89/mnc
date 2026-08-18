import 'package:bnc_mobile/core/storage/app_preferences.dart';
import 'package:bnc_mobile/design_system/bnc_theme.dart';
import 'package:bnc_mobile/features/auth/presentation/auth_screens.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('login accepts only a live phone OTP flow', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final preferences = await SharedPreferences.getInstance();
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      ProviderScope(
        overrides: [sharedPreferencesProvider.overrideWithValue(preferences)],
        child: MaterialApp(theme: BncTheme.light, home: const LoginScreen()),
      ),
    );
    await tester.pump();

    expect(find.text('Welcome to BNC'), findsOneWidget);
    expect(find.text('Mobile number'), findsOneWidget);
    expect(find.text('Send secure code'), findsOneWidget);
    expect(find.text('Customer'), findsNothing);
    expect(find.text('Administrator'), findsNothing);
  });
}
