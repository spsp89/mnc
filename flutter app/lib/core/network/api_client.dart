import 'dart:async';

import 'package:bnc_mobile/core/config/app_config.dart';
import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/core/network/api_exception.dart';
import 'package:bnc_mobile/core/storage/app_preferences.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ApiClient {
  ApiClient(this._sessionStore)
    : _dio = Dio(
        BaseOptions(
          baseUrl: AppConfig.apiBaseUrl,
          connectTimeout: const Duration(seconds: 12),
          sendTimeout: const Duration(seconds: 20),
          receiveTimeout: const Duration(seconds: 20),
          headers: const {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        ),
      ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _sessionStore.accessToken;
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          options.headers['x-request-id'] ??=
              '${DateTime.now().microsecondsSinceEpoch}-mobile';
          handler.next(options);
        },
        onError: (error, handler) async {
          final request = error.requestOptions;
          final shouldRefresh =
              error.response?.statusCode == 401 &&
              request.extra['retried'] != true &&
              !request.path.contains('/auth/refresh') &&
              !request.path.contains('/auth/otp/');
          if (!shouldRefresh) {
            handler.next(error);
            return;
          }
          try {
            await _refreshSession();
            request.extra['retried'] = true;
            final token = await _sessionStore.accessToken;
            request.headers['Authorization'] = 'Bearer $token';
            handler.resolve(await _dio.fetch<dynamic>(request));
          } on Object {
            await _sessionStore.clear();
            handler.next(error);
          }
        },
      ),
    );
  }

  final Dio _dio;
  final SessionStore _sessionStore;
  final RefreshCoordinator _refreshCoordinator = RefreshCoordinator();

  Future<void> _refreshSession() => _refreshCoordinator.run(() async {
    final refreshToken = await _sessionStore.refreshToken;
    if (refreshToken == null) {
      throw const ApiException(message: 'No session');
    }
    final refreshDio = Dio(BaseOptions(baseUrl: AppConfig.apiBaseUrl));
    final response = await refreshDio.post<dynamic>(
      '/auth/refresh',
      data: {'refreshToken': refreshToken},
    );
    final data = _unwrapMap(response.data);
    await _sessionStore.updateTokens(
      accessToken: data.string('accessToken'),
      refreshToken: data.string('refreshToken'),
      user: data['user'] is Map
          ? Map<String, dynamic>.from(data['user'] as Map)
          : null,
    );
  });

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) async {
    try {
      final response = await _dio.get<dynamic>(path, queryParameters: query);
      return response.data;
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  Future<dynamic> post(
    String path, {
    Object? data,
    Map<String, dynamic>? query,
    Map<String, dynamic>? headers,
  }) async {
    try {
      final response = await _dio.post<dynamic>(
        path,
        data: data,
        queryParameters: query,
        options: Options(headers: headers),
      );
      return response.data;
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  Future<dynamic> patch(String path, {Object? data}) async {
    try {
      final response = await _dio.patch<dynamic>(path, data: data);
      return response.data;
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  Future<dynamic> put(String path, {Object? data}) async {
    try {
      final response = await _dio.put<dynamic>(path, data: data);
      return response.data;
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  Future<void> putExternal(
    String url, {
    required Object data,
    required Map<String, dynamic> headers,
  }) async {
    try {
      await Dio().putUri<void>(
        Uri.parse(url),
        data: data,
        options: Options(headers: headers, responseType: ResponseType.plain),
      );
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  Future<dynamic> delete(String path, {Object? data}) async {
    try {
      final response = await _dio.delete<dynamic>(path, data: data);
      return response.data;
    } on DioException catch (error) {
      throw ApiException.fromDio(error);
    }
  }

  static Json unwrapMap(dynamic body) => _unwrapMap(body);

  static List<Json> unwrapList(dynamic body) {
    final data = body is Map ? body['data'] : body;
    if (data is! List) return const [];
    return data
        .whereType<Map<dynamic, dynamic>>()
        .map((item) => item.map((key, value) => MapEntry('$key', value)))
        .toList();
  }

  static Json _unwrapMap(dynamic body) {
    final data = body is Map && body.containsKey('data') ? body['data'] : body;
    if (data is! Map) return <String, dynamic>{};
    return data.map((key, value) => MapEntry('$key', value));
  }
}

class RefreshCoordinator {
  Future<void>? _inFlight;

  Future<void> run(Future<void> Function() refresh) {
    final current = _inFlight;
    if (current != null) return current;
    final completer = Completer<void>();
    _inFlight = completer.future;
    () async {
      try {
        await refresh();
        completer.complete();
      } on Object catch (error, stackTrace) {
        completer.completeError(error, stackTrace);
      } finally {
        _inFlight = null;
      }
    }();
    return completer.future;
  }
}

final apiClientProvider = Provider<ApiClient>(
  (ref) => ApiClient(ref.watch(sessionStoreProvider)),
);
