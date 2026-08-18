import 'package:bnc_mobile/design_system/components.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('BNC logo exposes its semantic brand label', (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(const MaterialApp(home: Scaffold(body: BncLogo())));

    expect(find.text('BNC'), findsOneWidget);
    expect(
      tester.getSemantics(find.byType(BncLogo)).label,
      'BNC — Business Near & Close',
    );
    semantics.dispose();
  });
}
