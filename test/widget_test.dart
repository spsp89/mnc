import 'package:flutter_test/flutter_test.dart';

import 'package:bnc/main.dart';

void main() {
  testWidgets('renders BNC splash and then the landing page', (tester) async {
    await tester.pumpWidget(const NearuApp());

    expect(find.text('BNC'), findsOneWidget);

    await tester.pump(const Duration(seconds: 3));
    await tester.pumpAndSettle();

    expect(find.text('Discover'), findsOneWidget);
    expect(find.text('Featured near you'), findsOneWidget);
  });
}
