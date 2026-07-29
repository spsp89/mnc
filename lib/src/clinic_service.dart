import 'dart:convert';

import 'package:http/http.dart' as http;

import 'catalog_api_config.dart';
import 'catalog_service.dart';

class ClinicService {
  ClinicService({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  void close() {
    _client.close();
  }

  Future<List<ClinicItem>> fetchClinics({String query = ''}) async {
    final response = await _client
        .get(
          catalogApiUri('/api/clinics', {'query': query}),
          headers: const {'accept': 'application/json'},
        )
        .timeout(catalogApiTimeout);

    final decoded = _decodeJsonMap(response.body);
    if (response.statusCode != 200) {
      throw CatalogException(_apiErrorMessage(decoded, response.statusCode));
    }

    return _asList(decoded['clinics'])
        .map((item) => ClinicItem.fromJson(_asMap(item)))
        .toList();
  }

  Future<ClinicItem> fetchClinic(String slug) async {
    final response = await _client
        .get(
          catalogApiUri('/api/clinics/${Uri.encodeComponent(slug)}'),
          headers: const {'accept': 'application/json'},
        )
        .timeout(catalogApiTimeout);

    final decoded = _decodeJsonMap(response.body);
    if (response.statusCode != 200) {
      throw CatalogException(_apiErrorMessage(decoded, response.statusCode));
    }

    final clinic = _asMap(decoded['clinic']);
    if (clinic.isEmpty) {
      throw const CatalogException('Unexpected server response format.');
    }

    return ClinicItem.fromJson(clinic);
  }

  Future<void> createBookingRequest({
    required String clinicId,
    required String doctorId,
    required String patientName,
    required String phone,
    required String preferredSlot,
    required String message,
  }) async {
    final response = await _client
        .post(
          catalogApiUri('/api/booking-requests'),
          headers: const {
            'accept': 'application/json',
            'content-type': 'application/json',
          },
          body: json.encode({
            'clinicId': clinicId.isEmpty ? null : clinicId,
            'doctorId': doctorId.isEmpty ? null : doctorId,
            'patientName': patientName,
            'phone': phone,
            'preferredSlot': preferredSlot,
            'message': message,
          }),
        )
        .timeout(catalogApiTimeout);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      final decoded = _decodeJsonMap(response.body);
      throw CatalogException(_apiErrorMessage(decoded, response.statusCode));
    }
  }
}

class ClinicItem {
  const ClinicItem({
    required this.id,
    required this.slug,
    required this.name,
    required this.imageUrl,
    required this.phone,
    required this.whatsapp,
    required this.address,
    required this.distanceKm,
    required this.doctors,
  });

  final String id;
  final String slug;
  final String name;
  final String imageUrl;
  final String phone;
  final String whatsapp;
  final ClinicAddress address;
  final double distanceKm;
  final List<DoctorItem> doctors;

  factory ClinicItem.fromJson(Map<String, dynamic> json) {
    return ClinicItem(
      id: _asString(json['id']),
      slug: _asString(json['slug']),
      name: _asString(json['name']),
      imageUrl: _asString(json['imageUrl']),
      phone: _asString(json['phone']),
      whatsapp: _asString(json['whatsapp']),
      address: ClinicAddress.fromJson(_asMap(json['address'])),
      distanceKm: _asDouble(json['distanceKm']),
      doctors: _asList(json['doctors'])
          .map((item) => DoctorItem.fromJson(_asMap(item)))
          .toList(),
    );
  }
}

class ClinicAddress {
  const ClinicAddress({
    required this.area,
    required this.city,
    required this.region,
    required this.country,
    required this.label,
  });

  final String area;
  final String city;
  final String region;
  final String country;
  final String label;

  factory ClinicAddress.fromJson(Map<String, dynamic> json) {
    final area = _asString(json['area']);
    final city = _asString(json['city']);
    final region = _asString(json['region']);
    final label = _asString(json['label']);

    return ClinicAddress(
      area: area,
      city: city,
      region: region,
      country: _asString(json['country']),
      label: label.isNotEmpty
          ? label
          : [area, city, region].where((item) => item.isNotEmpty).join(', '),
    );
  }
}

class DoctorItem {
  const DoctorItem({
    required this.id,
    required this.slug,
    required this.name,
    required this.speciality,
    required this.experience,
    required this.ratingAverage,
    required this.ratingCount,
    required this.nextSlot,
    required this.fee,
    required this.imageUrl,
    required this.services,
  });

  final String id;
  final String slug;
  final String name;
  final String speciality;
  final String experience;
  final double ratingAverage;
  final int ratingCount;
  final String nextSlot;
  final String fee;
  final String imageUrl;
  final List<String> services;

  factory DoctorItem.fromJson(Map<String, dynamic> json) {
    final rating = _asMap(json['rating']);
    return DoctorItem(
      id: _asString(json['id']),
      slug: _asString(json['slug']),
      name: _asString(json['name']),
      speciality: _asString(json['speciality']),
      experience: _asString(json['experience']),
      ratingAverage: _asDouble(rating['average'] ?? json['rating']),
      ratingCount: _asInt(rating['count'] ?? json['ratingCount']),
      nextSlot: _asString(json['nextSlot']),
      fee: _asString(json['fee']),
      imageUrl: _asString(json['imageUrl']),
      services: _asList(json['services']).map((item) => _asString(item)).toList(),
    );
  }
}

Map<String, dynamic> _decodeJsonMap(String body) {
  final decoded = _decodeJson(body);
  if (decoded is! Map<String, dynamic>) {
    throw const CatalogException('Unexpected server response format.');
  }
  return decoded;
}

Object? _decodeJson(String body) {
  try {
    return json.decode(body);
  } on FormatException {
    throw const CatalogException('Server returned invalid JSON.');
  }
}

String _apiErrorMessage(Map<String, dynamic> json, int statusCode) {
  final error = _asMap(json['error']);
  final message = error['message']?.toString().trim();
  return message == null || message.isEmpty
      ? 'Server returned status $statusCode.'
      : message;
}

List<dynamic> _asList(Object? value) => value is List ? value : const [];

Map<String, dynamic> _asMap(Object? value) {
  return value is Map<String, dynamic> ? value : const {};
}

String _asString(Object? value) => value?.toString() ?? '';

int _asInt(Object? value) {
  if (value is int) {
    return value;
  }
  if (value is num) {
    return value.toInt();
  }
  return int.tryParse(value?.toString() ?? '') ?? 0;
}

double _asDouble(Object? value) {
  if (value is double) {
    return value;
  }
  if (value is num) {
    return value.toDouble();
  }
  return double.tryParse(value?.toString() ?? '') ?? 0;
}
