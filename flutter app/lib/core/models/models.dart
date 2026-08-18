import 'package:collection/collection.dart';

typedef Json = Map<String, dynamic>;

const _bncPlanNamesByStarLevel = <int, String>{
  1: 'Bronze',
  2: 'Silver',
  3: 'Gold',
  4: 'Platinum',
  5: 'Diamond',
  6: 'Ruby',
};

String bncMembershipLabel(int starLevel, [String? planName]) {
  final count = starLevel.clamp(0, 6).toInt();
  final resolvedPlan = planName?.trim().isNotEmpty == true
      ? planName!.trim()
      : _bncPlanNamesByStarLevel[count] ?? '';
  final stars = List.filled(count, '⭐').join();
  return [
    if (stars.isNotEmpty) 'BNC $stars',
    if (resolvedPlan.isNotEmpty) resolvedPlan,
  ].join(' · ');
}

const _categoryImages = <String, String>{
  'grocery':
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=82',
  'restaurants':
      'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=82',
  'hotels-stays':
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=82',
  'bakery-sweets':
      'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=900&q=82',
  'home-services':
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=82',
  'doctors-clinics':
      'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=900&q=82',
  'event-services':
      'https://images.unsplash.com/photo-1507501336603-6e31db2be093?auto=format&fit=crop&w=900&q=82',
  'electronics':
      'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=900&q=82',
  'beauty-wellness':
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=82',
  'automobile':
      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=900&q=82',
  'education':
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=82',
  'fashion':
      'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=82',
  'real-estate':
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=82',
  'sports-fitness':
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=82',
  'professional-services':
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=82',
  'insurance':
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=82',
};

String categoryImageUrl(String slug) {
  final direct = _categoryImages[slug];
  if (direct != null) return direct;
  for (final entry in _categoryImages.entries) {
    if (slug.startsWith('${entry.key}-')) return entry.value;
  }
  return 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=82';
}

extension JsonValue on Json {
  String string(String key, [String fallback = '']) =>
      this[key]?.toString() ?? fallback;

  String? nullableString(String key) {
    final value = this[key];
    return value?.toString();
  }

  int integer(String key, [int fallback = 0]) {
    final value = this[key];
    return switch (value) {
      int() => value,
      num() => value.toInt(),
      String() => int.tryParse(value) ?? fallback,
      _ => fallback,
    };
  }

  double decimal(String key, [double fallback = 0]) {
    final value = this[key];
    return switch (value) {
      num() => value.toDouble(),
      String() => double.tryParse(value) ?? fallback,
      _ => fallback,
    };
  }

  bool boolean(String key, [bool fallback = false]) {
    final value = this[key];
    return switch (value) {
      bool() => value,
      num() => value != 0,
      String() => value.toLowerCase() == 'true',
      _ => fallback,
    };
  }

  List<Json> jsonList(String key) => (this[key] as List<dynamic>? ?? const [])
      .whereType<Map<dynamic, dynamic>>()
      .map((item) => item.map((key, value) => MapEntry('$key', value)))
      .toList();

  List<String> stringList(String key) =>
      (this[key] as List<dynamic>? ?? const []).map((item) => '$item').toList();
}

Json _jsonMap(Object? value) => value is Map
    ? value.map((key, item) => MapEntry('$key', item))
    : <String, dynamic>{};

String _normalizedDeliveryMode(Object? value) => value == null
    ? ''
    : value.toString().trim().toLowerCase().replaceAll(RegExp(r'[\s-]+'), '_');

List<String> _deliveryModes(Object? value) {
  final values = value is List ? value : [value];
  final modes = <String>{};
  for (final entry in values) {
    if (entry is String) {
      final mode = _normalizedDeliveryMode(entry);
      if (mode.isNotEmpty) modes.add(mode);
      continue;
    }
    final option = _jsonMap(entry);
    for (final key in const ['type', 'mode', 'value', 'method']) {
      final mode = _normalizedDeliveryMode(option[key]);
      if (mode.isNotEmpty) modes.add(mode);
    }
    if (option.boolean('homeDelivery')) modes.add('home_delivery');
    if (option.boolean('localDelivery')) modes.add('local_delivery');
    if (option.boolean('courier')) modes.add('courier');
  }
  return modes.toList(growable: false);
}

class Category {
  const Category({
    required this.id,
    required this.name,
    required this.nameMl,
    required this.slug,
    required this.description,
    required this.icon,
    this.children = const [],
    this.businessCount = 0,
    this.productCount = 0,
    this.serviceCount = 0,
  });

  factory Category.fromJson(Json json) {
    final counts = _jsonMap(json['_count']);
    return Category(
      id: json.string('id'),
      name: json.string('name'),
      nameMl: json.string(
        'nameMl',
        json.string('nameMalayalam', json.string('name')),
      ),
      slug: json.string('slug'),
      description: json.string('description'),
      icon: json.string('icon', 'store'),
      children: json.jsonList('children').map(Category.fromJson).toList(),
      businessCount: counts.integer('businessLinks'),
      productCount: counts.integer('products'),
      serviceCount: counts.integer('services'),
    );
  }

  final String id;
  final String name;
  final String nameMl;
  final String slug;
  final String description;
  final String icon;
  final List<Category> children;
  final int businessCount;
  final int productCount;
  final int serviceCount;
}

class Product {
  const Product({
    required this.id,
    required this.name,
    required this.category,
    required this.price,
    required this.imageUrl,
    this.businessId = '',
    this.categoryId = '',
    this.slug = '',
    this.status = 'PUBLISHED',
    this.description = '',
    this.discountPrice,
    this.inStock = true,
    this.stockStatus = 'IN_STOCK',
    this.businessName = '',
    this.businessSlug = '',
    this.businessPhone = '',
    this.businessLocality = '',
    this.businessCity = '',
    this.distanceKm,
    this.sponsored = false,
    this.courierAvailable = false,
    this.unitsSold = 0,
    this.bncStarLevel = 0,
    this.planName = '',
    this.brand = '',
    this.minimumOrderQty = 1,
    this.deliveryOptions = const [],
  });

  factory Product.fromJson(Json json) {
    final category = _jsonMap(json['category']);
    final business = _jsonMap(json['business']);
    final businessLocations = business.jsonList('locations');
    final businessLocation =
        businessLocations.firstOrNull ?? <String, dynamic>{};
    final media = json.jsonList('media');
    final firstImage = media
        .map(
          (item) => item.string(
            'publicUrl',
            item.string('url', item.string('imageUrl')),
          ),
        )
        .where((url) => url.isNotEmpty)
        .firstOrNull;
    return Product(
      id: json.string('id'),
      businessId: json.string('businessId', business.string('id')),
      categoryId: json.string('categoryId', category.string('id')),
      slug: json.string('slug'),
      status: json.string('status', 'PUBLISHED'),
      businessName: json.string('businessName', business.string('name')),
      businessSlug: json.string('businessSlug', business.string('slug')),
      businessPhone: json.string(
        'businessPhone',
        business.string('publicPhone', business.string('phone')),
      ),
      businessLocality: json.string(
        'businessLocality',
        businessLocation.string('locality'),
      ),
      businessCity: json.string(
        'businessCity',
        businessLocation.string('city'),
      ),
      distanceKm: json['distanceKm'] == null
          ? null
          : json.decimal('distanceKm'),
      sponsored: json.boolean('sponsored'),
      courierAvailable: json.boolean('courierAvailable'),
      unitsSold: json.integer('unitsSold'),
      bncStarLevel: json.integer('bncStarLevel').clamp(0, 6).toInt(),
      planName: json.string('planName'),
      name: json.string('name'),
      category: json.string(
        'categoryName',
        json['category'] is String
            ? json.string('category')
            : category.string('name'),
      ),
      description: json.string('description'),
      brand: json.string('brand'),
      price: json.decimal('price'),
      discountPrice: json['discountPrice'] == null
          ? null
          : json.decimal('discountPrice'),
      imageUrl: json.string(
        'imageUrl',
        json.string('image', json.string('primaryImageUrl', firstImage ?? '')),
      ),
      inStock: json.boolean(
        'inStock',
        json.string('stockStatus') != 'OUT_OF_STOCK',
      ),
      stockStatus: json.string('stockStatus', 'IN_STOCK'),
      minimumOrderQty: json.integer('minimumOrderQty', 1),
      deliveryOptions: _deliveryModes(json['deliveryOptions']),
    );
  }

  final String id;
  final String businessId;
  final String categoryId;
  final String slug;
  final String status;
  final String name;
  final String category;
  final String description;
  final double price;
  final double? discountPrice;
  final String imageUrl;
  final bool inStock;
  final String stockStatus;
  final String businessName;
  final String businessSlug;
  final String businessPhone;
  final String businessLocality;
  final String businessCity;
  final double? distanceKm;
  final bool sponsored;
  final bool courierAvailable;
  final int unitsSold;
  final int bncStarLevel;
  final String planName;
  final String brand;
  final int minimumOrderQty;
  final List<String> deliveryOptions;

  double get effectivePrice => discountPrice ?? price;
  bool get courierDeliveryAvailable =>
      courierAvailable || deliveryOptions.contains('courier');
  bool get homeDeliveryAvailable => deliveryOptions.any(
    const {'delivery', 'home_delivery', 'local_delivery', 'courier'}.contains,
  );
}

class Service {
  const Service({
    required this.id,
    required this.name,
    required this.startingPrice,
    required this.pricingUnit,
    this.businessId = '',
    this.description = '',
    this.duration = '',
    this.homeService = false,
    this.businessName = '',
    this.businessSlug = '',
    this.businessLocality = '',
    this.businessCity = '',
    this.distanceKm,
    this.category = '',
    this.imageUrl = '',
    this.businessRating = 0,
    this.businessReviewCount = 0,
    this.businessVerified = false,
    this.bncStarLevel = 0,
    this.planName = '',
  });

  factory Service.fromJson(Json json) {
    final category = _jsonMap(json['category']);
    final business = _jsonMap(json['business']);
    final businessLocations = business.jsonList('locations');
    final businessLocation =
        businessLocations.firstOrNull ?? <String, dynamic>{};
    final media = json.jsonList('media');
    final durationMinutes = json.integer('durationMinutes');
    final pricingType = json.string('pricingType');
    return Service(
      id: json.string('id'),
      businessId: json.string('businessId', business.string('id')),
      businessName: json.string('businessName', business.string('name')),
      businessSlug: json.string('businessSlug', business.string('slug')),
      businessLocality: json.string(
        'businessLocality',
        businessLocation.string('locality'),
      ),
      businessCity: json.string(
        'businessCity',
        businessLocation.string('city'),
      ),
      distanceKm: json['distanceKm'] == null
          ? null
          : json.decimal('distanceKm'),
      businessRating: json.decimal(
        'businessRating',
        business.decimal('averageRating', business.decimal('rating')),
      ),
      businessReviewCount: json.integer(
        'businessReviewCount',
        business.integer('reviewCount'),
      ),
      businessVerified: json.boolean(
        'businessVerified',
        business.boolean('verified'),
      ),
      bncStarLevel: json.integer('bncStarLevel').clamp(0, 6).toInt(),
      planName: json.string('planName'),
      category: json.string('categoryName', category.string('name')),
      name: json.string('name'),
      description: json.string('description'),
      startingPrice: json.decimal('startingPrice', json.decimal('price')),
      pricingUnit: json.string('pricingUnit', switch (pricingType) {
        'FIXED' => 'fixed price',
        'HOURLY' => 'per hour',
        'PER_VISIT' => 'per visit',
        'STARTING_AT' => 'onwards',
        _ => pricingType.toLowerCase().replaceAll('_', ' '),
      }),
      duration: json.string(
        'duration',
        durationMinutes > 0 ? '$durationMinutes min' : '',
      ),
      homeService: json.boolean('homeService'),
      imageUrl: json.string(
        'imageUrl',
        media.firstOrNull?.string('publicUrl') ?? '',
      ),
    );
  }

  final String id;
  final String businessId;
  final String name;
  final String description;
  final double startingPrice;
  final String pricingUnit;
  final String duration;
  final bool homeService;
  final String businessName;
  final String businessSlug;
  final String businessLocality;
  final String businessCity;
  final double? distanceKm;
  final String category;
  final String imageUrl;
  final double businessRating;
  final int businessReviewCount;
  final bool businessVerified;
  final int bncStarLevel;
  final String planName;
}

class Offer {
  const Offer({
    required this.id,
    required this.title,
    required this.description,
    required this.discount,
    required this.expiresAt,
    this.businessId = '',
    this.businessName = '',
    this.businessSlug = '',
    this.businessLocality = '',
    this.businessCity = '',
    this.code,
    this.minimumSpend,
  });

  factory Offer.fromJson(Json json) {
    final business = _jsonMap(json['business']);
    final locations = business.jsonList('locations');
    final location = locations.isEmpty ? <String, dynamic>{} : locations.first;
    final type = json.string('type');
    final value = json.decimal('discountValue');
    final valueText = value == value.roundToDouble()
        ? value.round().toString()
        : value.toStringAsFixed(2);
    return Offer(
      id: json.string('id'),
      businessId: json.string('businessId', business.string('id')),
      businessName: json.string('businessName', business.string('name')),
      businessSlug: json.string('businessSlug', business.string('slug')),
      businessLocality: json.string(
        'businessLocality',
        location.string('locality'),
      ),
      businessCity: json.string('businessCity', location.string('city')),
      title: json.string('title'),
      description: json.string('description'),
      code: json.nullableString('code') ?? json.nullableString('couponCode'),
      discount: json.string(
        'discount',
        json.string(
          'displayValue',
          json.string(
            'value',
            value <= 0
                ? ''
                : type == 'PERCENTAGE'
                ? '$valueText% off'
                : '₹$valueText off',
          ),
        ),
      ),
      expiresAt: json.string(
        'expiresAt',
        json.string('endAt', json.string('endsAt')),
      ),
      minimumSpend: json['minimumSpend'] == null
          ? null
          : json.decimal('minimumSpend'),
    );
  }

  final String id;
  final String businessId;
  final String businessName;
  final String businessSlug;
  final String businessLocality;
  final String businessCity;
  final String title;
  final String description;
  final String? code;
  final String discount;
  final String expiresAt;
  final double? minimumSpend;
}

class Review {
  const Review({
    required this.id,
    required this.author,
    required this.rating,
    required this.date,
    required this.body,
    this.verified = false,
    this.helpful = 0,
    this.ownerReply,
    this.status = '',
    this.businessName = '',
    this.businessSlug = '',
  });

  factory Review.fromJson(Json json) {
    final customer = json['customer'] is Map
        ? Map<String, dynamic>.from(json['customer'] as Map)
        : <String, dynamic>{};
    final profile = customer['customerProfile'] is Map
        ? Map<String, dynamic>.from(customer['customerProfile'] as Map)
        : <String, dynamic>{};
    final reply = json['reply'] is Map
        ? Map<String, dynamic>.from(json['reply'] as Map)
        : <String, dynamic>{};
    final business = json['business'] is Map
        ? Map<String, dynamic>.from(json['business'] as Map)
        : <String, dynamic>{};
    return Review(
      id: json.string('id'),
      author: json.string(
        'author',
        json.string(
          'authorName',
          json.string(
            'customerName',
            profile.string('displayName', 'BNC customer'),
          ),
        ),
      ),
      rating: json.decimal('rating', json.decimal('overallRating')),
      date: json.string('date', json.string('createdAt')),
      body: json.string('body', json.string('comment')),
      verified: json.boolean(
        'verified',
        json.boolean('verifiedPurchase', json.boolean('verifiedInteraction')),
      ),
      helpful: json.integer('helpful', json.integer('helpfulCount')),
      ownerReply:
          json.nullableString('ownerReply') ?? reply.nullableString('body'),
      status: json.string('status'),
      businessName: json.string('businessName', business.string('name')),
      businessSlug: json.string('businessSlug', business.string('slug')),
    );
  }

  final String id;
  final String author;
  final double rating;
  final String date;
  final String body;
  final bool verified;
  final int helpful;
  final String? ownerReply;
  final String status;
  final String businessName;
  final String businessSlug;
}

class Business {
  const Business({
    required this.id,
    required this.slug,
    required this.name,
    required this.category,
    required this.categorySlug,
    required this.shortDescription,
    required this.description,
    required this.coverImageUrl,
    required this.city,
    required this.locality,
    required this.address,
    required this.latitude,
    required this.longitude,
    required this.distanceKm,
    required this.rating,
    required this.reviewCount,
    this.gallery = const [],
    this.categoryIds = const [],
    this.verified = false,
    this.premium = false,
    this.sponsored = false,
    this.bncStarLevel = 0,
    this.planName = '',
    this.productLimit = 0,
    this.galleryLimit = 0,
    this.categoryLimit = 1,
    this.descriptionEnabled = true,
    this.socialLinksEnabled = true,
    this.bookingEnabled = false,
    this.deliveryEnabled = false,
    this.automaticLeadAlerts = false,
    this.permanentDiscountPercent = 0,
    this.permanentDiscountLabel = '',
    this.hoursKnown = false,
    this.openNow = false,
    this.closesAt = '',
    this.responseTime = '',
    this.priceRange = '₹₹',
    this.yearsInBusiness = 0,
    this.phone = '',
    this.whatsapp = '',
    this.websiteUrl = '',
    this.socialLinks = const {},
    this.paymentUpiId = '',
    this.paymentAccountName = '',
    this.languages = const [],
    this.paymentMethods = const [],
    this.amenities = const [],
    this.tags = const [],
    this.services = const [],
    this.products = const [],
    this.offer,
    this.reviews = const [],
  });

  factory Business.fromJson(Json json) {
    final locations = json.jsonList('locations');
    final location = locations.firstOrNull ?? <String, dynamic>{};
    final categories = json.jsonList('categories');
    final categoryRelation = categories.firstOrNull ?? <String, dynamic>{};
    final categoryJson = categoryRelation['category'] is Map
        ? Map<String, dynamic>.from(categoryRelation['category'] as Map)
        : categoryRelation;
    final media = json.jsonList('media');
    final gallery = json.stringList('gallery').isNotEmpty
        ? json.stringList('gallery')
        : media
              .map((item) => item.string('url', item.string('publicUrl')))
              .where((url) => url.isNotEmpty)
              .toList();
    final attributes = json['attributes'] is Map
        ? Map<String, dynamic>.from(json['attributes'] as Map)
        : <String, dynamic>{};
    final paymentProfile = _jsonMap(json['paymentProfile']);
    final offers = json.jsonList('offers');
    final offerJson = json['offer'] is Map
        ? Map<String, dynamic>.from(json['offer'] as Map)
        : offers.firstOrNull;
    final availability = _businessAvailability(json);
    final subscriptions = json.jsonList('subscriptions');
    final subscription = subscriptions.firstOrNull ?? <String, dynamic>{};
    final plan = _jsonMap(subscription['plan']);
    final entitlementSummary = _jsonMap(json['entitlements']);
    final entitlementPlan = _jsonMap(entitlementSummary['plan']);
    final effectivePlan = entitlementPlan.isNotEmpty ? entitlementPlan : plan;
    final rawPriceRange = json['priceRange'];
    final priceRange = rawPriceRange is String && rawPriceRange.contains('₹')
        ? rawPriceRange
        : '₹' * json.integer('priceRange', 2);

    return Business(
      id: json.string('id'),
      slug: json.string('slug'),
      name: json.string('name'),
      category: json.string(
        'category',
        json.string('categoryName', categoryJson.string('name')),
      ),
      categorySlug: json.string('categorySlug', categoryJson.string('slug')),
      shortDescription: json.string(
        'shortDescription',
        json.string('description'),
      ),
      description: json.string('description'),
      coverImageUrl: json.string(
        'coverImageUrl',
        json.string('coverImage', gallery.firstOrNull ?? ''),
      ),
      gallery: gallery,
      categoryIds: categories
          .map((relation) => _jsonMap(relation['category']).string('id'))
          .where((id) => id.isNotEmpty)
          .toList(),
      city: json.string('city', location.string('city')),
      locality: json.string('locality', location.string('locality')),
      address: json.string(
        'address',
        [
          location.string('addressLine1'),
          location.string('locality'),
          location.string('city'),
        ].where((part) => part.isNotEmpty).join(', '),
      ),
      latitude: json.decimal('latitude', location.decimal('latitude')),
      longitude: json.decimal('longitude', location.decimal('longitude')),
      distanceKm: json['distanceKm'] != null
          ? json.decimal('distanceKm')
          : json['distance'] != null
          ? json.decimal('distance')
          : null,
      rating: json.decimal('rating', json.decimal('averageRating')),
      reviewCount: json.integer('reviewCount'),
      verified: json.boolean('verified'),
      premium: json.boolean('premium'),
      sponsored: json.boolean('sponsored', plan.boolean('sponsoredPlacement')),
      bncStarLevel: json.integer(
        'bncStarLevel',
        effectivePlan.integer('starLevel'),
      ),
      planName: json.string('planName', effectivePlan.string('name')),
      productLimit: effectivePlan.integer('productLimit'),
      galleryLimit: effectivePlan.integer('mediaLimit'),
      categoryLimit: effectivePlan.integer('categoryLimit', 1),
      descriptionEnabled: effectivePlan.boolean('descriptionEnabled', true),
      socialLinksEnabled: effectivePlan.boolean('socialLinksEnabled', true),
      bookingEnabled: effectivePlan.boolean('bookingEnabled'),
      deliveryEnabled: effectivePlan.boolean('deliveryEnabled'),
      automaticLeadAlerts: effectivePlan.boolean('automaticLeadAlerts'),
      permanentDiscountPercent: json.integer('permanentDiscountPercent'),
      permanentDiscountLabel: json.string('permanentDiscountLabel'),
      hoursKnown: availability.known,
      openNow: availability.open,
      closesAt: json.string('closesAt', availability.closesAt),
      responseTime: json.string(
        'responseTime',
        json.integer('medianResponseMinutes') > 0
            ? 'Usually replies in ${json.integer('medianResponseMinutes')} min'
            : '',
      ),
      priceRange: priceRange,
      yearsInBusiness: json.integer('yearsInBusiness'),
      phone: json.string('phone', json.string('publicPhone')),
      whatsapp: json.string('whatsapp'),
      websiteUrl: json.string('websiteUrl'),
      socialLinks: Map.fromEntries(
        _jsonMap(json['socialLinks']).entries
            .where(
              (entry) =>
                  entry.value is String &&
                  (entry.value as String).trim().isNotEmpty,
            )
            .map(
              (entry) => MapEntry(entry.key, (entry.value as String).trim()),
            ),
      ),
      paymentUpiId: paymentProfile.string('upiId', attributes.string('upiId')),
      paymentAccountName: paymentProfile.string(
        'accountName',
        attributes.string('paymentAccountName'),
      ),
      languages: json.stringList('languages').isNotEmpty
          ? json.stringList('languages')
          : (attributes['languages'] as List<dynamic>? ?? const [])
                .map((item) => '$item')
                .toList(),
      paymentMethods: json.stringList('paymentMethods').isNotEmpty
          ? json.stringList('paymentMethods')
          : (attributes['paymentMethods'] as List<dynamic>? ?? const [])
                .map((item) => '$item')
                .toList(),
      amenities: json.stringList('amenities').isNotEmpty
          ? json.stringList('amenities')
          : (attributes['amenities'] as List<dynamic>? ?? const [])
                .map((item) => '$item')
                .toList(),
      tags: json.stringList('tags'),
      services: json.jsonList('services').map(Service.fromJson).toList(),
      products: json.jsonList('products').map(Product.fromJson).toList(),
      offer: offerJson == null ? null : Offer.fromJson(offerJson),
      reviews: json.jsonList('reviews').map(Review.fromJson).toList(),
    );
  }

  final String id;
  final String slug;
  final String name;
  final String category;
  final String categorySlug;
  final String shortDescription;
  final String description;
  final String coverImageUrl;
  final List<String> gallery;
  final List<String> categoryIds;
  final String city;
  final String locality;
  final String address;
  final double latitude;
  final double longitude;
  final double? distanceKm;
  final double rating;
  final int reviewCount;
  final bool verified;
  final bool premium;
  final bool sponsored;
  final int bncStarLevel;
  final String planName;
  final int productLimit;
  final int galleryLimit;
  final int categoryLimit;
  final bool descriptionEnabled;
  final bool socialLinksEnabled;
  final bool bookingEnabled;
  final bool deliveryEnabled;
  final bool automaticLeadAlerts;
  final int permanentDiscountPercent;
  final String permanentDiscountLabel;
  final bool hoursKnown;
  final bool openNow;
  final String closesAt;
  final String responseTime;
  final String priceRange;
  final int yearsInBusiness;
  final String phone;
  final String whatsapp;
  final String websiteUrl;
  final Map<String, String> socialLinks;
  final String paymentUpiId;
  final String paymentAccountName;
  final List<String> languages;
  final List<String> paymentMethods;
  final List<String> amenities;
  final List<String> tags;
  final List<Service> services;
  final List<Product> products;
  final Offer? offer;
  final List<Review> reviews;

  String get availabilityLabel {
    if (!hoursKnown) return 'Hours not listed';
    return openNow ? 'Open now' : 'Closed now';
  }

  String get availabilityDetail {
    if (!hoursKnown) return 'Contact before visiting';
    if (openNow && closesAt.isNotEmpty) return 'Closes at $closesAt';
    return openNow ? 'Open today' : 'Hours may vary—contact before visiting';
  }
}

({bool known, bool open, String closesAt}) _businessAvailability(Json json) {
  final explicitStatus = json.string('status').trim().toLowerCase();
  if (json.containsKey('openNow') ||
      explicitStatus == 'open' ||
      explicitStatus == 'closed') {
    return (
      known: true,
      open: json.boolean('openNow', explicitStatus == 'open'),
      closesAt: json.string('closesAt'),
    );
  }

  final hours = json.jsonList('workingHours');
  if (hours.isEmpty) return (known: false, open: false, closesAt: '');

  // Kerala does not observe daylight-saving time, so a fixed UTC offset is
  // sufficient for evaluating the server's local HH:mm schedule.
  final now = DateTime.now().toUtc().add(const Duration(hours: 5, minutes: 30));
  final currentDay = now.weekday % 7; // API: Sunday=0 … Saturday=6.
  final currentMinutes = now.hour * 60 + now.minute;

  for (final entry in hours) {
    if (entry.boolean('closed')) continue;
    final opensAt = entry.string('opensAt');
    final closesAt = entry.string('closesAt');
    final opens = _clockMinutes(opensAt);
    final closes = _clockMinutes(closesAt);
    if (opens == null || closes == null) continue;
    final day = entry.integer('dayOfWeek', -1);
    final open = closes > opens
        ? day == currentDay &&
              currentMinutes >= opens &&
              currentMinutes <= closes
        : (day == currentDay && currentMinutes >= opens) ||
              ((day + 1) % 7 == currentDay && currentMinutes <= closes);
    if (open) {
      return (known: true, open: true, closesAt: _formatClock(closesAt));
    }
  }
  return (known: true, open: false, closesAt: '');
}

int? _clockMinutes(String value) {
  final parts = value.split(':');
  if (parts.length < 2) return null;
  final hour = int.tryParse(parts[0]);
  final minute = int.tryParse(parts[1]);
  if (hour == null ||
      minute == null ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59) {
    return null;
  }
  return hour * 60 + minute;
}

String _formatClock(String value) {
  final minutes = _clockMinutes(value);
  if (minutes == null) return value;
  final hour = minutes ~/ 60;
  final minute = minutes % 60;
  final suffix = hour >= 12 ? 'PM' : 'AM';
  final displayHour = hour % 12 == 0 ? 12 : hour % 12;
  return '$displayHour:${minute.toString().padLeft(2, '0')} $suffix';
}

class UserProfile {
  const UserProfile({
    required this.id,
    required this.phone,
    required this.displayName,
    required this.role,
    this.email = '',
    this.preferredLanguage = 'en',
  });

  factory UserProfile.fromJson(Json json) {
    final customer = json['customerProfile'] is Map
        ? Map<String, dynamic>.from(json['customerProfile'] as Map)
        : <String, dynamic>{};
    return UserProfile(
      id: json.string('id'),
      phone: json.string('phone'),
      email: json.string('email'),
      displayName: json.string(
        'displayName',
        customer.string('displayName', 'BNC customer'),
      ),
      role: json.string('role', 'CUSTOMER'),
      preferredLanguage: json.string('preferredLanguage', 'en'),
    );
  }

  final String id;
  final String phone;
  final String email;
  final String displayName;
  final String role;
  final String preferredLanguage;

  bool get isBusinessOwner => role == 'BUSINESS_OWNER';

  bool get isAdministrator => const {
    'SUPER_ADMIN',
    'STATE_ADMIN',
    'DISTRICT_ADMIN',
    'AREA_MANAGER',
    'VERIFICATION',
    'MODERATOR',
    'SUPPORT',
    'SALES',
    'FINANCE',
  }.contains(role);
}

class Enquiry {
  const Enquiry({
    required this.id,
    required this.requirement,
    required this.locality,
    required this.status,
    required this.createdAt,
    this.businessId = '',
    this.businessName = '',
    this.matches = 0,
  });

  factory Enquiry.fromJson(Json json) {
    final location = _jsonMap(json['location']);
    final business = _jsonMap(json['business']);
    final lead = _jsonMap(json['lead']);
    final assignments = lead.jsonList('assignments');
    final firstAssignedBusiness = assignments.firstOrNull == null
        ? <String, dynamic>{}
        : _jsonMap(assignments.first['business']);
    return Enquiry(
      id: json.string('id'),
      requirement: json.string('requirement'),
      locality: json.string('locality', location.string('locality')),
      status: json.string('status', 'SUBMITTED'),
      createdAt: json.string('createdAt'),
      businessId: json.string('businessId', business.string('id')),
      businessName: json.string(
        'businessName',
        business.string('name', firstAssignedBusiness.string('name')),
      ),
      matches: json.integer(
        'matches',
        json.integer('matchCount', assignments.length),
      ),
    );
  }

  final String id;
  final String requirement;
  final String locality;
  final String status;
  final String createdAt;
  final String businessId;
  final String businessName;
  final int matches;
}

class Conversation {
  const Conversation({
    required this.id,
    required this.title,
    required this.lastMessage,
    required this.updatedAt,
    this.unread = 0,
    this.avatarUrl = '',
    this.businessId = '',
    this.status = 'OPEN',
  });

  factory Conversation.fromJson(Json json) {
    final business = json['business'] is Map
        ? Map<String, dynamic>.from(json['business'] as Map)
        : <String, dynamic>{};
    final messages = json.jsonList('messages');
    return Conversation(
      id: json.string('id'),
      title: json.string(
        'title',
        json.string(
          'businessName',
          business.string('name', json.string('customerName', 'Conversation')),
        ),
      ),
      lastMessage: json.string(
        'lastMessage',
        json.string(
          'preview',
          messages.firstOrNull?.string('body', 'No messages yet') ??
              'No messages yet',
        ),
      ),
      updatedAt: json.string('updatedAt'),
      unread: json.integer('unread', json.integer('unreadCount')),
      avatarUrl: json.string('avatarUrl', business.string('logoUrl')),
      businessId: json.string('businessId', business.string('id')),
      status: json.string('status', 'OPEN'),
    );
  }

  final String id;
  final String title;
  final String lastMessage;
  final String updatedAt;
  final int unread;
  final String avatarUrl;
  final String businessId;
  final String status;
}

class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.body,
    required this.sentAt,
    required this.mine,
    this.type = 'TEXT',
  });

  factory ChatMessage.fromJson(Json json, {String currentUserId = ''}) =>
      ChatMessage(
        id: json.string('id'),
        body: json.string('body', json.string('caption')),
        sentAt: json.string('sentAt', json.string('createdAt')),
        mine: json.boolean('mine') || json.string('senderId') == currentUserId,
        type: json.string('type', 'TEXT'),
      );

  final String id;
  final String body;
  final String sentAt;
  final bool mine;
  final String type;
}

class AppNotification {
  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.createdAt,
    this.read = false,
    this.data = const {},
  });

  factory AppNotification.fromJson(Json json) => AppNotification(
    id: json.string('id'),
    title: json.string('title'),
    body: json.string('body', json.string('message')),
    type: json.string('type'),
    createdAt: json.string('createdAt'),
    read: json.boolean('read', json['readAt'] != null),
    data: _jsonMap(json['data']),
  );

  final String id;
  final String title;
  final String body;
  final String type;
  final String createdAt;
  final bool read;
  final Json data;

  bool get customerVisible => !const {
    'NEW_LEAD',
    'NEW_ENQUIRY',
    'REVIEW_RECEIVED',
    'SUBSCRIPTION_RENEWAL',
    'OFFER_EXPIRY',
    'VERIFICATION_UPDATE',
  }.contains(type);

  String? get destination {
    final orderId = data.string('orderId');
    if (orderId.isNotEmpty) return '/orders/$orderId';
    final conversationId = data.string('conversationId');
    if (conversationId.isNotEmpty) return '/messages/$conversationId';
    final bookingId = data.string('bookingId');
    if (bookingId.isNotEmpty) return '/bookings';
    final offerId = data.string('offerId');
    if (offerId.isNotEmpty) return '/offers';
    final businessSlug = data.string('businessSlug');
    if (businessSlug.isNotEmpty) return '/business/$businessSlug';
    if (type == 'REVIEW_REPLY') return '/account/reviews';
    if (type == 'WEEKLY_DRAW') return '/weekly-draw';
    if (type == 'SUPPORT_UPDATE') return '/contact';
    return null;
  }
}

class OrderLine {
  const OrderLine({
    required this.id,
    required this.name,
    required this.quantity,
    required this.unitPrice,
    this.imageUrl = '',
  });

  factory OrderLine.fromJson(Json json) => OrderLine(
    id: json.string('id', json.string('productId')),
    name: json.string(
      'name',
      json.string('productName', json.string('nameSnapshot')),
    ),
    quantity: json.integer('quantity', 1),
    unitPrice: json.decimal('unitPrice', json.decimal('price')),
    imageUrl: json.string('imageUrl'),
  );

  final String id;
  final String name;
  final int quantity;
  final double unitPrice;
  final String imageUrl;
}

class Order {
  const Order({
    required this.id,
    required this.status,
    required this.total,
    required this.createdAt,
    required this.lines,
    this.businessName = '',
    this.businessSlug = '',
    this.paymentStatus = '',
    this.orderNumber = '',
    this.subtotal = 0,
    this.discount = 0,
    this.deliveryFee = 0,
    this.fulfilmentType = '',
    this.deliveryAddress = const {},
  });

  factory Order.fromJson(Json json) {
    final business = _jsonMap(json['business']);
    final payments = json.jsonList('payments');
    final captured = payments.firstWhereOrNull(
      (payment) => payment.string('status') == 'CAPTURED',
    );
    final effectivePayment = captured ?? payments.firstOrNull;
    return Order(
      id: json.string('id'),
      orderNumber: json.string('orderNumber', json.string('id')),
      status: json.string('status', 'PENDING'),
      total: json.decimal('total', json.decimal('grandTotal')),
      subtotal: json.decimal('subtotal'),
      discount: json.decimal('discount'),
      deliveryFee: json.decimal('deliveryFee'),
      fulfilmentType: json.string('fulfilmentType'),
      deliveryAddress: _jsonMap(json['deliveryAddress']),
      createdAt: json.string('createdAt'),
      lines: json.jsonList('items').map(OrderLine.fromJson).toList(),
      businessName: json.string('businessName', business.string('name')),
      businessSlug: json.string('businessSlug', business.string('slug')),
      paymentStatus: json.string(
        'paymentStatus',
        effectivePayment?.string('status') ?? '',
      ),
    );
  }

  final String id;
  final String status;
  final double total;
  final String createdAt;
  final List<OrderLine> lines;
  final String businessName;
  final String businessSlug;
  final String paymentStatus;
  final String orderNumber;
  final double subtotal;
  final double discount;
  final double deliveryFee;
  final String fulfilmentType;
  final Json deliveryAddress;
}

class Lead {
  const Lead({
    required this.id,
    required this.assignmentId,
    required this.requirement,
    required this.locality,
    required this.status,
    required this.createdAt,
    this.category = '',
    this.contactName,
    this.contactPhone,
  });

  factory Lead.fromJson(Json json) => Lead(
    id: json.string('id'),
    assignmentId: json.string('assignmentId', json.string('id')),
    requirement: json.string('requirement'),
    locality: json.string('locality'),
    status: json.string('status', json.string('assignmentStatus', 'DELIVERED')),
    createdAt: json.string('createdAt'),
    category: json.string('category'),
    contactName: json.nullableString('customerName'),
    contactPhone: json.nullableString('phone'),
  );

  final String id;
  final String assignmentId;
  final String requirement;
  final String locality;
  final String status;
  final String createdAt;
  final String category;
  final String? contactName;
  final String? contactPhone;

  bool get contactRevealed =>
      contactName?.isNotEmpty == true && contactPhone?.isNotEmpty == true;
}

class SubscriptionPlan {
  const SubscriptionPlan({
    required this.id,
    required this.name,
    required this.price,
    required this.interval,
    this.slug = '',
    this.starLevel = 0,
    this.productLimit = 0,
    this.galleryLimit = 0,
    this.categoryLimit = 1,
    this.features = const [],
    this.recommended = false,
  });

  factory SubscriptionPlan.fromJson(Json json) => SubscriptionPlan(
    id: json.string('id'),
    name: json.string('name'),
    slug: json.string('slug'),
    price: json.decimal('monthlyPrice', json.decimal('price')),
    interval: 'month',
    starLevel: json.integer('starLevel'),
    productLimit: json.integer('productLimit'),
    galleryLimit: json.integer('mediaLimit'),
    categoryLimit: json.integer('categoryLimit', 1),
    features: json.stringList('features'),
    recommended: json.boolean('recommended', json.string('slug') == 'diamond'),
  );

  final String id;
  final String name;
  final String slug;
  final double price;
  final String interval;
  final int starLevel;
  final int productLimit;
  final int galleryLimit;
  final int categoryLimit;
  final List<String> features;
  final bool recommended;
}

class PageResult<T> {
  const PageResult({
    required this.items,
    this.page = 1,
    this.pageSize = 20,
    this.total = 0,
    this.requestId,
  });

  final List<T> items;
  final int page;
  final int pageSize;
  final int total;
  final String? requestId;

  bool get hasMore => page * pageSize < total;
}

class SearchFilters {
  const SearchFilters({
    this.query = '',
    this.location = 'Kochi',
    this.constituency = '',
    this.district = '',
    this.state = '',
    this.latitude,
    this.longitude,
    this.radiusKm = 5,
    this.rating = 0,
    this.openNow = false,
    this.verified = false,
    this.premium = false,
    this.offers = false,
    this.homeService = false,
    this.delivery = false,
    this.fastResponse = false,
    this.priceRange = 0,
    this.payment = '',
    this.language = '',
    this.minYears = 0,
    this.sort = 'relevance',
  });

  final String query;
  final String location;
  final String constituency;
  final String district;
  final String state;
  final double? latitude;
  final double? longitude;
  final int radiusKm;
  final double rating;
  final bool openNow;
  final bool verified;
  final bool premium;
  final bool offers;
  final bool homeService;
  final bool delivery;
  final bool fastResponse;
  final int priceRange;
  final String payment;
  final String language;
  final int minYears;
  final String sort;

  SearchFilters copyWith({
    String? query,
    String? location,
    String? constituency,
    String? district,
    String? state,
    double? latitude,
    double? longitude,
    int? radiusKm,
    double? rating,
    bool? openNow,
    bool? verified,
    bool? premium,
    bool? offers,
    bool? homeService,
    bool? delivery,
    bool? fastResponse,
    int? priceRange,
    String? payment,
    String? language,
    int? minYears,
    String? sort,
  }) => SearchFilters(
    query: query ?? this.query,
    location: location ?? this.location,
    constituency: constituency ?? this.constituency,
    district: district ?? this.district,
    state: state ?? this.state,
    latitude: latitude ?? this.latitude,
    longitude: longitude ?? this.longitude,
    radiusKm: radiusKm ?? this.radiusKm,
    rating: rating ?? this.rating,
    openNow: openNow ?? this.openNow,
    verified: verified ?? this.verified,
    premium: premium ?? this.premium,
    offers: offers ?? this.offers,
    homeService: homeService ?? this.homeService,
    delivery: delivery ?? this.delivery,
    fastResponse: fastResponse ?? this.fastResponse,
    priceRange: priceRange ?? this.priceRange,
    payment: payment ?? this.payment,
    language: language ?? this.language,
    minYears: minYears ?? this.minYears,
    sort: sort ?? this.sort,
  );

  Map<String, dynamic> toQuery({int page = 1, int pageSize = 20}) => {
    if (query.trim().isNotEmpty) 'query': query.trim(),
    if (location.trim().isNotEmpty) 'location': location.trim(),
    if (constituency.trim().isNotEmpty) 'constituency': constituency.trim(),
    if (district.trim().isNotEmpty) 'district': district.trim(),
    if (state.trim().isNotEmpty) 'state': state.trim(),
    if (latitude != null) 'latitude': latitude,
    if (longitude != null) 'longitude': longitude,
    'radiusKm': radiusKm,
    if (rating > 0) 'rating': rating,
    if (openNow) 'openNow': true,
    if (verified) 'verified': true,
    if (premium) 'premium': true,
    if (offers) 'offers': true,
    if (homeService) 'homeService': true,
    if (delivery) 'delivery': true,
    if (fastResponse) 'fastResponse': true,
    if (priceRange > 0) 'priceRange': priceRange,
    if (payment.trim().isNotEmpty) 'payment': payment.trim(),
    if (language.trim().isNotEmpty) 'language': language.trim(),
    if (minYears > 0) 'minYears': minYears,
    'sort': switch (sort) {
      'relevance' => 'recommended',
      'distance' => 'nearest',
      _ => sort,
    },
    'page': page,
    'pageSize': pageSize,
  };

  Json toHistoryPayload({
    required int resultCount,
    required String interfaceLanguage,
  }) => {
    'query': query.trim(),
    'language': interfaceLanguage == 'ml' ? 'ml' : 'en',
    'location': {
      'label': location.trim(),
      if (constituency.trim().isNotEmpty) 'constituency': constituency.trim(),
      if (district.trim().isNotEmpty) 'district': district.trim(),
      if (state.trim().isNotEmpty) 'state': state.trim(),
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
    },
    'filters': {
      'radiusKm': radiusKm,
      'rating': rating,
      'openNow': openNow,
      'verified': verified,
      'premium': premium,
      'offers': offers,
      'homeService': homeService,
      'delivery': delivery,
      'fastResponse': fastResponse,
      'priceRange': priceRange,
      'payment': payment,
      'language': language,
      'minYears': minYears,
      'sort': sort,
    },
    'resultCount': resultCount,
  };

  Map<String, String> toRouteQuery() => {
    if (query.trim().isNotEmpty) 'q': query.trim(),
    if (location.trim().isNotEmpty) 'location': location.trim(),
    if (constituency.trim().isNotEmpty) 'constituency': constituency.trim(),
    if (district.trim().isNotEmpty) 'district': district.trim(),
    if (state.trim().isNotEmpty) 'state': state.trim(),
    if (latitude != null) 'latitude': '$latitude',
    if (longitude != null) 'longitude': '$longitude',
    'radius': '$radiusKm',
    if (rating > 0) 'rating': '$rating',
    if (openNow) 'openNow': 'true',
    if (verified) 'verified': 'true',
    if (premium) 'premium': 'true',
    if (offers) 'offers': 'true',
    if (homeService) 'homeService': 'true',
    if (delivery) 'delivery': 'true',
    if (fastResponse) 'fastResponse': 'true',
    if (priceRange > 0) 'priceRange': '$priceRange',
    if (payment.trim().isNotEmpty) 'payment': payment.trim(),
    if (language.trim().isNotEmpty) 'language': language.trim(),
    if (minYears > 0) 'minYears': '$minYears',
    if (sort != 'relevance') 'sort': sort,
  };
}

class SearchHistoryEntry {
  const SearchHistoryEntry({
    required this.id,
    required this.query,
    required this.createdAt,
    required this.resultCount,
    required this.filters,
  });

  factory SearchHistoryEntry.fromJson(Json json) {
    final location = _jsonMap(json['location']);
    final storedFilters = _jsonMap(json['filters']);
    final latitude = location.containsKey('latitude')
        ? location.decimal('latitude')
        : null;
    final longitude = location.containsKey('longitude')
        ? location.decimal('longitude')
        : null;
    final priceRange = storedFilters.integer(
      'priceRange',
      storedFilters.string('price').length,
    );
    final sort = switch (storedFilters.string('sort')) {
      'recommended' || '' => 'relevance',
      'nearest' => 'distance',
      final value => value,
    };
    return SearchHistoryEntry(
      id: json.string('id'),
      query: json.string('query'),
      createdAt: json.string('createdAt'),
      resultCount: json.integer('resultCount'),
      filters: SearchFilters(
        query: json.string('query'),
        location: location.string('label'),
        constituency: location.string(
          'constituency',
          storedFilters.string('constituency'),
        ),
        district: location.string('district', storedFilters.string('district')),
        state: location.string('state', storedFilters.string('state')),
        latitude: latitude,
        longitude: longitude,
        radiusKm: storedFilters.integer('radiusKm', 5),
        rating: storedFilters.decimal('rating'),
        openNow: storedFilters.boolean('openNow'),
        verified: storedFilters.boolean('verified'),
        premium: storedFilters.boolean('premium'),
        offers: storedFilters.boolean('offers'),
        homeService: storedFilters.boolean('homeService'),
        delivery: storedFilters.boolean('delivery'),
        fastResponse: storedFilters.boolean('fastResponse'),
        priceRange: priceRange,
        payment: storedFilters.string('payment'),
        language: storedFilters.string('language'),
        minYears: storedFilters.integer('minYears'),
        sort: sort,
      ),
    );
  }

  final String id;
  final String query;
  final String createdAt;
  final int resultCount;
  final SearchFilters filters;

  Uri get destination =>
      Uri(path: '/search', queryParameters: filters.toRouteQuery());
}
