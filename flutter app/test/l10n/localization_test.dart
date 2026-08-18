import 'package:bnc_mobile/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  for (final locale in const [Locale('en'), Locale('ml')]) {
    testWidgets('loads ${locale.languageCode} translations', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          locale: locale,
          supportedLocales: AppLocalizations.supportedLocales,
          localizationsDelegates: const [
            AppLocalizations.delegate,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          home: Builder(
            builder: (context) => Text(AppLocalizations.of(context).tagline),
          ),
        ),
      );

      expect(find.byType(Text), findsOneWidget);
      expect(
        find.text(
          locale.languageCode == 'en'
              ? 'Business Near & Close'
              : 'ബിസിനസ് നിയർ & ക്ലോസ്',
        ),
        findsOneWidget,
      );
    });
  }
}
