import 'dart:typed_data';

import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/core/network/api_client.dart';
import 'package:crypto/crypto.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

/// Live API repository used by every Flutter feature.
///
/// The application intentionally has no bundled catalogue, account, commerce,
/// analytics, or administration fallback data. Network failures are surfaced
/// to the UI so that fabricated records can never be mistaken for live data.
class AppRepository {
  AppRepository(this._api);

  final ApiClient _api;

  Future<List<Category>> categories({String language = 'en'}) async {
    final response = await _api.get(
      '/categories',
      query: {'language': language},
    );
    return ApiClient.unwrapList(response).map(Category.fromJson).toList();
  }

  Future<PageResult<Business>> searchBusinesses(
    SearchFilters filters, {
    int page = 1,
  }) async {
    final response = await _api.get(
      '/search/businesses',
      query: filters.toQuery(page: page),
    );
    final items = ApiClient.unwrapList(
      response,
    ).map(Business.fromJson).toList();
    final meta = response is Map && response['meta'] is Map
        ? Map<String, dynamic>.from(response['meta'] as Map)
        : <String, dynamic>{};
    return PageResult(
      items: items,
      page: meta.integer('page', page),
      pageSize: meta.integer('pageSize', 20),
      total: meta.integer('total', items.length),
      requestId: meta.nullableString('requestId'),
    );
  }

  Future<Business> business(String slug) async => Business.fromJson(
    ApiClient.unwrapMap(await _api.get('/businesses/$slug')),
  );

  Future<List<Business>> businesses({
    String? category,
    String? city,
    int pageSize = 20,
  }) async => ApiClient.unwrapList(
    await _api.get(
      '/businesses',
      query: {
        'page': 1,
        'pageSize': pageSize,
        if (category != null && category.isNotEmpty) 'category': category,
        if (city != null && city.isNotEmpty) 'city': city,
      },
    ),
  ).map(Business.fromJson).toList();

  Future<List<Business>> myBusinesses() async => ApiClient.unwrapList(
    await _api.get('/businesses/mine'),
  ).map(Business.fromJson).toList();

  Future<Business> managedBusiness(String id) async => Business.fromJson(
    ApiClient.unwrapMap(await _api.get('/businesses/manage/$id')),
  );

  Future<Business> createBusiness(Json payload) async => Business.fromJson(
    ApiClient.unwrapMap(await _api.post('/businesses', data: payload)),
  );

  Future<Business> updateBusiness(String id, Json payload) async =>
      Business.fromJson(
        ApiClient.unwrapMap(
          await _api.patch('/businesses/manage/$id', data: payload),
        ),
      );

  Future<void> updateBusinessCategories(
    String id, {
    required List<String> categoryIds,
    required String primaryCategoryId,
  }) async {
    await _api.put(
      '/businesses/manage/$id/categories',
      data: {
        'categoryIds': categoryIds,
        'primaryCategoryId': primaryCategoryId,
      },
    );
  }

  Future<void> attachBusinessImage({
    required String businessId,
    required String kind,
    required String objectKey,
    String? altText,
  }) async {
    await _api.post(
      '/businesses/manage/$businessId/media',
      data: {
        'kind': kind,
        'objectKey': objectKey,
        if (altText != null) 'altText': altText,
      },
    );
  }

  Future<Json> businessTeam(String businessId) async => ApiClient.unwrapMap(
    await _api.get('/businesses/manage/$businessId/team'),
  );

  Future<Json> addBusinessTeamMember(String businessId, Json payload) async =>
      ApiClient.unwrapMap(
        await _api.post('/businesses/manage/$businessId/team', data: payload),
      );

  Future<Json> updateBusinessTeamMember(
    String businessId,
    String memberId,
    Json payload,
  ) async => ApiClient.unwrapMap(
    await _api.patch(
      '/businesses/manage/$businessId/team/$memberId',
      data: payload,
    ),
  );

  Future<List<Product>> products({
    String? query,
    String? category,
    String? city,
    String? constituency,
    String? district,
    String? state,
    String? stock,
    bool? courier,
    String? sort,
    double? latitude,
    double? longitude,
    int radiusKm = 5,
    int pageSize = 50,
  }) async {
    final response = await _api.get(
      '/products',
      query: {
        'page': 1,
        'pageSize': pageSize,
        if (query != null && query.trim().isNotEmpty) 'q': query.trim(),
        if (category != null && category.isNotEmpty) 'category': category,
        if (city != null && city.isNotEmpty) 'city': city,
        if (constituency != null && constituency.isNotEmpty)
          'constituency': constituency,
        if (district != null && district.isNotEmpty) 'district': district,
        if (state != null && state.isNotEmpty) 'state': state,
        if (stock != null && stock.isNotEmpty) 'stock': stock,
        if (courier != null) 'courier': courier,
        if (sort != null && sort.isNotEmpty) 'sort': sort,
        if (latitude != null) 'latitude': latitude,
        if (longitude != null) 'longitude': longitude,
        'radiusKm': radiusKm,
      },
    );
    return ApiClient.unwrapList(response).map(Product.fromJson).toList();
  }

  Future<Product> product(String id) async =>
      Product.fromJson(ApiClient.unwrapMap(await _api.get('/products/$id')));

  Future<Product> createProduct(Json payload) async => Product.fromJson(
    ApiClient.unwrapMap(await _api.post('/products', data: payload)),
  );

  Future<List<Product>> managedProducts(String businessId) async =>
      ApiClient.unwrapList(
        await _api.get('/products/manage', query: {'businessId': businessId}),
      ).map(Product.fromJson).toList();

  Future<Product> updateProduct(String id, Json payload) async =>
      Product.fromJson(
        ApiClient.unwrapMap(await _api.patch('/products/$id', data: payload)),
      );

  Future<Product> submitProduct(String id) async => Product.fromJson(
    ApiClient.unwrapMap(await _api.post('/products/$id/submit')),
  );

  Future<void> deleteProduct(String id) async {
    await _api.delete('/products/$id');
  }

  Future<List<Service>> services({
    String? query,
    String? category,
    String? city,
    String? constituency,
    String? district,
    String? state,
    bool? homeService,
    String? sort,
    double? latitude,
    double? longitude,
    int radiusKm = 5,
    int pageSize = 50,
  }) async {
    final response = await _api.get(
      '/services',
      query: {
        'page': 1,
        'pageSize': pageSize,
        if (query != null && query.trim().isNotEmpty) 'q': query.trim(),
        if (category != null && category.isNotEmpty) 'category': category,
        if (city != null && city.isNotEmpty) 'city': city,
        if (constituency != null && constituency.isNotEmpty)
          'constituency': constituency,
        if (district != null && district.isNotEmpty) 'district': district,
        if (state != null && state.isNotEmpty) 'state': state,
        if (homeService != null) 'homeService': homeService,
        if (sort != null && sort.isNotEmpty) 'sort': sort,
        if (latitude != null) 'latitude': latitude,
        if (longitude != null) 'longitude': longitude,
        'radiusKm': radiusKm,
      },
    );
    return ApiClient.unwrapList(response).map(Service.fromJson).toList();
  }

  Future<Service> service(String id) async =>
      Service.fromJson(ApiClient.unwrapMap(await _api.get('/services/$id')));

  Future<Service> createService(Json payload) async => Service.fromJson(
    ApiClient.unwrapMap(await _api.post('/services', data: payload)),
  );

  Future<Service> updateService(String id, Json payload) async =>
      Service.fromJson(
        ApiClient.unwrapMap(await _api.patch('/services/$id', data: payload)),
      );

  Future<void> deleteService(String id) async {
    await _api.delete('/services/$id');
  }

  Future<List<Offer>> offers({
    String? query,
    String? city,
    String? category,
    bool? featured,
    int pageSize = 50,
  }) async {
    final response = await _api.get(
      '/offers',
      query: {
        'page': 1,
        'pageSize': pageSize,
        if (query != null && query.trim().isNotEmpty) 'q': query.trim(),
        if (city != null && city.isNotEmpty) 'city': city,
        if (category != null && category.isNotEmpty) 'category': category,
        if (featured != null) 'featured': featured,
      },
    );
    return ApiClient.unwrapList(response).map(Offer.fromJson).toList();
  }

  Future<Offer> createOffer(Json payload) async => Offer.fromJson(
    ApiClient.unwrapMap(await _api.post('/offers', data: payload)),
  );

  Future<void> updateOffer(String id, Json payload) async {
    await _api.patch('/offers/$id', data: payload);
  }

  Future<String?> requestOtp(String phone) async {
    final data = ApiClient.unwrapMap(
      await _api.post(
        '/auth/otp/request',
        data: {'phone': phone, 'purpose': 'login'},
      ),
    );
    return data.nullableString('developmentCode');
  }

  Future<({UserProfile user, Json session})> verifyOtp(
    String phone,
    String code,
  ) async {
    final data = ApiClient.unwrapMap(
      await _api.post(
        '/auth/otp/verify',
        data: {'phone': phone, 'code': code, 'purpose': 'login'},
      ),
    );
    final userJson = data['user'] is Map
        ? Map<String, dynamic>.from(data['user'] as Map)
        : <String, dynamic>{};
    return (user: UserProfile.fromJson(userJson), session: data);
  }

  Future<String?> registerEmail({
    required String email,
    required String password,
    required String displayName,
  }) async {
    final data = ApiClient.unwrapMap(
      await _api.post(
        '/auth/email/register',
        data: {
          'email': email,
          'password': password,
          'displayName': displayName,
        },
      ),
    );
    return data.nullableString('developmentCode');
  }

  Future<({UserProfile user, Json session})> verifyEmail(
    String email,
    String code,
  ) async => _emailSession(
    await _api.post('/auth/email/verify', data: {'email': email, 'code': code}),
  );

  Future<({UserProfile user, Json session})> loginEmail(
    String email,
    String password,
  ) async => _emailSession(
    await _api.post(
      '/auth/email/login',
      data: {'email': email, 'password': password},
    ),
  );

  Future<({UserProfile user, Json session})> googleSignIn(
    String credential,
  ) async => _emailSession(
    await _api.post('/auth/google', data: {'credential': credential}),
  );

  ({UserProfile user, Json session}) _emailSession(dynamic response) {
    final data = ApiClient.unwrapMap(response);
    final userJson = data['user'] is Map
        ? Map<String, dynamic>.from(data['user'] as Map)
        : <String, dynamic>{};
    return (user: UserProfile.fromJson(userJson), session: data);
  }

  Future<void> logout(String refreshToken) async {
    await _api.post('/auth/logout', data: {'refreshToken': refreshToken});
  }

  Future<UserProfile> profile() async =>
      UserProfile.fromJson(ApiClient.unwrapMap(await _api.get('/users/me')));

  Future<UserProfile> updateProfile(Json changes) async => UserProfile.fromJson(
    ApiClient.unwrapMap(await _api.patch('/users/me', data: changes)),
  );

  Future<List<SearchHistoryEntry>> searchHistory() async =>
      ApiClient.unwrapList(
        await _api.get('/users/me/search-history'),
      ).map(SearchHistoryEntry.fromJson).toList();

  Future<void> recordSearchHistory(
    SearchFilters filters, {
    required int resultCount,
    required String interfaceLanguage,
  }) async {
    if (filters.query.trim().isEmpty) return;
    await _api.post(
      '/users/me/search-history',
      data: filters.toHistoryPayload(
        resultCount: resultCount,
        interfaceLanguage: interfaceLanguage,
      ),
    );
  }

  Future<List<Json>> cities({String state = 'Kerala'}) async =>
      ApiClient.unwrapList(
        await _api.get('/locations/cities', query: {'state': state}),
      );

  Future<Json> adminOverview() async =>
      ApiClient.unwrapMap(await _api.get('/admin/overview'));

  Future<dynamic> adminResource(String resource) async {
    const paths = {
      'users': '/admin/users',
      'businesses': '/admin/businesses',
      'reviews': '/admin/reviews/moderation',
      'products': '/admin/products/moderation',
      'conversations': '/admin/conversations',
      'weekly-draw': '/admin/weekly-draws',
      'business-club': '/admin/business-club',
      'verification': '/verification/queue',
      'support': '/admin/support',
      'finance': '/admin/finance',
      'audit-log': '/admin/audit-log',
      'ranking': '/admin/ranking',
    };
    final path = paths[resource];
    if (path == null) {
      throw ArgumentError.value(resource, 'resource', 'Unsupported resource');
    }
    return _api.get(path);
  }

  Future<void> clearSearchHistory() async {
    await _api.delete('/users/me/search-history');
  }

  Future<List<Json>> addresses() async =>
      ApiClient.unwrapList(await _api.get('/users/me/addresses'));

  Future<Json> addAddress(Json address) async => ApiClient.unwrapMap(
    await _api.post('/users/me/addresses', data: address),
  );

  Future<Json> updateAddress(String id, Json address) async =>
      ApiClient.unwrapMap(
        await _api.patch('/users/me/addresses/$id', data: address),
      );

  Future<void> removeAddress(String id) async {
    await _api.delete('/users/me/addresses/$id');
  }

  Future<List<Json>> sessions() async =>
      ApiClient.unwrapList(await _api.get('/users/me/sessions'));

  Future<List<Json>> consents() async =>
      ApiClient.unwrapList(await _api.get('/users/me/consents'));

  Future<List<Business>> blockedBusinesses() async =>
      ApiClient.unwrapList(await _api.get('/users/me/blocked-businesses')).map((
        item,
      ) {
        final business = item['business'];
        return Business.fromJson(
          business is Map ? Map<String, dynamic>.from(business) : item,
        );
      }).toList();

  Future<void> blockBusiness(String businessId, {String? reason}) async {
    await _api.post(
      '/users/me/blocked-businesses/$businessId',
      data: {if (reason != null && reason.isNotEmpty) 'reason': reason},
    );
  }

  Future<void> unblockBusiness(String businessId) async {
    await _api.delete('/users/me/blocked-businesses/$businessId');
  }

  Future<List<Product>> savedProducts() async =>
      ApiClient.unwrapList(await _api.get('/users/me/saved-products')).map((
        item,
      ) {
        final product = item['product'];
        return Product.fromJson(
          product is Map ? Map<String, dynamic>.from(product) : item,
        );
      }).toList();

  Future<void> setProductSaved(String productId, {required bool saved}) async {
    if (saved) {
      await _api.post('/users/me/saved-products/$productId');
    } else {
      await _api.delete('/users/me/saved-products/$productId');
    }
  }

  Future<List<Business>> recentBusinesses() async =>
      ApiClient.unwrapList(await _api.get('/users/me/recent-businesses')).map((
        item,
      ) {
        final business = item['business'];
        return Business.fromJson(
          business is Map ? Map<String, dynamic>.from(business) : item,
        );
      }).toList();

  Future<void> recordBusinessView(String businessId) async {
    await _api.post('/users/me/recent-businesses/$businessId');
  }

  Future<Json> requestDataExport() async =>
      ApiClient.unwrapMap(await _api.get('/users/me/export'));

  Future<void> deleteAccount() async {
    await _api.delete('/users/me');
  }

  Future<List<Business>> savedBusinesses() async {
    return ApiClient.unwrapList(await _api.get('/users/me/saved-businesses'))
        .map(
          (item) => item['business'] is Map
              ? Map<String, dynamic>.from(item['business'] as Map)
              : item,
        )
        .map(Business.fromJson)
        .toList();
  }

  Future<void> setBusinessSaved(
    String businessId, {
    required bool saved,
  }) async {
    if (saved) {
      await _api.post('/users/me/saved-businesses/$businessId');
    } else {
      await _api.delete('/users/me/saved-businesses/$businessId');
    }
  }

  Future<Enquiry> createEnquiry(Json payload) async => Enquiry.fromJson(
    ApiClient.unwrapMap(await _api.post('/enquiries', data: payload)),
  );

  Future<List<Enquiry>> enquiries({bool business = false}) async =>
      ApiClient.unwrapList(
        await _api.get(business ? '/enquiries/business' : '/enquiries/me'),
      ).map(Enquiry.fromJson).toList();

  Future<void> closeEnquiry(String id) async {
    await _api.post('/enquiries/$id/close');
  }

  Future<List<Conversation>> conversations() async => ApiClient.unwrapList(
    await _api.get('/conversations'),
  ).map(Conversation.fromJson).toList();

  Future<String> startBusinessConversation(
    String businessId,
    String initialMessage,
  ) async {
    final data = ApiClient.unwrapMap(
      await _api.post(
        '/conversations',
        data: {'businessId': businessId, 'initialMessage': initialMessage},
      ),
    );
    return data.string('id');
  }

  Future<String> startEnquiryConversation(String enquiryId) async {
    final data = ApiClient.unwrapMap(
      await _api.post('/conversations', data: {'enquiryId': enquiryId}),
    );
    return data.string('id');
  }

  Future<List<ChatMessage>> messages(String conversationId) async =>
      ApiClient.unwrapList(
        await _api.get('/conversations/$conversationId/messages'),
      ).map(ChatMessage.fromJson).toList();

  Future<ChatMessage> sendMessage(String conversationId, String body) async =>
      ChatMessage.fromJson(
        ApiClient.unwrapMap(
          await _api.post(
            '/conversations/$conversationId/messages',
            data: {'type': 'TEXT', 'body': body},
          ),
        ),
      );

  Future<void> markConversationRead(String conversationId) async {
    await _api.patch('/conversations/$conversationId/read');
  }

  Future<void> archiveConversation(String conversationId) async {
    await _api.patch('/conversations/$conversationId/archive');
  }

  Future<List<AppNotification>> notifications() async => ApiClient.unwrapList(
    await _api.get('/notifications'),
  ).map(AppNotification.fromJson).toList();

  Future<void> markAllNotificationsRead() async {
    await _api.patch('/notifications/read-all');
  }

  Future<void> markNotificationRead(String id) async {
    await _api.patch('/notifications/$id/read');
  }

  Future<List<Map<String, dynamic>>> notificationPreferences() async =>
      ApiClient.unwrapList(
        await _api.get('/notifications/preferences'),
      ).map((item) => Map<String, dynamic>.from(item)).toList();

  Future<void> updateNotificationPreference(
    String type, {
    required bool inApp,
    bool? push,
  }) async {
    await _api.put(
      '/notifications/preferences',
      data: {'type': type, 'inApp': inApp, if (push != null) 'push': push},
    );
  }

  Future<void> registerPushDevice({
    required String token,
    required String platform,
    String? deviceName,
  }) async {
    await _api.post(
      '/notifications/devices',
      data: {
        'token': token,
        'platform': platform,
        if (deviceName != null) 'deviceName': deviceName,
      },
    );
  }

  Future<void> unregisterPushDevice(String token) async {
    await _api.delete('/notifications/devices', data: {'token': token});
  }

  Future<Review> createReview({
    required String businessId,
    required int rating,
    required String body,
  }) async => Review.fromJson(
    ApiClient.unwrapMap(
      await _api.post(
        '/reviews',
        data: {'businessId': businessId, 'overallRating': rating, 'body': body},
      ),
    ),
  );

  Future<List<Review>> businessReviews(String businessId) async =>
      ApiClient.unwrapList(
        await _api.get('/reviews/business/$businessId'),
      ).map(Review.fromJson).toList();

  Future<List<Review>> myReviews() async => ApiClient.unwrapList(
    await _api.get('/reviews/me'),
  ).map(Review.fromJson).toList();

  Future<Review> updateReview(String reviewId, Json payload) async =>
      Review.fromJson(
        ApiClient.unwrapMap(
          await _api.patch('/reviews/$reviewId', data: payload),
        ),
      );

  Future<void> deleteReview(String reviewId) async {
    await _api.delete('/reviews/$reviewId');
  }

  Future<void> markReviewHelpful(String reviewId) async {
    await _api.post('/reviews/$reviewId/helpful');
  }

  Future<void> reportReview(
    String reviewId, {
    required String reason,
    String? details,
  }) async {
    await _api.post(
      '/reviews/$reviewId/report',
      data: {
        'reason': reason,
        if (details != null && details.isNotEmpty) 'details': details,
      },
    );
  }

  Future<Json> createSupportTicket(Json payload) async =>
      ApiClient.unwrapMap(await _api.post('/support/tickets', data: payload));

  Future<List<Json>> supportTickets() async =>
      ApiClient.unwrapList(await _api.get('/support/tickets/me'));

  Future<void> replyToReview(String reviewId, String body) async {
    await _api.post('/reviews/$reviewId/reply', data: {'body': body});
  }

  Future<List<Order>> orders({bool business = false}) async {
    String? businessId;
    if (business) {
      final businesses = await myBusinesses();
      businessId = businesses.isEmpty ? null : businesses.first.id;
    }
    return ApiClient.unwrapList(
      await _api.get(
        business ? '/orders/business' : '/orders/me',
        query: {if (businessId != null) 'businessId': businessId},
      ),
    ).map(Order.fromJson).toList();
  }

  Future<Order> order(String id) async =>
      Order.fromJson(ApiClient.unwrapMap(await _api.get('/orders/$id')));

  Future<void> cancelOrder(String id, {String? reason}) async {
    await _api.post(
      '/orders/$id/cancel',
      data: {if (reason != null && reason.isNotEmpty) 'reason': reason},
    );
  }

  Future<void> requestReturn(String id) async {
    await _api.post('/orders/$id/return');
  }

  Future<void> updateOrderStatus(String id, String status) async {
    await _api.patch('/orders/$id/status', data: {'status': status});
  }

  Future<Order> createOrder(Json payload) async => Order.fromJson(
    ApiClient.unwrapMap(await _api.post('/orders', data: payload)),
  );

  Future<Json> createCheckout(String orderId) async {
    final idempotencyKey = const Uuid().v4();
    return ApiClient.unwrapMap(
      await _api.post(
        '/payments/checkout',
        data: {'orderId': orderId, 'idempotencyKey': idempotencyKey},
        headers: {'Idempotency-Key': idempotencyKey},
      ),
    );
  }

  Future<Json> createSubscriptionCheckout(String subscriptionId) async {
    final idempotencyKey = const Uuid().v4();
    return ApiClient.unwrapMap(
      await _api.post(
        '/payments/checkout',
        data: {
          'subscriptionId': subscriptionId,
          'idempotencyKey': idempotencyKey,
        },
        headers: {'Idempotency-Key': idempotencyKey},
      ),
    );
  }

  Future<List<Json>> payments() async =>
      ApiClient.unwrapList(await _api.get('/payments/me'));

  Future<List<Json>> jobs() async => ApiClient.unwrapList(
    await _api.get('/jobs', query: {'page': 1, 'pageSize': 50}),
  );

  Future<Json> job(String id) async =>
      ApiClient.unwrapMap(await _api.get('/jobs/$id'));

  Future<Json> applyJob(String id, Json payload) async => ApiClient.unwrapMap(
    await _api.post('/jobs/$id/applications', data: payload),
  );

  Future<List<Json>> jobApplications() async =>
      ApiClient.unwrapList(await _api.get('/jobs/applications/me'));

  Future<List<Json>> managedJobs(String businessId) async =>
      ApiClient.unwrapList(
        await _api.get('/jobs/manage', query: {'businessId': businessId}),
      );

  Future<Json> createJob(Json payload) async =>
      ApiClient.unwrapMap(await _api.post('/jobs', data: payload));

  Future<Json> updateJob(String id, Json payload) async =>
      ApiClient.unwrapMap(await _api.patch('/jobs/$id', data: payload));

  Future<void> publishJob(String id) async {
    await _api.post('/jobs/$id/publish');
  }

  Future<void> closeJob(String id) async {
    await _api.post('/jobs/$id/close');
  }

  Future<List<Json>> jobApplicants(String jobId) async =>
      ApiClient.unwrapList(await _api.get('/jobs/$jobId/applications'));

  Future<void> updateJobApplication(String applicationId, String status) async {
    await _api.patch(
      '/jobs/applications/$applicationId',
      data: {'status': status},
    );
  }

  Future<List<Json>> weeklyDraws() async =>
      ApiClient.unwrapList(await _api.get('/weekly-draws'));

  Future<List<Json>> myDrawEntries() async =>
      ApiClient.unwrapList(await _api.get('/weekly-draws/entries/me'));

  Future<Json> claimDrawEntry(String code) async => ApiClient.unwrapMap(
    await _api.post('/weekly-draws/entries/claim', data: {'code': code}),
  );

  Future<Json> issueDrawEntry(
    String drawId, {
    required String businessId,
    required double purchaseAmount,
    String? receiptReference,
  }) async => ApiClient.unwrapMap(
    await _api.post(
      '/weekly-draws/$drawId/entries',
      data: {
        'businessId': businessId,
        'purchaseAmount': purchaseAmount,
        if (receiptReference != null && receiptReference.trim().isNotEmpty)
          'receiptReference': receiptReference.trim(),
      },
    ),
  );

  Future<List<Json>> businessDrawEntries(
    String drawId,
    String businessId,
  ) async => ApiClient.unwrapList(
    await _api.get(
      '/weekly-draws/$drawId/entries',
      query: {'businessId': businessId},
    ),
  );

  Future<List<Json>> bookings() async =>
      ApiClient.unwrapList(await _api.get('/bookings/mine'));

  Future<Json> createBooking(Json payload) async =>
      ApiClient.unwrapMap(await _api.post('/bookings', data: payload));

  Future<List<Json>> bookingProviders(
    String businessId,
    String serviceId,
  ) async => ApiClient.unwrapList(
    await _api.get(
      '/booking-availability/providers',
      query: {'businessId': businessId, 'serviceId': serviceId},
    ),
  );

  Future<List<Json>> bookingSlots({
    required String businessId,
    required String serviceId,
    required String date,
    String? providerId,
  }) async => ApiClient.unwrapList(
    await _api.get(
      '/booking-availability/slots',
      query: {
        'businessId': businessId,
        'serviceId': serviceId,
        'date': date,
        if (providerId != null && providerId.isNotEmpty)
          'providerId': providerId,
      },
    ),
  );

  Future<Json> rescheduleBooking(
    String id, {
    required String startsAt,
    required String providerId,
  }) async => ApiClient.unwrapMap(
    await _api.post(
      '/bookings/$id/reschedule',
      data: {'startsAt': startsAt, 'providerId': providerId},
    ),
  );

  Future<void> cancelBooking(String id) async {
    await _api.post('/bookings/$id/cancel');
  }

  Future<List<Json>> managedBookings(String businessId) async =>
      ApiClient.unwrapList(
        await _api.get('/bookings/manage', query: {'businessId': businessId}),
      );

  Future<Json> bookingSetup(String businessId) async => ApiClient.unwrapMap(
    await _api.get('/bookings/setup', query: {'businessId': businessId}),
  );

  Future<Json> createBookingProvider(Json payload) async => ApiClient.unwrapMap(
    await _api.post('/bookings/providers', data: payload),
  );

  Future<Json> createBookingSchedule(Json payload) async => ApiClient.unwrapMap(
    await _api.post('/bookings/schedules', data: payload),
  );

  Future<void> deleteBookingSchedule(String id) async {
    await _api.delete('/bookings/schedules/$id');
  }

  Future<Json> createBookingTimeOff(Json payload) async =>
      ApiClient.unwrapMap(await _api.post('/bookings/time-off', data: payload));

  Future<Json> updateBooking(String id, Json payload) async =>
      ApiClient.unwrapMap(await _api.patch('/bookings/$id', data: payload));

  Future<List<Json>> clubChapters() async =>
      ApiClient.unwrapList(await _api.get('/business-club/chapters'));

  Future<Json> clubOverview() async =>
      ApiClient.unwrapMap(await _api.get('/business-club/overview'));

  Future<Json> joinClubChapter(String chapterId, String businessId) async =>
      ApiClient.unwrapMap(
        await _api.post(
          '/business-club/chapters/$chapterId/join',
          data: {'businessId': businessId},
        ),
      );

  Future<List<Json>> clubMessages(String chapterId) async =>
      ApiClient.unwrapList(
        await _api.get('/business-club/chapters/$chapterId/messages'),
      );

  Future<Json> sendClubMessage(String chapterId, String body) async =>
      ApiClient.unwrapMap(
        await _api.post(
          '/business-club/chapters/$chapterId/messages',
          data: {'body': body},
        ),
      );

  Future<List<Json>> clubMembers(String chapterId) async =>
      ApiClient.unwrapList(
        await _api.get('/business-club/chapters/$chapterId/members'),
      );

  Future<List<Json>> clubEvents(String chapterId) async => ApiClient.unwrapList(
    await _api.get('/business-club/chapters/$chapterId/events'),
  );

  Future<Json> createClubEvent(String chapterId, Json payload) async =>
      ApiClient.unwrapMap(
        await _api.post(
          '/business-club/chapters/$chapterId/events',
          data: payload,
        ),
      );

  Future<void> registerClubEvent(String chapterId, String eventId) async {
    await _api.post(
      '/business-club/chapters/$chapterId/events/$eventId/register',
    );
  }

  Future<void> cancelClubEventRegistration(
    String chapterId,
    String eventId,
  ) async {
    await _api.delete(
      '/business-club/chapters/$chapterId/events/$eventId/register',
    );
  }

  Future<List<Json>> clubReferrals(String chapterId) async =>
      ApiClient.unwrapList(
        await _api.get('/business-club/chapters/$chapterId/referrals'),
      );

  Future<Json> createClubReferral(String chapterId, Json payload) async =>
      ApiClient.unwrapMap(
        await _api.post(
          '/business-club/chapters/$chapterId/referrals',
          data: payload,
        ),
      );

  Future<void> updateClubReferral(
    String chapterId,
    String referralId,
    String status,
  ) async {
    await _api.patch(
      '/business-club/chapters/$chapterId/referrals/$referralId',
      data: {'status': status},
    );
  }

  Future<List<Json>> deliveries(String businessId) async =>
      ApiClient.unwrapList(
        await _api.get('/deliveries/manage', query: {'businessId': businessId}),
      );

  Future<Json> deliveryReadiness(String businessId) async =>
      ApiClient.unwrapMap(
        await _api.get(
          '/deliveries/readiness',
          query: {'businessId': businessId},
        ),
      );

  Future<List<Json>> deliveryOrders(String businessId) async {
    final orders = ApiClient.unwrapList(
      await _api.get('/orders/business', query: {'businessId': businessId}),
    );
    final shipments = await deliveries(businessId);
    final shipmentByOrder = {
      for (final shipment in shipments) shipment.string('orderId'): shipment,
    };
    return orders
        .where(
          (order) => order.string('fulfilmentType').toLowerCase() == 'delivery',
        )
        .map(
          (order) => <String, dynamic>{
            ...order,
            'deliveryShipment': shipmentByOrder[order.string('id')],
          },
        )
        .toList();
  }

  Future<Json> quoteDelivery(String orderId) async => ApiClient.unwrapMap(
    await _api.post('/deliveries/quote', data: {'orderId': orderId}),
  );

  Future<Json> createDelivery(String orderId) async => ApiClient.unwrapMap(
    await _api.post('/deliveries/create', data: {'orderId': orderId}),
  );

  Future<Json> trackDelivery(String orderId) async =>
      ApiClient.unwrapMap(await _api.get('/deliveries/$orderId'));

  Future<void> cancelDelivery(String orderId) async {
    await _api.post('/deliveries/$orderId/cancel');
  }

  Future<Json> updateDeliveryDispatch(String orderId, Json payload) async =>
      ApiClient.unwrapMap(
        await _api.patch('/deliveries/$orderId/dispatch', data: payload),
      );

  Future<Json> captureDeliveryProof(String orderId, Json payload) async =>
      ApiClient.unwrapMap(
        await _api.post('/deliveries/$orderId/proof', data: payload),
      );

  Future<Json> settleDelivery(String orderId, Json payload) async =>
      ApiClient.unwrapMap(
        await _api.post('/deliveries/$orderId/settle', data: payload),
      );

  Future<String> uploadPrivateImage({
    required Uint8List bytes,
    required String fileName,
    required String contentType,
    required String purpose,
    required String businessId,
  }) async {
    final checksum = sha256.convert(bytes).toString();
    final descriptor = <String, dynamic>{
      'purpose': purpose,
      'businessId': businessId,
      'fileName': fileName,
      'contentType': contentType,
      'sizeBytes': bytes.length,
      'sha256': checksum,
    };
    final signed = ApiClient.unwrapMap(
      await _api.post('/media/uploads', data: descriptor),
    );
    final headers = signed['headers'] is Map
        ? Map<String, dynamic>.from(signed['headers'] as Map)
        : <String, dynamic>{};
    await _api.putExternal(
      signed.string('uploadUrl'),
      data: bytes,
      headers: headers,
    );
    final completed = ApiClient.unwrapMap(
      await _api.post(
        '/media/uploads/complete',
        data: {...descriptor, 'objectKey': signed.string('objectKey')},
      ),
    );
    return completed.string('objectKey');
  }

  Future<List<Lead>> leads() async => ApiClient.unwrapList(
    await _api.get('/leads'),
  ).map(Lead.fromJson).toList();

  Future<Lead> acceptLead(String assignmentId) async => Lead.fromJson(
    ApiClient.unwrapMap(
      await _api.post('/leads/assignments/$assignmentId/accept'),
    ),
  );

  Future<void> declineLead(String assignmentId) async {
    await _api.post('/leads/assignments/$assignmentId/decline');
  }

  Future<Json> leadStatus(String leadId) async =>
      ApiClient.unwrapMap(await _api.get('/leads/$leadId/status'));

  Future<void> recordSearchIntent(
    SearchFilters filters, {
    String source = 'businesses',
  }) async {
    if (filters.query.trim().length < 2) return;
    await _api.post(
      '/leads/search-intents',
      data: {
        'query': filters.query.trim(),
        if (filters.location.trim().isNotEmpty)
          'location': filters.location.trim(),
        if (filters.latitude != null) 'latitude': filters.latitude,
        if (filters.longitude != null) 'longitude': filters.longitude,
        'radiusKm': filters.radiusKm,
        'source': source,
      },
    );
  }

  Future<List<Json>> referrals(String businessId) async => ApiClient.unwrapList(
    await _api.get('/leads/referrals', query: {'businessId': businessId}),
  );

  Future<Json> createReferral(Json payload) async =>
      ApiClient.unwrapMap(await _api.post('/leads/referrals', data: payload));

  Future<void> updateReferral(String id, String status) async {
    await _api.patch('/leads/referrals/$id', data: {'status': status});
  }

  Future<List<SubscriptionPlan>> subscriptionPlans() async =>
      ApiClient.unwrapList(
        await _api.get('/subscriptions/plans'),
      ).map(SubscriptionPlan.fromJson).toList();

  Future<Json?> currentSubscription(String businessId) async {
    final response = await _api.get(
      '/subscriptions/current',
      query: {'businessId': businessId},
    );
    final data = ApiClient.unwrapList(response);
    return data.isEmpty ? null : data.first;
  }

  Future<Json> createSubscription({
    required String businessId,
    required String planId,
    required String billingCycle,
  }) async => ApiClient.unwrapMap(
    await _api.post(
      '/subscriptions',
      data: {
        'businessId': businessId,
        'planId': planId,
        'billingCycle': billingCycle,
      },
    ),
  );

  Future<void> cancelSubscription(String id) async {
    await _api.post('/subscriptions/$id/cancel');
  }

  Future<List<Json>> verificationRequests(String businessId) async =>
      ApiClient.unwrapList(
        await _api.get('/verification/mine', query: {'businessId': businessId}),
      );

  Future<Json> createVerification(Json payload) async =>
      ApiClient.unwrapMap(await _api.post('/verification', data: payload));

  Future<List<Json>> verificationQueue({String? status}) async =>
      ApiClient.unwrapList(
        await _api.get(
          '/verification/queue',
          query: {if (status != null) 'status': status},
        ),
      );

  Future<Json> verificationRequest(String id) async =>
      ApiClient.unwrapMap(await _api.get('/verification/$id'));

  Future<Json> decideVerification(String id, Json payload) async =>
      ApiClient.unwrapMap(
        await _api.post('/verification/$id/decision', data: payload),
      );

  Future<List<Json>> adminWeeklyDraws() async =>
      ApiClient.unwrapList(await _api.get('/admin/weekly-draws'));

  Future<Json> createWeeklyDraw(Json payload) async => ApiClient.unwrapMap(
    await _api.post('/admin/weekly-draws', data: payload),
  );

  Future<Json> advanceWeeklyDraw(String id, String action) async =>
      ApiClient.unwrapMap(await _api.post('/admin/weekly-draws/$id/$action'));

  Future<Json> adminBusinessClub() async =>
      ApiClient.unwrapMap(await _api.get('/admin/business-club'));

  Future<Json> createAdminClubChapter(Json payload) async =>
      ApiClient.unwrapMap(
        await _api.post('/admin/business-club/chapters', data: payload),
      );

  Future<Json> moderateClubMembership(String id, Json payload) async =>
      ApiClient.unwrapMap(
        await _api.patch('/admin/business-club/memberships/$id', data: payload),
      );

  Future<void> moderateClubMessage(String id, String reason) async {
    await _api.delete(
      '/admin/business-club/messages/$id',
      data: {'reason': reason},
    );
  }

  Future<Json> moderateAdminReview(String id, Json payload) async =>
      ApiClient.unwrapMap(
        await _api.patch('/admin/reviews/$id/moderate', data: payload),
      );

  Future<Json> moderateAdminProduct(String id, Json payload) async =>
      ApiClient.unwrapMap(
        await _api.patch('/admin/products/$id/moderate', data: payload),
      );

  Future<List<Json>> adminConversations() async =>
      ApiClient.unwrapList(await _api.get('/admin/conversations'));

  Future<List<Json>> adminConversationMessages(String id) async =>
      ApiClient.unwrapList(await _api.get('/admin/conversations/$id/messages'));

  Future<Json> moderateAdminConversation(String id, Json payload) async =>
      ApiClient.unwrapMap(
        await _api.patch('/admin/conversations/$id', data: payload),
      );

  Future<Json> businessAnalytics(String businessId) async =>
      ApiClient.unwrapMap(
        await _api.get(
          '/analytics/business',
          query: {'businessId': businessId},
        ),
      );

  Future<void> track(
    String eventType, {
    String? businessId,
    String? source,
  }) async {
    await _api.post(
      '/analytics/events',
      data: {
        'eventType': eventType,
        'sessionId': 'mobile-${const Uuid().v4()}',
        if (businessId != null) 'businessId': businessId,
        if (source != null) 'source': source,
      },
    );
  }
}

final appRepositoryProvider = Provider<AppRepository>(
  (ref) => AppRepository(ref.watch(apiClientProvider)),
);
