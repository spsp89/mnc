import 'dart:async';

import 'package:bnc_mobile/core/data/app_repository.dart';
import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/core/storage/app_preferences.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class SessionState {
  const SessionState({
    this.restoring = true,
    this.user,
    this.busy = false,
    this.developmentCode,
    this.error,
  });

  final bool restoring;
  final UserProfile? user;
  final bool busy;
  final String? developmentCode;
  final String? error;

  bool get authenticated => user != null;

  SessionState copyWith({
    bool? restoring,
    UserProfile? user,
    bool clearUser = false,
    bool? busy,
    String? developmentCode,
    bool clearDevelopmentCode = false,
    String? error,
    bool clearError = false,
  }) => SessionState(
    restoring: restoring ?? this.restoring,
    user: clearUser ? null : (user ?? this.user),
    busy: busy ?? this.busy,
    developmentCode: clearDevelopmentCode
        ? null
        : (developmentCode ?? this.developmentCode),
    error: clearError ? null : (error ?? this.error),
  );
}

class SessionController extends StateNotifier<SessionState> {
  SessionController(this._repository, this._store)
    : super(const SessionState()) {
    unawaited(restore());
  }

  final AppRepository _repository;
  final SessionStore _store;

  Future<void> restore() async {
    final user = await _store.user;
    state = state.copyWith(restoring: false, user: user);
  }

  Future<bool> requestOtp(String phone) async {
    state = state.copyWith(
      busy: true,
      clearError: true,
      clearDevelopmentCode: true,
    );
    try {
      final code = await _repository.requestOtp(phone);
      state = state.copyWith(busy: false, developmentCode: code);
      return true;
    } on Object catch (error) {
      state = state.copyWith(busy: false, error: '$error');
      return false;
    }
  }

  Future<bool> verifyOtp(String phone, String code) async {
    state = state.copyWith(busy: true, clearError: true);
    try {
      final result = await _repository.verifyOtp(phone, code);
      await _store.saveSession(
        accessToken: result.session.string('accessToken'),
        refreshToken: result.session.string('refreshToken'),
        user: Map<String, dynamic>.from(result.session['user'] as Map),
      );
      state = state.copyWith(
        restoring: false,
        user: result.user,
        busy: false,
        clearDevelopmentCode: true,
      );
      return true;
    } on Object catch (error) {
      state = state.copyWith(busy: false, error: '$error');
      return false;
    }
  }

  Future<bool> registerEmail({
    required String email,
    required String password,
    required String displayName,
  }) async {
    state = state.copyWith(
      busy: true,
      clearError: true,
      clearDevelopmentCode: true,
    );
    try {
      final code = await _repository.registerEmail(
        email: email,
        password: password,
        displayName: displayName,
      );
      state = state.copyWith(busy: false, developmentCode: code);
      return true;
    } on Object catch (error) {
      state = state.copyWith(busy: false, error: '$error');
      return false;
    }
  }

  Future<bool> verifyEmail(String email, String code) async {
    state = state.copyWith(busy: true, clearError: true);
    try {
      final result = await _repository.verifyEmail(email, code);
      await _saveSession(result);
      return true;
    } on Object catch (error) {
      state = state.copyWith(busy: false, error: '$error');
      return false;
    }
  }

  Future<bool> loginEmail(String email, String password) async {
    state = state.copyWith(busy: true, clearError: true);
    try {
      final result = await _repository.loginEmail(email, password);
      await _saveSession(result);
      return true;
    } on Object catch (error) {
      state = state.copyWith(busy: false, error: '$error');
      return false;
    }
  }

  Future<void> _saveSession(({UserProfile user, Json session}) result) async {
    await _store.saveSession(
      accessToken: result.session.string('accessToken'),
      refreshToken: result.session.string('refreshToken'),
      user: Map<String, dynamic>.from(result.session['user'] as Map),
    );
    state = state.copyWith(
      restoring: false,
      user: result.user,
      busy: false,
      clearDevelopmentCode: true,
    );
  }

  Future<void> updateUser(UserProfile user) async {
    final current = state.user;
    final effective = current == null
        ? user
        : UserProfile(
            id: user.id.isEmpty ? current.id : user.id,
            phone: user.phone.isEmpty ? current.phone : user.phone,
            email: user.email.isEmpty ? current.email : user.email,
            displayName: user.displayName.isEmpty
                ? current.displayName
                : user.displayName,
            role: current.role,
            preferredLanguage: user.preferredLanguage,
          );
    final access = await _store.accessToken ?? '';
    final refresh = await _store.refreshToken ?? '';
    final json = <String, dynamic>{
      'id': effective.id,
      'phone': effective.phone,
      'email': effective.email,
      'displayName': effective.displayName,
      'role': effective.role,
      'preferredLanguage': effective.preferredLanguage,
    };
    await _store.saveSession(
      accessToken: access,
      refreshToken: refresh,
      user: json,
    );
    state = state.copyWith(user: effective);
  }

  Future<void> logout() async {
    final refreshToken = await _store.refreshToken;
    if (refreshToken != null && refreshToken.isNotEmpty) {
      try {
        await _repository.logout(refreshToken);
      } on Object {
        // Local sign-out must remain available if the server is unreachable.
      }
    }
    await _store.clear();
    state = const SessionState(restoring: false);
  }
}

final sessionProvider = StateNotifierProvider<SessionController, SessionState>(
  (ref) => SessionController(
    ref.watch(appRepositoryProvider),
    ref.watch(sessionStoreProvider),
  ),
);

class SearchController extends StateNotifier<AsyncValue<PageResult<Business>>> {
  SearchController(this._repository) : super(const AsyncValue.loading()) {
    unawaited(search());
  }

  final AppRepository _repository;
  SearchFilters filters = const SearchFilters();

  Future<void> search({
    SearchFilters? withFilters,
    bool recordHistory = false,
    String interfaceLanguage = 'en',
  }) async {
    if (withFilters != null) filters = withFilters;
    state = const AsyncValue.loading();
    try {
      final result = await _repository.searchBusinesses(filters);
      state = AsyncValue.data(result);
      if (recordHistory && filters.query.trim().isNotEmpty) {
        try {
          await _repository.recordSearchHistory(
            filters,
            resultCount: result.total,
            interfaceLanguage: interfaceLanguage,
          );
        } on Object {
          // Search history is auxiliary and must never hide valid results.
        }
        try {
          await _repository.recordSearchIntent(filters, source: 'businesses');
        } on Object {
          // Search-demand alerts are auxiliary and must never hide results.
        }
      }
    } on Object catch (error, stackTrace) {
      state = AsyncValue.error(error, stackTrace);
    }
  }

  Future<void> loadMore() async {
    final current = state.valueOrNull;
    if (current == null || !current.hasMore) return;
    final next = await _repository.searchBusinesses(
      filters,
      page: current.page + 1,
    );
    state = AsyncValue.data(
      PageResult(
        items: [...current.items, ...next.items],
        page: next.page,
        pageSize: next.pageSize,
        total: next.total,
        requestId: next.requestId,
      ),
    );
  }
}

final searchProvider =
    StateNotifierProvider<SearchController, AsyncValue<PageResult<Business>>>(
      (ref) => SearchController(ref.watch(appRepositoryProvider)),
    );

class SavedController extends StateNotifier<Set<String>> {
  SavedController(this._repository) : super(const {}) {
    unawaited(load());
  }

  final AppRepository _repository;

  Future<void> load() async {
    try {
      final businesses = await _repository.savedBusinesses();
      state = businesses.map((business) => business.id).toSet();
    } on Object {
      state = const {};
    }
  }

  Future<void> toggle(String businessId) async {
    final saved = !state.contains(businessId);
    state = saved
        ? {...state, businessId}
        : state.where((id) => id != businessId).toSet();
    try {
      await _repository.setBusinessSaved(businessId, saved: saved);
    } on Object {
      state = saved
          ? state.where((id) => id != businessId).toSet()
          : {...state, businessId};
      rethrow;
    }
  }
}

final savedProvider = StateNotifierProvider<SavedController, Set<String>>(
  (ref) => SavedController(ref.watch(appRepositoryProvider)),
);

class CartLine {
  const CartLine({required this.product, this.quantity = 1});

  final Product product;
  final int quantity;

  CartLine copyWith({int? quantity}) =>
      CartLine(product: product, quantity: quantity ?? this.quantity);
}

class CartController extends StateNotifier<List<CartLine>> {
  CartController() : super(const []);

  void add(Product product) {
    final index = state.indexWhere((line) => line.product.id == product.id);
    if (index < 0) {
      state = [
        ...state,
        CartLine(
          product: product,
          quantity: product.minimumOrderQty < 1 ? 1 : product.minimumOrderQty,
        ),
      ];
      return;
    }
    final updated = [...state];
    updated[index] = updated[index].copyWith(
      quantity: updated[index].quantity + 1,
    );
    state = updated;
  }

  void updateQuantity(String productId, int quantity) {
    if (quantity <= 0) {
      state = state.where((line) => line.product.id != productId).toList();
      return;
    }
    state = [
      for (final line in state)
        if (line.product.id == productId)
          line.copyWith(
            quantity: quantity < line.product.minimumOrderQty
                ? line.product.minimumOrderQty
                : quantity,
          )
        else
          line,
    ];
  }

  void clear() => state = const [];
}

final cartProvider = StateNotifierProvider<CartController, List<CartLine>>(
  (ref) => CartController(),
);

final cartTotalProvider = Provider<double>(
  (ref) => ref
      .watch(cartProvider)
      .fold(
        0,
        (total, line) => total + line.product.effectivePrice * line.quantity,
      ),
);

final categoriesProvider = FutureProvider<List<Category>>(
  (ref) => ref
      .watch(appRepositoryProvider)
      .categories(language: ref.watch(appSettingsProvider).locale.languageCode),
);

final featuredBusinessesProvider = FutureProvider<List<Business>>((ref) async {
  final settings = ref.watch(appSettingsProvider);
  return (await ref
          .watch(appRepositoryProvider)
          .searchBusinesses(
            SearchFilters(
              location: settings.apiLocation,
              latitude: settings.apiLatitude,
              longitude: settings.apiLongitude,
              radiusKm: settings.searchRadiusKm,
            ),
          ))
      .items;
});

final productsProvider = FutureProvider<List<Product>>((ref) {
  final settings = ref.watch(appSettingsProvider);
  return ref
      .watch(appRepositoryProvider)
      .products(
        city: settings.apiLocation,
        latitude: settings.apiLatitude,
        longitude: settings.apiLongitude,
        radiusKm: settings.searchRadiusKm,
      );
});

final bestSellerProductsProvider = FutureProvider<List<Product>>(
  (ref) => ref
      .watch(appRepositoryProvider)
      .products(courier: true, sort: 'best-selling', pageSize: 12),
);

final topServicesProvider = FutureProvider<List<Service>>(
  (ref) => ref
      .watch(appRepositoryProvider)
      .services(sort: 'top-rated', pageSize: 10),
);

final offersProvider = FutureProvider<List<Offer>>(
  (ref) => ref
      .watch(appRepositoryProvider)
      .offers(city: ref.watch(appSettingsProvider).apiLocation),
);

final conversationsProvider = FutureProvider<List<Conversation>>(
  (ref) => ref.watch(appRepositoryProvider).conversations(),
);

final notificationsProvider = FutureProvider<List<AppNotification>>(
  (ref) async => (await ref.watch(appRepositoryProvider).notifications())
      .where((notification) => notification.customerVisible)
      .toList(),
);

final ordersProvider = FutureProvider<List<Order>>(
  (ref) => ref.watch(appRepositoryProvider).orders(),
);

final leadsProvider = FutureProvider<List<Lead>>(
  (ref) => ref.watch(appRepositoryProvider).leads(),
);

final connectivityProvider = StreamProvider<bool>((ref) async* {
  final connectivity = Connectivity();
  final initial = await connectivity.checkConnectivity();
  yield !initial.contains(ConnectivityResult.none);
  await for (final result in connectivity.onConnectivityChanged) {
    yield !result.contains(ConnectivityResult.none);
  }
});
