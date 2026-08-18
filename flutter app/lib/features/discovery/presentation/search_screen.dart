import 'dart:async';

import 'package:bnc_mobile/core/config/app_config.dart';
import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/core/state/app_state.dart';
import 'package:bnc_mobile/core/storage/app_preferences.dart';
import 'package:bnc_mobile/design_system/bnc_theme.dart';
import 'package:bnc_mobile/design_system/components.dart';
import 'package:bnc_mobile/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import 'package:speech_to_text/speech_recognition_error.dart';
import 'package:speech_to_text/speech_recognition_result.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;

const _radiusOptions = [1, 3, 5, 10, 25, 50];

SearchScreen searchScreenFromUri(Uri uri) {
  final query = uri.queryParameters;
  return SearchScreen(
    initialQuery: query['q'],
    initialLocation: query['location'],
    initialConstituency: query['constituency'],
    initialDistrict: query['district'],
    initialState: query['state'],
    initialLatitude: double.tryParse(query['latitude'] ?? ''),
    initialLongitude: double.tryParse(query['longitude'] ?? ''),
    initialRadiusKm: int.tryParse(query['radius'] ?? ''),
    initialRating: double.tryParse(query['rating'] ?? '') ?? 0,
    initialOpenNow: query['openNow'] == 'true' || query['open'] == 'true',
    initialVerified: query['verified'] == 'true',
    initialOffers: query['offers'] == 'true',
    initialPremium: query['premium'] == 'true',
    initialHomeService: query['homeService'] == 'true',
    initialDelivery: query['delivery'] == 'true',
    initialFastResponse: query['fastResponse'] == 'true',
    initialPriceRange:
        int.tryParse(query['priceRange'] ?? '') ?? query['price']?.length ?? 0,
    initialPayment: query['payment'],
    initialLanguage: query['language'],
    initialMinYears: int.tryParse(query['minYears'] ?? '') ?? 0,
    initialSort: switch (query['sort']) {
      'nearest' => 'distance',
      'recommended' || null => 'relevance',
      final value => value,
    },
    initialMapView: query['view'] == 'map',
  );
}

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({
    super.key,
    this.initialQuery,
    this.initialLocation,
    this.initialConstituency,
    this.initialDistrict,
    this.initialState,
    this.initialLatitude,
    this.initialLongitude,
    this.initialRadiusKm,
    this.initialRating = 0,
    this.initialOpenNow = false,
    this.initialVerified = false,
    this.initialOffers = false,
    this.initialPremium = false,
    this.initialHomeService = false,
    this.initialDelivery = false,
    this.initialFastResponse = false,
    this.initialPriceRange = 0,
    this.initialPayment,
    this.initialLanguage,
    this.initialMinYears = 0,
    this.initialSort = 'relevance',
    this.initialMapView = false,
  });

  final String? initialQuery;
  final String? initialLocation;
  final String? initialConstituency;
  final String? initialDistrict;
  final String? initialState;
  final double? initialLatitude;
  final double? initialLongitude;
  final int? initialRadiusKm;
  final double initialRating;
  final bool initialOpenNow;
  final bool initialVerified;
  final bool initialOffers;
  final bool initialPremium;
  final bool initialHomeService;
  final bool initialDelivery;
  final bool initialFastResponse;
  final int initialPriceRange;
  final String? initialPayment;
  final String? initialLanguage;
  final int initialMinYears;
  final String initialSort;
  final bool initialMapView;

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  late final TextEditingController _queryController;
  final stt.SpeechToText _speech = stt.SpeechToText();
  Timer? _debounce;
  bool _mapView = false;
  bool _loadingMore = false;
  bool _speechInitialized = false;
  bool _listening = false;

  @override
  void initState() {
    super.initState();
    _mapView = widget.initialMapView;
    _queryController = TextEditingController(text: widget.initialQuery ?? '');
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final current = ref.read(searchProvider.notifier).filters;
      final settings = ref.read(appSettingsProvider);
      final requestedLocation = widget.initialLocation?.trim();
      final usingRequestedLocation =
          (requestedLocation != null && requestedLocation.isNotEmpty) ||
          (widget.initialConstituency?.trim().isNotEmpty ?? false) ||
          (widget.initialDistrict?.trim().isNotEmpty ?? false) ||
          (widget.initialState?.trim().isNotEmpty ?? false) ||
          widget.initialLatitude != null ||
          widget.initialLongitude != null;
      final normalizedRequestedLocation =
          requestedLocation == currentAreaLocation ||
              requestedLocation == 'Current location'
          ? ''
          : requestedLocation;
      final knownCoordinates = normalizedRequestedLocation == null
          ? null
          : bncCityCoordinates[normalizedRequestedLocation];
      final latitude = usingRequestedLocation
          ? widget.initialLatitude ?? knownCoordinates?.$1
          : settings.apiLatitude;
      final longitude = usingRequestedLocation
          ? widget.initialLongitude ?? knownCoordinates?.$2
          : settings.apiLongitude;
      ref
          .read(searchProvider.notifier)
          .search(
            withFilters: SearchFilters(
              query: widget.initialQuery ?? current.query,
              location: usingRequestedLocation
                  ? (normalizedRequestedLocation ?? '')
                  : settings.apiLocation,
              constituency: widget.initialConstituency ?? '',
              district: widget.initialDistrict ?? '',
              state: widget.initialState ?? '',
              latitude: latitude,
              longitude: longitude,
              radiusKm: widget.initialRadiusKm ?? settings.searchRadiusKm,
              rating: widget.initialRating,
              openNow: widget.initialOpenNow,
              verified: widget.initialVerified,
              offers: widget.initialOffers,
              premium: widget.initialPremium,
              homeService: widget.initialHomeService,
              delivery: widget.initialDelivery,
              fastResponse: widget.initialFastResponse,
              priceRange: widget.initialPriceRange,
              payment: widget.initialPayment ?? '',
              language: widget.initialLanguage ?? '',
              minYears: widget.initialMinYears,
              sort: widget.initialSort,
            ),
            recordHistory:
                ref.read(sessionProvider).authenticated &&
                (widget.initialQuery?.trim().isNotEmpty ?? false),
            interfaceLanguage: settings.locale.languageCode,
          );
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    unawaited(_speech.cancel());
    _queryController.dispose();
    super.dispose();
  }

  void _onQueryChanged(String value) {
    _debounce?.cancel();
    setState(() {});
    _debounce = Timer(const Duration(milliseconds: 420), () {
      final controller = ref.read(searchProvider.notifier);
      controller.search(withFilters: controller.filters.copyWith(query: value));
    });
  }

  void _submitQuery(String value) {
    _debounce?.cancel();
    final controller = ref.read(searchProvider.notifier);
    unawaited(
      controller.search(
        withFilters: controller.filters.copyWith(query: value.trim()),
        recordHistory: ref.read(sessionProvider).authenticated,
        interfaceLanguage: ref.read(appSettingsProvider).locale.languageCode,
      ),
    );
  }

  Future<void> _toggleVoiceSearch() async {
    if (_listening || _speech.isListening) {
      await _speech.stop();
      if (mounted) setState(() => _listening = false);
      return;
    }

    try {
      if (!_speechInitialized) {
        _speechInitialized = await _speech.initialize(
          onStatus: _onSpeechStatus,
          onError: _onSpeechError,
          options: [stt.SpeechToText.androidNoBluetooth],
        );
      }
      if (!_speechInitialized) {
        _showVoiceMessage(
          'Voice search is unavailable. Allow microphone and speech '
          'recognition access in device settings, then try again.',
        );
        return;
      }

      final localeId = await _preferredSpeechLocale();
      await _speech.listen(
        onResult: _onSpeechResult,
        listenOptions: stt.SpeechListenOptions(
          listenFor: const Duration(seconds: 30),
          pauseFor: const Duration(seconds: 3),
          localeId: localeId,
          partialResults: true,
          cancelOnError: true,
          listenMode: stt.ListenMode.search,
        ),
      );
      if (mounted) setState(() => _listening = true);
    } on Object {
      if (mounted) {
        setState(() => _listening = false);
        _showVoiceMessage(
          'Voice search could not start. Check microphone access and try '
          'again.',
        );
      }
    }
  }

  Future<String?> _preferredSpeechLocale() async {
    final systemLocale = await _speech.systemLocale();
    final locales = await _speech.locales();
    if (locales.isEmpty) return systemLocale?.localeId;

    String normalize(String value) => value.toLowerCase().replaceAll('-', '_');

    final language = ref.read(appSettingsProvider).locale.languageCode == 'ml'
        ? 'ml'
        : 'en';
    final preferred = '${language}_in';
    for (final locale in locales) {
      if (normalize(locale.localeId) == preferred) return locale.localeId;
    }
    for (final locale in locales) {
      final normalized = normalize(locale.localeId);
      if (normalized == language || normalized.startsWith('${language}_')) {
        return locale.localeId;
      }
    }
    return systemLocale?.localeId;
  }

  void _onSpeechResult(SpeechRecognitionResult result) {
    if (!mounted) return;
    final words = result.recognizedWords.trim();
    if (words.isNotEmpty) {
      _queryController.value = TextEditingValue(
        text: words,
        selection: TextSelection.collapsed(offset: words.length),
      );
      setState(() {});
    }
    if (result.finalResult && words.isNotEmpty) {
      _submitQuery(words);
    }
  }

  void _onSpeechStatus(String status) {
    if (!mounted) return;
    final listening = status == stt.SpeechToText.listeningStatus;
    if (_listening != listening) setState(() => _listening = listening);
  }

  void _onSpeechError(SpeechRecognitionError error) {
    if (!mounted) return;
    if (_listening) setState(() => _listening = false);
    final normalized = error.errorMsg.toLowerCase();
    final message =
        normalized.contains('permission') ||
            normalized.contains('recognizer_disabled')
        ? 'Voice search needs microphone and speech recognition access. '
              'Enable both in device settings and try again.'
        : normalized.contains('no_match') ||
              normalized.contains('speech_timeout')
        ? 'No speech was recognised. Tap the microphone and try again.'
        : 'Voice search is temporarily unavailable. Please try again.';
    _showVoiceMessage(message);
  }

  void _showVoiceMessage(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(searchProvider);
    final strings = AppLocalizations.of(context);
    final filters = ref.read(searchProvider.notifier).filters;
    final locationLabel =
        [
          filters.location,
          filters.constituency,
          filters.district,
          filters.state,
        ].firstWhere(
          (value) => value.trim().isNotEmpty,
          orElse: () => currentAreaLocation,
        );
    return Scaffold(
      appBar: AppBar(
        title: Text(strings.explore),
        actions: [
          IconButton(
            onPressed: () => context.push('/compare'),
            icon: const Icon(Icons.compare_arrows_rounded),
            tooltip: 'Compare businesses',
          ),
          IconButton(
            onPressed: () => setState(() => _mapView = !_mapView),
            icon: Icon(_mapView ? Icons.view_list_rounded : Icons.map_outlined),
            tooltip: _mapView ? strings.list : strings.map,
          ),
          const SizedBox(width: 6),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
            child: TextField(
              controller: _queryController,
              autofocus: widget.initialQuery?.isEmpty ?? false,
              textInputAction: TextInputAction.search,
              onChanged: _onQueryChanged,
              onSubmitted: _submitQuery,
              decoration: InputDecoration(
                hintText: strings.searchHint,
                prefixIcon: const Icon(Icons.search_rounded),
                suffixIcon: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (_queryController.text.isNotEmpty)
                      IconButton(
                        onPressed: () {
                          _queryController.clear();
                          _onQueryChanged('');
                        },
                        icon: const Icon(Icons.close_rounded),
                      ),
                    IconButton(
                      onPressed: _toggleVoiceSearch,
                      icon: Icon(
                        _listening ? Icons.mic_rounded : Icons.mic_none_rounded,
                        color: _listening
                            ? Theme.of(context).colorScheme.primary
                            : null,
                      ),
                      tooltip: _listening
                          ? 'Stop voice search'
                          : 'Search by voice',
                    ),
                  ],
                ),
              ),
            ),
          ),
          SizedBox(
            height: 42,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                const ChoiceChip(selected: true, label: Text('Businesses')),
                const SizedBox(width: 8),
                ActionChip(
                  avatar: const Icon(Icons.shopping_bag_outlined, size: 17),
                  label: const Text('Products'),
                  onPressed: () => _openCatalogue(context, '/products'),
                ),
                const SizedBox(width: 8),
                ActionChip(
                  avatar: const Icon(
                    Icons.home_repair_service_outlined,
                    size: 17,
                  ),
                  label: const Text('Services'),
                  onPressed: () => _openCatalogue(context, '/services'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 6),
          SizedBox(
            height: 48,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                ActionChip(
                  avatar: const Icon(Icons.tune_rounded, size: 18),
                  label: Text(strings.filter),
                  onPressed: () => _showFilters(context),
                ),
                const SizedBox(width: 8),
                ActionChip(
                  avatar: const Icon(Icons.location_on_outlined, size: 18),
                  label: Text('$locationLabel · ${filters.radiusKm} km'),
                  onPressed: () => _showFilters(context),
                ),
                const SizedBox(width: 8),
                FilterChip(
                  label: Text(strings.openNow),
                  selected: filters.openNow,
                  onSelected: (selected) =>
                      _update(filters.copyWith(openNow: selected)),
                ),
                const SizedBox(width: 8),
                FilterChip(
                  avatar: const Icon(Icons.verified_outlined, size: 17),
                  label: Text(strings.verified),
                  selected: filters.verified,
                  onSelected: (selected) =>
                      _update(filters.copyWith(verified: selected)),
                ),
                const SizedBox(width: 8),
                FilterChip(
                  label: Text(strings.offers),
                  selected: filters.offers,
                  onSelected: (selected) =>
                      _update(filters.copyWith(offers: selected)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: state.when(
              loading: () => ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: 5,
                separatorBuilder: (_, index) => const SizedBox(height: 12),
                itemBuilder: (_, index) =>
                    const BncSkeleton(height: 128, radius: 22),
              ),
              error: (error, stack) => ErrorState(
                error: error,
                onRetry: () => ref.read(searchProvider.notifier).search(),
              ),
              data: (result) {
                if (result.items.isEmpty) {
                  return EmptyState(
                    icon: Icons.search_off_rounded,
                    title: strings.noResults,
                    body:
                        'Try a wider radius, another location or fewer filters.',
                    action: _clearFilters,
                    actionLabel: strings.clearFilters,
                  );
                }
                return _mapView
                    ? _SearchMap(
                        businesses: result.items,
                        center: LatLng(
                          ref.watch(appSettingsProvider).latitude,
                          ref.watch(appSettingsProvider).longitude,
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: () =>
                            ref.read(searchProvider.notifier).search(),
                        child: ListView.separated(
                          padding: const EdgeInsets.fromLTRB(16, 6, 16, 100),
                          itemCount:
                              result.items.length +
                              1 +
                              (result.hasMore ? 1 : 0),
                          separatorBuilder: (_, index) =>
                              const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            if (index == 0) {
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 2),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        '${result.total} trusted results',
                                        style: Theme.of(
                                          context,
                                        ).textTheme.titleMedium,
                                      ),
                                    ),
                                    PopupMenuButton<String>(
                                      initialValue: filters.sort,
                                      onSelected: (sort) =>
                                          _update(filters.copyWith(sort: sort)),
                                      itemBuilder: (context) => const [
                                        PopupMenuItem(
                                          value: 'relevance',
                                          child: Text('Most relevant'),
                                        ),
                                        PopupMenuItem(
                                          value: 'distance',
                                          child: Text('Nearest first'),
                                        ),
                                        PopupMenuItem(
                                          value: 'rating',
                                          child: Text('Highest rated'),
                                        ),
                                        PopupMenuItem(
                                          value: 'reviews',
                                          child: Text('Most reviewed'),
                                        ),
                                        PopupMenuItem(
                                          value: 'recent',
                                          child: Text('Recently added'),
                                        ),
                                        PopupMenuItem(
                                          value: 'price-low',
                                          child: Text('Lowest price range'),
                                        ),
                                        PopupMenuItem(
                                          value: 'price-high',
                                          child: Text('Highest price range'),
                                        ),
                                      ],
                                      child: Chip(
                                        avatar: const Icon(
                                          Icons.swap_vert_rounded,
                                          size: 17,
                                        ),
                                        label: Text(
                                          filters.sort == 'relevance'
                                              ? 'Relevance'
                                              : filters.sort == 'distance'
                                              ? 'Distance'
                                              : filters.sort == 'rating'
                                              ? 'Rating'
                                              : filters.sort == 'reviews'
                                              ? 'Reviews'
                                              : filters.sort == 'recent'
                                              ? 'Recent'
                                              : filters.sort == 'price-low'
                                              ? 'Lowest price'
                                              : 'Highest price',
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }
                            if (index > result.items.length) {
                              return Padding(
                                padding: const EdgeInsets.symmetric(
                                  vertical: 8,
                                ),
                                child: OutlinedButton(
                                  onPressed: _loadingMore
                                      ? null
                                      : () async {
                                          setState(() => _loadingMore = true);
                                          try {
                                            await ref
                                                .read(searchProvider.notifier)
                                                .loadMore();
                                          } finally {
                                            if (mounted) {
                                              setState(
                                                () => _loadingMore = false,
                                              );
                                            }
                                          }
                                        },
                                  child: _loadingMore
                                      ? const SizedBox.square(
                                          dimension: 18,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                          ),
                                        )
                                      : const Text('Load more businesses'),
                                ),
                              );
                            }
                            return BusinessCard(
                              business: result.items[index - 1],
                              compact: true,
                            );
                          },
                        ),
                      );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _update(SearchFilters filters) {
    ref.read(searchProvider.notifier).search(withFilters: filters);
    setState(() {});
  }

  void _openCatalogue(BuildContext context, String path) {
    final filters = ref.read(searchProvider.notifier).filters;
    final query = <String, String>{
      if (_queryController.text.trim().isNotEmpty)
        'q': _queryController.text.trim(),
      if (filters.location.isNotEmpty) 'location': filters.location,
      if (filters.constituency.isNotEmpty) 'constituency': filters.constituency,
      if (filters.district.isNotEmpty) 'district': filters.district,
      if (filters.state.isNotEmpty) 'state': filters.state,
      if (filters.latitude != null) 'latitude': '${filters.latitude}',
      if (filters.longitude != null) 'longitude': '${filters.longitude}',
      'radius': '${filters.radiusKm}',
    };
    context.push(Uri(path: path, queryParameters: query).toString());
  }

  void _clearFilters() {
    final settings = ref.read(appSettingsProvider);
    final filters = SearchFilters(
      query: _queryController.text,
      location: settings.apiLocation,
      latitude: settings.apiLatitude,
      longitude: settings.apiLongitude,
      radiusKm: settings.searchRadiusKm,
    );
    _update(filters);
  }

  Future<void> _showFilters(BuildContext context) async {
    final initial = ref.read(searchProvider.notifier).filters;
    final selected = await showModalBottomSheet<SearchFilters>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (context) => _FilterSheet(filters: initial),
    );
    if (selected != null) _update(selected);
  }
}

class _FilterSheet extends StatefulWidget {
  const _FilterSheet({required this.filters});

  final SearchFilters filters;

  @override
  State<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<_FilterSheet> {
  late SearchFilters filters = widget.filters;
  bool _locating = false;

  SearchFilters _withLocation({
    required String location,
    required double? latitude,
    required double? longitude,
  }) => SearchFilters(
    query: filters.query,
    location: location,
    constituency: '',
    district: '',
    state: '',
    latitude: latitude,
    longitude: longitude,
    radiusKm: filters.radiusKm,
    rating: filters.rating,
    openNow: filters.openNow,
    verified: filters.verified,
    premium: filters.premium,
    offers: filters.offers,
    homeService: filters.homeService,
    delivery: filters.delivery,
    fastResponse: filters.fastResponse,
    priceRange: filters.priceRange,
    payment: filters.payment,
    language: filters.language,
    minYears: filters.minYears,
    sort: filters.sort,
  );

  Future<void> _useCurrentLocation() async {
    setState(() => _locating = true);
    try {
      if (!await Geolocator.isLocationServiceEnabled()) {
        throw StateError('Turn on device location and try again.');
      }
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        throw StateError(
          'Location permission is required to search around you.',
        );
      }
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.medium,
          timeLimit: Duration(seconds: 12),
        ),
      );
      if (!mounted) return;
      setState(
        () => filters = _withLocation(
          location: '',
          latitude: position.latitude,
          longitude: position.longitude,
        ),
      );
    } on Object catch (error) {
      if (!mounted) return;
      final message = error is StateError
          ? error.message
          : 'Your current location could not be read.';
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(message.toString())));
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  Future<void> _setPreciseLocation() async {
    final latitude = TextEditingController(
      text: filters.latitude?.toStringAsFixed(6) ?? '',
    );
    final longitude = TextEditingController(
      text: filters.longitude?.toStringAsFixed(6) ?? '',
    );
    String? validation;
    final coordinates = await showDialog<(double, double)>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Set exact coordinates'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Paste latitude and longitude from a map when GPS is unavailable.',
              ),
              const SizedBox(height: 14),
              TextField(
                controller: latitude,
                keyboardType: const TextInputType.numberWithOptions(
                  signed: true,
                  decimal: true,
                ),
                decoration: const InputDecoration(labelText: 'Latitude'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: longitude,
                keyboardType: const TextInputType.numberWithOptions(
                  signed: true,
                  decimal: true,
                ),
                decoration: const InputDecoration(labelText: 'Longitude'),
              ),
              if (validation != null) ...[
                const SizedBox(height: 8),
                Text(
                  validation!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ],
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () {
                final nextLatitude = double.tryParse(latitude.text.trim());
                final nextLongitude = double.tryParse(longitude.text.trim());
                if (nextLatitude == null ||
                    nextLongitude == null ||
                    nextLatitude < -90 ||
                    nextLatitude > 90 ||
                    nextLongitude < -180 ||
                    nextLongitude > 180) {
                  setDialogState(
                    () => validation =
                        'Enter latitude from −90 to 90 and longitude from −180 to 180.',
                  );
                  return;
                }
                Navigator.pop(context, (nextLatitude, nextLongitude));
              },
              child: const Text('Use coordinates'),
            ),
          ],
        ),
      ),
    );
    latitude.dispose();
    longitude.dispose();
    if (coordinates == null || !mounted) return;
    setState(
      () => filters = _withLocation(
        location: '',
        latitude: coordinates.$1,
        longitude: coordinates.$2,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          0,
          20,
          MediaQuery.viewInsetsOf(context).bottom + 20,
        ),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Search filters',
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                  ),
                  TextButton(
                    onPressed: () => setState(
                      () => filters = SearchFilters(
                        query: widget.filters.query,
                        location: widget.filters.location,
                        constituency: widget.filters.constituency,
                        district: widget.filters.district,
                        state: widget.filters.state,
                        latitude: widget.filters.latitude,
                        longitude: widget.filters.longitude,
                      ),
                    ),
                    child: const Text('Reset'),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Text('Location', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                initialValue: filters.location,
                items: [
                  const DropdownMenuItem(
                    value: '',
                    child: Text(currentAreaLocation),
                  ),
                  for (final city in {
                    ...bncCityCoordinates.keys,
                    if (filters.location.isNotEmpty) filters.location,
                  }.toList()..sort())
                    DropdownMenuItem(value: city, child: Text(city)),
                ],
                onChanged: (value) {
                  if (value == null || value.isEmpty) return;
                  final coordinates = bncCityCoordinates[value];
                  setState(
                    () => filters = _withLocation(
                      location: value,
                      latitude: coordinates?.$1,
                      longitude: coordinates?.$2,
                    ),
                  );
                },
              ),
              const SizedBox(height: 10),
              OutlinedButton.icon(
                onPressed: _locating ? null : _useCurrentLocation,
                icon: _locating
                    ? const SizedBox.square(
                        dimension: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.my_location_rounded),
                label: Text(
                  _locating ? 'Finding your location…' : 'Use current location',
                ),
              ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: _setPreciseLocation,
                icon: const Icon(Icons.add_location_alt_outlined),
                label: const Text('Set exact map coordinates'),
              ),
              if (filters.location.isEmpty &&
                  filters.latitude != null &&
                  filters.longitude != null) ...[
                const SizedBox(height: 8),
                Text(
                  '${filters.latitude!.toStringAsFixed(5)}, '
                  '${filters.longitude!.toStringAsFixed(5)}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
              const SizedBox(height: 22),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Search radius',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ),
                  Text(
                    '${filters.radiusKm} km',
                    style: Theme.of(
                      context,
                    ).textTheme.labelLarge?.copyWith(color: BncColors.brand),
                  ),
                ],
              ),
              Slider(
                value: _radiusOptions.indexOf(filters.radiusKm).toDouble(),
                min: 0,
                max: (_radiusOptions.length - 1).toDouble(),
                divisions: _radiusOptions.length - 1,
                label: '${filters.radiusKm} km',
                onChanged: (value) => setState(
                  () => filters = filters.copyWith(
                    radiusKm: _radiusOptions[value.round()],
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Text(
                'Minimum rating',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 10),
              SegmentedButton<double>(
                segments: const [
                  ButtonSegment(value: 0, label: Text('Any')),
                  ButtonSegment(value: 3, label: Text('3+')),
                  ButtonSegment(value: 4, label: Text('4+')),
                  ButtonSegment(value: 4.5, label: Text('4.5+')),
                ],
                selected: {filters.rating},
                onSelectionChanged: (value) => setState(
                  () => filters = filters.copyWith(rating: value.first),
                ),
              ),
              const SizedBox(height: 22),
              Text('Features', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 6,
                children: [
                  FilterChip(
                    label: const Text('Open now'),
                    selected: filters.openNow,
                    onSelected: (value) => setState(
                      () => filters = filters.copyWith(openNow: value),
                    ),
                  ),
                  FilterChip(
                    label: const Text('Verified'),
                    selected: filters.verified,
                    onSelected: (value) => setState(
                      () => filters = filters.copyWith(verified: value),
                    ),
                  ),
                  FilterChip(
                    label: const Text('BNC Select'),
                    selected: filters.premium,
                    onSelected: (value) => setState(
                      () => filters = filters.copyWith(premium: value),
                    ),
                  ),
                  FilterChip(
                    label: const Text('Offers'),
                    selected: filters.offers,
                    onSelected: (value) => setState(
                      () => filters = filters.copyWith(offers: value),
                    ),
                  ),
                  FilterChip(
                    label: const Text('Home service'),
                    selected: filters.homeService,
                    onSelected: (value) => setState(
                      () => filters = filters.copyWith(homeService: value),
                    ),
                  ),
                  FilterChip(
                    label: const Text('Delivery available'),
                    selected: filters.delivery,
                    onSelected: (value) => setState(
                      () => filters = filters.copyWith(delivery: value),
                    ),
                  ),
                  FilterChip(
                    label: const Text('Fast response'),
                    selected: filters.fastResponse,
                    onSelected: (value) => setState(
                      () => filters = filters.copyWith(fastResponse: value),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 22),
              Text(
                'More options',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 10),
              DropdownButtonFormField<int>(
                initialValue: filters.priceRange,
                decoration: const InputDecoration(labelText: 'Price range'),
                items: const [
                  DropdownMenuItem(value: 0, child: Text('Any price range')),
                  DropdownMenuItem(value: 1, child: Text('₹')),
                  DropdownMenuItem(value: 2, child: Text('₹₹')),
                  DropdownMenuItem(value: 3, child: Text('₹₹₹')),
                  DropdownMenuItem(value: 4, child: Text('₹₹₹₹')),
                ],
                onChanged: (value) => setState(
                  () => filters = filters.copyWith(priceRange: value ?? 0),
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: filters.payment,
                decoration: const InputDecoration(labelText: 'Payment method'),
                items: [
                  for (final value in {
                    '',
                    'UPI',
                    'Cards',
                    'Cash',
                    'Bank transfer',
                    if (filters.payment.isNotEmpty) filters.payment,
                  })
                    DropdownMenuItem(
                      value: value,
                      child: Text(value.isEmpty ? 'Any payment method' : value),
                    ),
                ],
                onChanged: (value) => setState(
                  () => filters = filters.copyWith(payment: value ?? ''),
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: filters.language,
                decoration: const InputDecoration(labelText: 'Language'),
                items: [
                  for (final value in {
                    '',
                    'Malayalam',
                    'English',
                    'Hindi',
                    'Tamil',
                    if (filters.language.isNotEmpty) filters.language,
                  })
                    DropdownMenuItem(
                      value: value,
                      child: Text(value.isEmpty ? 'Any language' : value),
                    ),
                ],
                onChanged: (value) => setState(
                  () => filters = filters.copyWith(language: value ?? ''),
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<int>(
                initialValue: filters.minYears,
                decoration: const InputDecoration(
                  labelText: 'Years in business',
                ),
                items: [
                  for (final value in {
                    0,
                    5,
                    10,
                    if (filters.minYears > 0) filters.minYears,
                  }.toList()..sort())
                    DropdownMenuItem(
                      value: value,
                      child: Text(
                        value == 0 ? 'Any experience' : '$value+ years',
                      ),
                    ),
                ],
                onChanged: (value) => setState(
                  () => filters = filters.copyWith(minYears: value ?? 0),
                ),
              ),
              const SizedBox(height: 26),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context, filters),
                  child: const Text('Show results'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SearchMap extends StatelessWidget {
  const _SearchMap({required this.businesses, required this.center});

  final List<Business> businesses;
  final LatLng center;

  @override
  Widget build(BuildContext context) {
    final effectiveCenter = businesses.isEmpty
        ? center
        : LatLng(businesses.first.latitude, businesses.first.longitude);
    return FlutterMap(
      options: MapOptions(
        initialCenter: effectiveCenter,
        initialZoom: 11.8,
        maxZoom: 18,
      ),
      children: [
        TileLayer(
          urlTemplate: AppConfig.mapTileUrl,
          userAgentPackageName: 'in.bnc.bnc_mobile',
        ),
        MarkerLayer(
          markers: businesses
              .map(
                (business) => Marker(
                  point: LatLng(business.latitude, business.longitude),
                  width: 54,
                  height: 54,
                  child: Tooltip(
                    message: business.name,
                    child: Container(
                      decoration: BoxDecoration(
                        color: business.sponsored
                            ? BncColors.offer
                            : BncColors.brand,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 3),
                        boxShadow: const [
                          BoxShadow(
                            color: Colors.black26,
                            blurRadius: 9,
                            offset: Offset(0, 4),
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.storefront_rounded,
                        color: Colors.white,
                        size: 23,
                      ),
                    ),
                  ),
                ),
              )
              .toList(),
        ),
        RichAttributionWidget(
          attributions: const [
            TextSourceAttribution('OpenStreetMap contributors'),
          ],
        ),
      ],
    );
  }
}
