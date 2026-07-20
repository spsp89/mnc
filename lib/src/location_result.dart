class DetectedLocation {
  const DetectedLocation({
    required this.label,
    required this.detail,
    required this.latitude,
    required this.longitude,
  });

  final String label;
  final String detail;
  final double latitude;
  final double longitude;
}
