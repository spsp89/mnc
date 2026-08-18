import 'package:dio/dio.dart';

class ApiException implements Exception {
  const ApiException({
    required this.message,
    this.code = 'UNKNOWN',
    this.statusCode,
    this.requestId,
    this.details = const {},
  });

  factory ApiException.fromDio(DioException error) {
    final response = error.response;
    final body = response?.data;
    Map<String, dynamic> payload = const {};
    if (body is Map) {
      final normalized = Map<String, dynamic>.from(body);
      payload = normalized['error'] is Map
          ? Map<String, dynamic>.from(normalized['error'] as Map)
          : normalized;
    }
    final fallback = switch (error.type) {
      DioExceptionType.connectionTimeout ||
      DioExceptionType.sendTimeout ||
      DioExceptionType.receiveTimeout => 'The request took too long.',
      DioExceptionType.connectionError =>
        'Unable to reach BNC. Check your connection.',
      DioExceptionType.cancel => 'The request was cancelled.',
      _ => 'Something went wrong. Please try again.',
    };
    return ApiException(
      message: payload['message']?.toString() ?? fallback,
      code: payload['code']?.toString() ?? 'NETWORK_ERROR',
      requestId:
          payload['requestId']?.toString() ??
          response?.headers.value('x-request-id'),
      statusCode: response?.statusCode,
      details: payload['details'] is Map
          ? Map<String, dynamic>.from(payload['details'] as Map)
          : const {},
    );
  }

  final String message;
  final String code;
  final int? statusCode;
  final String? requestId;
  final Map<String, dynamic> details;

  @override
  String toString() =>
      requestId == null ? message : '$message (Request $requestId)';
}
