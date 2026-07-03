import 'dart:convert';

import 'package:http/http.dart' as http;

import 'catalog_models.dart';

const catalogApiUrl =
    'https://mediumaquamarine-cormorant-834952.hostingersite.com/api/catalog';

class CatalogService {
  CatalogService({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Future<CatalogData> fetchCatalog() async {
    final response = await _client
        .get(
          Uri.parse(catalogApiUrl),
          headers: const {'accept': 'application/json'},
        )
        .timeout(const Duration(seconds: 20));

    if (response.statusCode != 200) {
      throw CatalogException('Server returned status ${response.statusCode}.');
    }

    final decoded = json.decode(response.body);
    if (decoded is! Map<String, dynamic>) {
      throw const CatalogException('Unexpected server response format.');
    }

    return CatalogData.fromJson(decoded);
  }
}

class CatalogException implements Exception {
  const CatalogException(this.message);

  final String message;

  @override
  String toString() => message;
}
