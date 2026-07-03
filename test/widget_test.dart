import 'package:flutter_test/flutter_test.dart';

import 'package:bnc/main.dart';

void main() {
  testWidgets('renders nearu landing page', (tester) async {
    await tester.pumpWidget(const NearuApp());

    expect(find.text('Discover'), findsOneWidget);
    expect(find.text('Featured near you'), findsOneWidget);
  });
}
