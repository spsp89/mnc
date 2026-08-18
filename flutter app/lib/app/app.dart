import 'package:bnc_mobile/app/router.dart';
import 'package:bnc_mobile/core/notifications/push_service.dart';
import 'package:bnc_mobile/core/storage/app_preferences.dart';
import 'package:bnc_mobile/design_system/bnc_theme.dart';
import 'package:bnc_mobile/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class BncApp extends ConsumerWidget {
  const BncApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(pushInitializationProvider);
    final settings = ref.watch(appSettingsProvider);
    final router = ref.watch(appRouterProvider);
    return MaterialApp.router(
      title: 'BNC — Business Near & Close',
      debugShowCheckedModeBanner: false,
      theme: BncTheme.light,
      themeMode: ThemeMode.light,
      locale: settings.locale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      routerConfig: router,
      builder: (context, child) => GestureDetector(
        onTap: () => FocusManager.instance.primaryFocus?.unfocus(),
        child: MediaQuery(
          data: MediaQuery.of(context).copyWith(
            textScaler: MediaQuery.textScalerOf(
              context,
            ).clamp(maxScaleFactor: 1.8),
          ),
          child: child ?? const SizedBox.shrink(),
        ),
      ),
    );
  }
}
