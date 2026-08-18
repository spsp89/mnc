import 'package:bnc_mobile/design_system/bnc_theme.dart';
import 'package:bnc_mobile/features/community/presentation/community_screens.dart';
import 'package:bnc_mobile/features/jobs/presentation/jobs_screens.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('unsupported services never invent local records', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(theme: BncTheme.light, home: const JobsScreen()),
    );
    expect(find.text('No live jobs available'), findsOneWidget);

    await tester.pumpWidget(
      MaterialApp(theme: BncTheme.light, home: const BookingsScreen()),
    );
    expect(find.text('No live appointments'), findsOneWidget);
  });
}
