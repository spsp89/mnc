# Mobile store release checklist

The source is prepared for store signing, but publication requires the client-owned Google Play Console and Apple Developer/App Store Connect accounts.

## Production prerequisites

- Final HTTPS website and API domains are live.
- `config.production.json` is created locally from `config.production.example.json`; no placeholder host remains.
- Privacy, terms, support and account-deletion URLs are public without login.
- Android upload keystore is stored outside Git and `android/key.properties` points to it.
- Apple distribution certificate, App Store provisioning and the `in.bnc.bncMobile` App ID belong to the submitting team.
- App Store privacy answers and Google Play Data Safety answers match actual collection and retention.
- Firebase provider files are added only if push is enabled.
- Razorpay production key is added only after production payment/webhook verification.

## Verification

```bash
flutter pub get
dart format --output=none --set-exit-if-changed lib test integration_test
flutter analyze
flutter test --dart-define-from-file=config.production.json
flutter build appbundle --release \
  --dart-define-from-file=config.production.json \
  --obfuscate \
  --split-debug-info=build/symbols/android
flutter build ipa --release \
  --dart-define-from-file=config.production.json \
  --obfuscate \
  --split-debug-info=build/symbols/ios
```

Upload `build/app/outputs/bundle/release/app-release.aab` to a Play closed-testing track first. Upload the `.ipa` with Transporter or Xcode Organizer to TestFlight first. Complete tester sign-off before production review.

## Store review notes

Give reviewers a customer account. Explain that precise location is optional,
users can choose a city, and business-owner/administrator workflows are
available on the website rather than in this customer app.

The QR/download page on the website must use the final store URLs through:

- `NEXT_PUBLIC_ANDROID_APP_URL`
- `NEXT_PUBLIC_IOS_APP_URL`
