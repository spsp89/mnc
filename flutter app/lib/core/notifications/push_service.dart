import 'dart:async';
import 'dart:io';

import 'package:bnc_mobile/core/config/app_config.dart';
import 'package:bnc_mobile/core/data/app_repository.dart';
import 'package:bnc_mobile/core/state/app_state.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

abstract interface class PushService {
  Future<void> initialize();
  Future<String?> token();
}

class DisabledPushService implements PushService {
  const DisabledPushService();

  @override
  Future<void> initialize() async {}

  @override
  Future<String?> token() async => null;
}

class FirebasePushService implements PushService {
  FirebasePushService(this._messaging);

  final FirebaseMessaging _messaging;

  @override
  Future<void> initialize() async {
    if (Firebase.apps.isEmpty) {
      await Firebase.initializeApp();
    }
    await _messaging.setAutoInitEnabled(true);
    await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: true,
    );
  }

  @override
  Future<String?> token() => _messaging.getToken();
}

final pushServiceProvider = Provider<PushService>(
  (ref) => AppConfig.enableFirebasePush
      ? FirebasePushService(FirebaseMessaging.instance)
      : const DisabledPushService(),
);

final pushInitializationProvider = FutureProvider<void>((ref) async {
  final service = ref.watch(pushServiceProvider);
  final session = ref.watch(sessionProvider);
  await service.initialize();
  if (!session.authenticated || !AppConfig.enableFirebasePush) return;
  final repository = ref.watch(appRepositoryProvider);

  String platformName() {
    if (kIsWeb) return 'web';
    if (Platform.isIOS) return 'ios';
    return 'android';
  }

  Future<void> register(String token) => repository.registerPushDevice(
    token: token,
    platform: platformName(),
    deviceName: kIsWeb ? 'BNC web' : 'BNC ${Platform.operatingSystem}',
  );

  final initialToken = await service.token();
  if (initialToken != null && initialToken.isNotEmpty) {
    await register(initialToken);
  }
  final tokenSubscription = FirebaseMessaging.instance.onTokenRefresh.listen(
    (token) => unawaited(register(token)),
  );
  final foregroundSubscription = FirebaseMessaging.onMessage.listen((message) {
    ref.invalidate(notificationsProvider);
  });
  ref.onDispose(() {
    unawaited(tokenSubscription.cancel());
    unawaited(foregroundSubscription.cancel());
  });
});
