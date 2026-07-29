import 'dart:convert';

import 'package:http/http.dart' as http;

import 'catalog_api_config.dart';
import 'catalog_models.dart';
import 'catalog_service.dart';

class DealsService {
  DealsService({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  void close() {
    _client.close();
  }

  Future<List<DealItem>> fetchDeals({
    String section = '',
    bool featured = false,
  }) async {
    final response = await _client
        .get(
          catalogApiUri('/api/deals', {
            'section': section,
            'featured': featured ? 'true' : null,
          }),
          headers: const {'accept': 'application/json'},
        )
        .timeout(catalogApiTimeout);

    final decoded = _decodeJsonMap(response.body);
    if (response.statusCode != 200) {
      throw CatalogException(_apiErrorMessage(decoded, response.statusCode));
    }

    return _asList(decoded['deals'])
        .map((item) => DealItem.fromJson(_asMap(item)))
        .toList();
  }
}

class DealItem {
  const DealItem({
    required this.id,
    required this.slug,
    required this.title,
    required this.description,
    required this.code,
    required this.imageUrl,
    required this.accentColor,
    required this.section,
    required this.isFeatured,
    required this.business,
  });

  final String id;
  final String slug;
  final String title;
  final String description;
  final String code;
  final String imageUrl;
  final String accentColor;
  final String section;
  final bool isFeatured;
  final BusinessItem? business;

  factory DealItem.fromJson(Map<String, dynamic> json) {
    final businessJson = _asMap(json['business']);
    return DealItem(
      id: _asString(json['id']),
      slug: _asString(json['slug']),
      title: _asString(json['title']),
      description: _asString(json['description']),
      code: _asString(json['code']),
      imageUrl: _asString(json['imageUrl']),
      accentColor: _asString(json['accentColor']),
      section: _asString(json['section']),
      isFeatured: _asBool(json['isFeatured']),
      business: businessJson.isEmpty ? null : BusinessItem.fromJson(businessJson),
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

bool _asBool(Object? value) {
  if (value is bool) {
    return value;
  }
  if (value is num) {
    return value != 0;
  }
  final normalized = value?.toString().toLowerCase();
  return normalized == 'true' || normalized == '1';
}
