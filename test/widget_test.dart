import 'dart:convert';

import 'package:bnc/main.dart';
import 'package:bnc/src/catalog_seed.dart';
import 'package:bnc/src/catalog_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

void main() {
  testWidgets('home screen renders live catalog sections', (tester) async {
    await tester.pumpCatalogWidget(
      NearuHomePage(catalogService: mockCatalogService()),
    );

    await tester.pumpCatalog();

    expect(find.text('Browse by category'), findsOneWidget);
    expect(find.text('Featured shops'), findsOneWidget);
    expect(find.text('Popular businesses'), findsOneWidget);
    expect(find.text('Spice Garden'), findsWidgets);
  });

  testWidgets('category browsing loads businesses for the selected category', (
    tester,
  ) async {
    await tester.pumpCatalogWidget(
      BncCategoryBrowsePage(
        initialCategorySlug: 'grocery',
        initialCategories: fallbackCatalog.categories,
        catalogService: mockCatalogService(),
      ),
    );

    await tester.pumpCatalog();

    expect(find.text('Grocery'), findsWidgets);
    expect(find.text('Grocery businesses'), findsOneWidget);
    expect(find.text('Fresh Basket'), findsWidgets);
    expect(find.text('Spice Garden'), findsNothing);
  });

  testWidgets('search page queries catalog and renders matching results', (
    tester,
  ) async {
    await tester.pumpCatalogWidget(
      BncSearchPage(
        initialQuery: 'home',
        catalogService: mockCatalogService(),
      ),
    );

    await tester.pumpCatalog();

    expect(find.text('Results for "home"'), findsOneWidget);
    expect(find.text('1 matches'), findsOneWidget);
    expect(find.text('HomeFix Pro'), findsWidgets);
  });

  testWidgets('business detail opens from search result and renders contact data', (
    tester,
  ) async {
    await tester.pumpCatalogWidget(
      BncSearchPage(
        initialQuery: 'spice',
        catalogService: mockCatalogService(),
      ),
    );

    await tester.pumpCatalog();
    await tester.tap(find.text('Spice Garden').first);
    await tester.pumpCatalog();

    expect(find.text('Contact'), findsOneWidget);
    expect(find.text('Phone'), findsOneWidget);
    expect(find.text('+91 99999 11111'), findsOneWidget);
    expect(find.text('Address'), findsOneWidget);
    expect(find.text('Mavoor Road, Kozhikode, Kerala'), findsWidgets);
  });
}

extension on WidgetTester {
  Future<void> pumpCatalogWidget(Widget child) {
    return pumpWidget(
      MaterialApp(
        debugShowCheckedModeBanner: false,
        home: child,
      ),
    );
  }

  Future<void> pumpCatalog() async {
    await pump();
    await pump(const Duration(milliseconds: 100));
    await pumpAndSettle();
  }
}

CatalogService mockCatalogService() {
  return CatalogService(
    client: MockClient((request) async {
      final path = request.url.path;

      if (path == '/api/catalog') {
        return jsonResponse(_catalogPayload(request.url.queryParameters));
      }

      if (path == '/api/business/spice-garden') {
        return jsonResponse({'business': _spiceGarden});
      }

      if (path == '/api/business/homefix-pro') {
        return jsonResponse({'business': _homeFixPro});
      }

      if (path == '/api/business/fresh-basket') {
        return jsonResponse({'business': _freshBasket});
      }

      return http.Response(
        jsonEncode({
          'error': {
            'code': 'not_found',
            'message': 'Not found',
            'details': null,
          },
        }),
        404,
        headers: {'content-type': 'application/json'},
      );
    }),
  );
}

http.Response jsonResponse(Object body) {
  return http.Response(
    jsonEncode(body),
    200,
    headers: {'content-type': 'application/json'},
  );
}

Map<String, Object?> _catalogPayload(Map<String, String> query) {
  var businesses = [_spiceGarden, _freshBasket, _homeFixPro];
  final category = query['category'];
  final keyword = query['q']?.toLowerCase();

  if (category != null && category.isNotEmpty) {
    businesses = businesses
        .where((business) {
          final category = business['category']! as Map<String, Object?>;
          return category['slug'] == query['category'];
        })
        .toList();
  }

  if (keyword != null && keyword.isNotEmpty) {
    businesses = businesses
        .where((business) => business['searchText'].toString().contains(keyword))
        .toList();
  }

  return {
    'categories': _categories,
    'featured': businesses
        .where((business) {
          final flags = business['flags']! as Map<String, Object?>;
          return flags['featured'] == true;
        })
        .toList(),
    'popular': businesses
        .where((business) {
          final flags = business['flags']! as Map<String, Object?>;
          return flags['popular'] == true;
        })
        .toList(),
    'all': businesses,
    'filters': {
      'query': query['q'] ?? '',
      'categorySlug': query['category'] ?? '',
      'featured': false,
      'popular': false,
      'tags': <String>[],
      'sort': 'default',
      'limit': null,
    },
    'stats': {
      'categories': _categories.length,
      'businesses': businesses.length,
      'trusted': businesses.length,
      'happyUsers': '10K+',
    },
  };
}

final _categories = [
  {
    'id': '1',
    'name': 'Restaurants',
    'slug': 'restaurants',
    'icon': 'utensils-crossed',
    'accentColor': '#FFB01E',
    'isActive': true,
    'sortOrder': 1,
  },
  {
    'id': '2',
    'name': 'Grocery',
    'slug': 'grocery',
    'icon': 'shopping-cart',
    'accentColor': '#FF5A4C',
    'isActive': true,
    'sortOrder': 2,
  },
  {
    'id': '3',
    'name': 'Home Services',
    'slug': 'home-services',
    'icon': 'house-plus',
    'accentColor': '#4AB64B',
    'isActive': true,
    'sortOrder': 3,
  },
];

final _spiceGarden = businessJson(
  id: '1',
  slug: 'spice-garden',
  name: 'Spice Garden',
  shortDescription: 'Family Restaurant',
  categoryId: '1',
  categoryName: 'Restaurants',
  categorySlug: 'restaurants',
  coverVariant: 'plate',
  featured: true,
  popular: true,
  rating: 4.6,
  reviews: 126,
  distanceKm: 1.2,
  area: 'Mavoor Road',
  phone: '+91 99999 11111',
  tags: ['restaurants', 'family', 'popular'],
);

final _freshBasket = businessJson(
  id: '2',
  slug: 'fresh-basket',
  name: 'Fresh Basket',
  shortDescription: 'Fruit & Vegetable Store',
  categoryId: '2',
  categoryName: 'Grocery',
  categorySlug: 'grocery',
  coverVariant: 'basket',
  featured: true,
  popular: false,
  rating: 4.5,
  reviews: 162,
  distanceKm: 2.1,
  area: 'Palayam',
  phone: '+91 99999 22222',
  tags: ['grocery', 'vegetables'],
);

final _homeFixPro = businessJson(
  id: '3',
  slug: 'homefix-pro',
  name: 'HomeFix Pro',
  shortDescription: 'Plumbing & Repairs',
  categoryId: '3',
  categoryName: 'Home Services',
  categorySlug: 'home-services',
  coverVariant: 'worker',
  featured: false,
  popular: true,
  rating: 4.4,
  reviews: 53,
  distanceKm: 0.8,
  area: 'Chevayur',
  phone: '+91 99999 33333',
  tags: ['home', 'plumbing', 'repairs'],
);

Map<String, Object?> businessJson({
  required String id,
  required String slug,
  required String name,
  required String shortDescription,
  required String categoryId,
  required String categoryName,
  required String categorySlug,
  required String coverVariant,
  required bool featured,
  required bool popular,
  required double rating,
  required int reviews,
  required double distanceKm,
  required String area,
  required String phone,
  required List<String> tags,
}) {
  final searchText = [
    name,
    shortDescription,
    categoryName,
    area,
    ...tags,
  ].join(' ').toLowerCase();

  return {
    'id': id,
    'slug': slug,
    'name': name,
    'shortDescription': shortDescription,
    'logoUrl': null,
    'thumbnailUrl': null,
    'category': {
      'id': categoryId,
      'name': categoryName,
      'slug': categorySlug,
    },
    'flags': {
      'featured': featured,
      'popular': popular,
      'favorite': false,
    },
    'rating': {
      'average': rating,
      'count': reviews,
    },
    'distanceKm': distanceKm,
    'badge': null,
    'contact': {
      'phone': phone,
      'whatsapp': null,
      'email': null,
      'website': null,
    },
    'address': {
      'area': area,
      'city': 'Kozhikode',
      'region': 'Kerala',
      'country': 'India',
      'label': '$area, Kozhikode, Kerala',
      'latitude': null,
      'longitude': null,
    },
    'images': [
      {
        'url': '',
        'alt': '$name cover image',
        'variant': coverVariant,
        'isPrimary': true,
      },
    ],
    'tags': tags,
    'searchText': searchText,
  };
}
