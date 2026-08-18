import 'dart:async';

import 'package:bnc_mobile/core/network/api_client.dart';
import 'package:bnc_mobile/core/network/api_exception.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('ApiException', () {
    test('keeps structured API error metadata', () {
      final request = RequestOptions(path: '/orders');
      final exception = ApiException.fromDio(
        DioException(
          requestOptions: request,
          response: Response<dynamic>(
            requestOptions: request,
            statusCode: 422,
            data: {
              'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'The order is invalid',
                'requestId': 'req-123',
                'details': {'items': 'required'},
              },
            },
          ),
          type: DioExceptionType.badResponse,
        ),
      );

      expect(exception.message, 'The order is invalid');
      expect(exception.code, 'VALIDATION_ERROR');
      expect(exception.statusCode, 422);
      expect(exception.requestId, 'req-123');
      expect(exception.details['items'], 'required');
      expect(exception.toString(), contains('req-123'));
    });

    test('produces a useful offline message', () {
      final exception = ApiException.fromDio(
        DioException(
          requestOptions: RequestOptions(path: '/search/businesses'),
          type: DioExceptionType.connectionError,
        ),
      );

      expect(exception.message, contains('Check your connection'));
      expect(exception.code, 'NETWORK_ERROR');
    });
  });

  test('RefreshCoordinator single-flights concurrent refreshes', () async {
    final coordinator = RefreshCoordinator();
    final release = Completer<void>();
    var calls = 0;

    Future<void> refresh() async {
      calls += 1;
      await release.future;
    }

    final first = coordinator.run(refresh);
    final second = coordinator.run(refresh);
    final third = coordinator.run(refresh);
    await Future<void>.delayed(Duration.zero);

    expect(calls, 1);
    release.complete();
    await Future.wait([first, second, third]);
    expect(calls, 1);

    await coordinator.run(() async => calls += 1);
    expect(calls, 2);
  });
}
