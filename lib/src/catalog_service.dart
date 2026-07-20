import 'dart:convert';

import 'package:http/http.dart' as http;

import 'catalog_api_config.dart';
import 'catalog_models.dart';

class CatalogService {
  CatalogService({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  void close() {
    _client.close();
  }

  Future<CatalogData> fetchCatalog({
    CatalogQuery query = const CatalogQuery(),
  }) async {
    final response = await _client
        .get(
          catalogApiUri('/api/catalog', query.toParams()),
          headers: const {'accept': 'application/json'},
        )
        .timeout(catalogApiTimeout);

    final decoded = _decodeJsonMap(response.body);
    if (response.statusCode != 200) {
      throw CatalogException(_apiErrorMessage(decoded, response.statusCode));
    }

    return CatalogData.fromJson(decoded);
  }

  Future<List<CategoryItem>> fetchCategories() async {
    final response = await _client
        .get(
          catalogApiUri('/api/categories'),
          headers: const {'accept': 'application/json'},
        )
        .timeout(catalogApiTimeout);

    final decoded = _decodeJson(response.body);
    if (response.statusCode != 200) {
      throw CatalogException(
        decoded is Map<String, dynamic>
            ? _apiErrorMessage(decoded, response.statusCode)
            : 'Server returned status ${response.statusCode}.',
      );
    }

    if (decoded is List) {
      return decoded
          .whereType<Map<String, dynamic>>()
          .map(CategoryItem.fromJson)
          .toList();
    }

    if (decoded is Map<String, dynamic>) {
      return _asList(decoded['categories'])
          .map((item) => CategoryItem.fromJson(_asMap(item)))
          .toList();
    }

    throw const CatalogException('Unexpected server response format.');
  }

  Future<BusinessItem> fetchBusiness(String slug) async {
    final response = await _client
        .get(
          catalogApiUri('/api/business/${Uri.encodeComponent(slug)}'),
          headers: const {'accept': 'application/json'},
        )
        .timeout(catalogApiTimeout);

    final decoded = _decodeJsonMap(response.body);
    if (response.statusCode != 200) {
      throw CatalogException(_apiErrorMessage(decoded, response.statusCode));
    }

    final business = _asMap(decoded['business']);
    if (business.isEmpty) {
      throw const CatalogException('Unexpected server response format.');
    }

    return BusinessItem.fromJson(business);
  }
}

class CatalogQuery {
  const CatalogQuery({
    this.query = '',
    this.categorySlug = '',
    this.featured,
    this.popular,
    this.sort = 'default',
    this.limit,
  });

  final String query;
  final String categorySlug;
  final bool? featured;
  final bool? popular;
  final String sort;
  final int? limit;

  Map<String, String?> toParams() {
    return {
      'q': query,
      'category': categorySlug,
      'featured': featured?.toString(),
      'popular': popular?.toString(),
      'sort': sort == 'default' ? null : sort,
      'limit': limit?.toString(),
    };
  }
}

class CatalogException implements Exception {
  const CatalogException(this.message);

  final String message;

  @override
  String toString() => message;
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

  if (message != null && message.isNotEmpty) {
    return message;
  }

  return 'Server returned status $statusCode.';
}

List<dynamic> _asList(Object? value) => value is List ? value : const [];

Map<String, dynamic> _asMap(Object? value) {
  return value is Map<String, dynamic> ? value : const {};
}
