class CatalogData {
  const CatalogData({
    required this.categories,
    required this.featured,
    required this.popular,
    required this.stats,
  });

  final List<CategoryItem> categories;
  final List<BusinessItem> featured;
  final List<BusinessItem> popular;
  final CatalogStats stats;

  String get locationLabel {
    final firstBusiness = featured.isNotEmpty
        ? featured.first
        : (popular.isNotEmpty ? popular.first : null);

    if (firstBusiness == null) {
      return 'Kozhikode, Kerala';
    }

    return '${firstBusiness.city}, Kerala';
  }

  factory CatalogData.fromJson(Map<String, dynamic> json) {
    return CatalogData(
      categories: _asList(json['categories'])
          .map((item) => CategoryItem.fromJson(item as Map<String, dynamic>))
          .toList(),
      featured: _asList(json['featured'])
          .map((item) => BusinessItem.fromJson(item as Map<String, dynamic>))
          .toList(),
      popular: _asList(json['popular'])
          .map((item) => BusinessItem.fromJson(item as Map<String, dynamic>))
          .toList(),
      stats: CatalogStats.fromJson(json['stats'] as Map<String, dynamic>),
    );
  }
}

class CategoryItem {
  const CategoryItem({
    required this.id,
    required this.name,
    required this.slug,
    required this.icon,
    required this.accent,
    required this.isActive,
  });

  final String id;
  final String name;
  final String slug;
  final String icon;
  final String accent;
  final bool isActive;

  factory CategoryItem.fromJson(Map<String, dynamic> json) {
    return CategoryItem(
      id: _asString(json['id']),
      name: _asString(json['name']),
      slug: _asString(json['slug']),
      icon: _asString(json['icon']),
      accent: _asString(json['accent']),
      isActive: _asBool(json['isActive']),
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
    this.badgeText,
    this.badgeColor,
  });

  final String id;
  final String name;
  final String subtitle;
  final String area;
  final String city;
  final double rating;
  final int reviewCount;
  final double distanceKm;
  final String coverVariant;
  final String imageUrl;
  final String categoryName;
  final bool isFeatured;
  final bool isPopular;
  final String? badgeText;
  final String? badgeColor;

  String get locationLabel => '$area, $city';

  factory BusinessItem.fromJson(Map<String, dynamic> json) {
    final category = json['category'] as Map<String, dynamic>? ?? {};

    return BusinessItem(
      id: _asString(json['id']),
      name: _asString(json['name']),
      subtitle: _asString(json['subtitle']),
      area: _asString(json['area']),
      city: _asString(json['city']),
      rating: _asDouble(json['rating']),
      reviewCount: _asInt(json['reviewCount']),
      distanceKm: _asDouble(json['distanceKm']),
      coverVariant: _asString(json['coverVariant']),
      imageUrl: _asString(json['imageUrl']),
      categoryName: _asString(category['name']),
      isFeatured: _asBool(json['isFeatured']),
      isPopular: _asBool(json['isPopular']),
      badgeText: _asNullableString(json['badgeText']),
      badgeColor: _asNullableString(json['badgeColor']),
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
