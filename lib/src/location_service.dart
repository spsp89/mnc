import 'location_result.dart';
import 'location_service_stub.dart'
    if (dart.library.html) 'location_service_web.dart' as platform;

Future<DetectedLocation?> detectCurrentLocation() {
  return platform.detectCurrentLocation();
}
