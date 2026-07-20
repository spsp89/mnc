class CatalogData {
  const CatalogData({
    required this.categories,
    required this.featured,
    required this.popular,
    required this.all,
    required this.stats,
    this.filters = const CatalogFilters(),
  });

  final List<CategoryItem> categories;
  final List<BusinessItem> featured;
  final List<BusinessItem> popular;
  final List<BusinessItem> all;
  final CatalogStats stats;
  final CatalogFilters filters;

  String get locationLabel {
    final firstBusiness = featured.isNotEmpty
        ? featured.first
        : (popular.isNotEmpty
              ? popular.first
              : (all.isNotEmpty ? all.first : null));

    if (firstBusiness == null) {
      return 'Kozhikode, Kerala';
    }

    return '${firstBusiness.city}, Kerala';
  }

  factory CatalogData.fromJson(Map<String, dynamic> json) {
    return CatalogData(
      categories: _asList(json['categories'])
          .map((item) => CategoryItem.fromJson(_asMap(item)))
          .toList(),
      featured: _asList(json['featured'])
          .map((item) => BusinessItem.fromJson(_asMap(item)))
          .toList(),
      popular: _asList(json['popular'])
          .map((item) => BusinessItem.fromJson(_asMap(item)))
          .toList(),
      all: _asList(json['all'])
          .map((item) => BusinessItem.fromJson(_asMap(item)))
          .toList(),
      stats: CatalogStats.fromJson(_asMap(json['stats'])),
      filters: CatalogFilters.fromJson(_asMap(json['filters'])),
    );
  }
}

class CategoryItem {
  const CategoryItem({
    required this.id,
    required this.name,
    required this.slug,
    required this.icon,
    required this.accentColor,
    required this.isActive,
    this.sortOrder = 0,
  });

  final String id;
  final String name;
  final String slug;
  final String icon;
  final String accentColor;
  final bool isActive;
  final int sortOrder;

  String get accent => accentColor;

  factory CategoryItem.fromJson(Map<String, dynamic> json) {
    return CategoryItem(
      id: _asString(json['id']),
      name: _asString(json['name']),
      slug: _asString(json['slug']),
      icon: _asString(json['icon']),
      accentColor: _asString(json['accentColor'] ?? json['accent']),
      isActive: _asBool(json['isActive']),
      sortOrder: _asInt(json['sortOrder']),
    );
  }
}

class BusinessItem {
  const BusinessItem({
    required this.id,
    required this.name,
    required this.subtitle,
    required this.area,
    required this.city,
    required this.rating,
    required this.reviewCount,
    required this.distanceKm,
    required this.coverVariant,
    required this.imageUrl,
    required this.categoryName,
    required this.isFeatured,
    required this.isPopular,
    this.slug = '',
    this.categoryId = '',
    this.categorySlug = '',
    this.logoUrl,
    this.thumbnailUrl,
    this.isFavorite = false,
    this.contact = const BusinessContact(),
    this.address,
    this.images = const [],
    this.tags = const [],
    this.searchText = '',
    this.badgeText,
    this.badgeColor,
  });

  final String id;
  final String slug;
  final String name;
  final String subtitle;
  final String area;
  final String city;
  final double rating;
  final int reviewCount;
  final double distanceKm;
  final String coverVariant;
  final String imageUrl;
  final String categoryId;
  final String categoryName;
  final String categorySlug;
  final String? logoUrl;
  final String? thumbnailUrl;
  final bool isFeatured;
  final bool isPopular;
  final bool isFavorite;
  final BusinessContact contact;
  final BusinessAddress? address;
  final List<BusinessImage> images;
  final List<String> tags;
  final String searchText;
  final String? badgeText;
  final String? badgeColor;

  String get shortDescription => subtitle;

  BusinessAddress get location {
    return address ??
        BusinessAddress(
          area: area,
          city: city,
          region: 'Kerala',
          country: 'India',
          label: '$area, $city, Kerala',
        );
  }

  String get locationLabel => location.label;

  BusinessImage get primaryImage {
    final selected = _primaryImage(images);
    if (selected != null) {
      return selected;
    }

    return BusinessImage(
      url: thumbnailUrl ?? imageUrl,
      alt: '$name cover image',
      variant: coverVariant,
      isPrimary: true,
    );
  }

  factory BusinessItem.fromJson(Map<String, dynamic> json) {
    final category = _asMap(json['category']);
    final flags = _asMap(json['flags']);
    final rating = _asMap(json['rating']);
    final badge = _asNullableMap(json['badge']);
    final addressJson = _asMap(json['address']);
    final address = BusinessAddress.fromJson(addressJson);
    final images = _asList(json['images'])
        .map((item) => BusinessImage.fromJson(_asMap(item)))
        .toList();
    final primaryImage = _primaryImage(images);

    return BusinessItem(
      id: _asString(json['id']),
      slug: _asString(json['slug']),
      name: _asString(json['name']),
      subtitle: _asString(json['shortDescription'] ?? json['subtitle']),
      area: address.area.isNotEmpty ? address.area : _asString(json['area']),
      city: address.city.isNotEmpty ? address.city : _asString(json['city']),
      rating: _asDouble(rating['average'] ?? json['rating']),
      reviewCount: _asInt(rating['count'] ?? json['reviewCount']),
      distanceKm: _asDouble(json['distanceKm']),
      coverVariant: _asString(primaryImage?.variant ?? json['coverVariant']),
      imageUrl: _asString(primaryImage?.url ?? json['imageUrl']),
      categoryId: _asString(category['id'] ?? json['categoryId']),
      categoryName: _asString(category['name'] ?? json['categoryName']),
      categorySlug: _asString(category['slug'] ?? json['categorySlug']),
      logoUrl: _asNullableString(json['logoUrl']),
      thumbnailUrl: _asNullableString(json['thumbnailUrl']),
      isFeatured: _asBool(flags['featured'] ?? json['isFeatured']),
      isPopular: _asBool(flags['popular'] ?? json['isPopular']),
      isFavorite: _asBool(flags['favorite'] ?? json['isFavorite']),
      contact: BusinessContact.fromJson(_asMap(json['contact'])),
      address: addressJson.isEmpty ? null : address,
      images: images,
      tags: _asList(json['tags']).map((item) => _asString(item)).toList(),
      searchText: _asString(json['searchText']),
      badgeText: _asNullableString(badge?['text'] ?? json['badgeText']),
      badgeColor: _asNullableString(badge?['color'] ?? json['badgeColor']),
    );
  }
}

class BusinessContact {
  const BusinessContact({
    this.phone,
    this.whatsapp,
    this.email,
    this.website,
  });

  final String? phone;
  final String? whatsapp;
  final String? email;
  final String? website;

  factory BusinessContact.fromJson(Map<String, dynamic> json) {
    return BusinessContact(
      phone: _asNullableString(json['phone']),
      whatsapp: _asNullableString(json['whatsapp']),
      email: _asNullableString(json['email']),
      website: _asNullableString(json['website']),
    );
  }
}

class BusinessAddress {
  const BusinessAddress({
    required this.area,
    required this.city,
    required this.region,
    required this.country,
    required this.label,
    this.latitude,
    this.longitude,
  });

  final String area;
  final String city;
  final String region;
  final String country;
  final String label;
  final double? latitude;
  final double? longitude;

  factory BusinessAddress.fromJson(Map<String, dynamic> json) {
    final area = _asString(json['area']);
    final city = _asString(json['city']);
    final region = _asString(json['region']);

    return BusinessAddress(
      area: area,
      city: city,
      region: region,
      country: _asString(json['country']),
      label: _asString(json['label']).isNotEmpty
          ? _asString(json['label'])
          : [area, city, region].where((item) => item.isNotEmpty).join(', '),
      latitude: _asNullableDouble(json['latitude']),
      longitude: _asNullableDouble(json['longitude']),
    );
  }
}

class BusinessImage {
  const BusinessImage({
    required this.url,
    required this.alt,
    required this.variant,
    required this.isPrimary,
  });

  final String url;
  final String alt;
  final String variant;
  final bool isPrimary;

  factory BusinessImage.fromJson(Map<String, dynamic> json) {
    return BusinessImage(
      url: _asString(json['url']),
      alt: _asString(json['alt']),
      variant: _asString(json['variant']),
      isPrimary: _asBool(json['isPrimary']),
    );
  }
}

class CatalogFilters {
  const CatalogFilters({
    this.query = '',
    this.categorySlug = '',
    this.featured = false,
    this.popular = false,
    this.tags = const [],
    this.sort = 'default',
    this.limit,
  });

  final String query;
  final String categorySlug;
  final bool featured;
  final bool popular;
  final List<String> tags;
  final String sort;
  final int? limit;

  factory CatalogFilters.fromJson(Map<String, dynamic> json) {
    final sort = _asString(json['sort']);

    return CatalogFilters(
      query: _asString(json['query']),
      categorySlug: _asString(json['categorySlug'] ?? json['category']),
      featured: _asBool(json['featured']),
      popular: _asBool(json['popular']),
      tags: _asList(json['tags']).map((item) => _asString(item)).toList(),
      sort: sort.isEmpty ? 'default' : sort,
      limit: json['limit'] == null ? null : _asInt(json['limit']),
    );
  }
}

class CatalogStats {
  const CatalogStats({
    required this.categories,
    required this.businesses,
    required this.trusted,
    required this.happyUsers,
  });

  final int categories;
  final int businesses;
  final int trusted;
  final String happyUsers;

  factory CatalogStats.fromJson(Map<String, dynamic> json) {
    return CatalogStats(
      categories: _asInt(json['categories']),
      businesses: _asInt(json['businesses']),
      trusted: _asInt(json['trusted']),
      happyUsers: _asString(json['happyUsers']),
    );
  }
}

List<dynamic> _asList(Object? value) => value is List ? value : const [];

Map<String, dynamic> _asMap(Object? value) {
  return value is Map<String, dynamic> ? value : const {};
}

Map<String, dynamic>? _asNullableMap(Object? value) {
  return value is Map<String, dynamic> ? value : null;
}

String _asString(Object? value) => value?.toString() ?? '';

String? _asNullableString(Object? value) {
  if (value == null) {
    return null;
  }

  final normalized = value.toString().trim();
  return normalized.isEmpty ? null : normalized;
}

int _asInt(Object? value) {
  if (value is int) {
    return value;
  }

  if (value is num) {
    return value.toInt();
  }

  return int.tryParse(value?.toString() ?? '') ?? 0;
}

double _asDouble(Object? value) {
  if (value is double) {
    return value;
  }

  if (value is num) {
    return value.toDouble();
  }

  return double.tryParse(value?.toString() ?? '') ?? 0;
}

double? _asNullableDouble(Object? value) {
  if (value == null) {
    return null;
  }

  return _asDouble(value);
}

bool _asBool(Object? value) {
  if (value is bool) {
    return value;
  }

  if (value is num) {
    return value != 0;
  }

  final normalized = value?.toString().toLowerCase();
  return normalized == 'true' || normalized == '1';
}

BusinessImage? _primaryImage(List<BusinessImage> images) {
  for (final image in images) {
    if (image.isPrimary) {
      return image;
    }
  }

  return images.isNotEmpty ? images.first : null;
}
