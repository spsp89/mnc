import 'package:flutter/foundation.dart';

const catalogApiBaseUrl = String.fromEnvironment(
  'CATALOG_API_BASE_URL',
);

const useCatalogFallback = bool.fromEnvironment(
  'USE_CATALOG_FALLBACK',
  defaultValue: true,
);

const catalogApiTimeoutSeconds = int.fromEnvironment(
  'CATALOG_API_TIMEOUT_SECONDS',
  defaultValue: 20,
);

Duration get catalogApiTimeout => Duration(
      seconds: catalogApiTimeoutSeconds < 1 ? 20 : catalogApiTimeoutSeconds,
    );

String get resolvedCatalogApiBaseUrl {
  if (catalogApiBaseUrl.trim().isNotEmpty) {
    return catalogApiBaseUrl;
  }

  return kIsWeb ? 'http://localhost:8080' : 'http://10.0.2.2:8080';
}

Uri catalogApiUri(String path, [Map<String, String?> query = const {}]) {
  final base = Uri.parse(resolvedCatalogApiBaseUrl);
  final normalizedPath = path.startsWith('/') ? path : '/$path';
  final params = <String, String>{};

  for (final entry in query.entries) {
    final value = entry.value?.trim();
    if (value != null && value.isNotEmpty) {
      params[entry.key] = value;
    }
  }

  return base.replace(
    path: '${base.path.replaceFirst(RegExp(r'/$'), '')}$normalizedPath',
    queryParameters: params.isEmpty ? null : params,
  );
}
