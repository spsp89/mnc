import 'dart:html' as html;

import 'location_result.dart';

Future<DetectedLocation?> detectCurrentLocation() async {
  final geolocation = html.window.navigator.geolocation;

  try {
    final position = await geolocation.getCurrentPosition(
      enableHighAccuracy: true,
      timeout: const Duration(seconds: 12),
      maximumAge: const Duration(minutes: 5),
    );
    final latitude = position.coords?.latitude;
    final longitude = position.coords?.longitude;

    if (latitude == null || longitude == null) {
      return null;
    }

    return DetectedLocation(
      label: 'Current location',
      detail:
          '${latitude.toStringAsFixed(4)}, ${longitude.toStringAsFixed(4)}',
      latitude: latitude.toDouble(),
      longitude: longitude.toDouble(),
    );
  } catch (_) {
    return null;
  }
}
