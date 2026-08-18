import 'package:bnc_mobile/core/models/models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('BNC membership labels render the star count and active plan name', () {
    expect(bncMembershipLabel(6, 'Ruby'), 'BNC ⭐⭐⭐⭐⭐⭐ · Ruby');
    expect(bncMembershipLabel(4), 'BNC ⭐⭐⭐⭐ · Platinum');
  });

  group('API model mapping', () {
    test('Category parses aggregated product and service counts', () {
      final category = Category.fromJson({
        'id': 'grocery',
        'name': 'Grocery',
        'slug': 'grocery',
        '_count': {'businessLinks': 2, 'products': 6, 'services': 3},
      });

      expect(category.businessCount, 2);
      expect(category.productCount, 6);
      expect(category.serviceCount, 3);
      expect(categoryImageUrl('insurance'), contains('images.unsplash.com'));
      expect(
        categoryImageUrl('insurance-personal-insurance'),
        categoryImageUrl('insurance'),
      );
    });

    test('Business parses nested Prisma relations', () {
      final business = Business.fromJson({
        'id': 'biz-1',
        'slug': 'harbour-electric',
        'name': 'Harbour Electric',
        'description': 'Trusted electrical services',
        'averageRating': '4.8',
        'reviewCount': 57,
        'verified': true,
        'premium': false,
        'sponsored': true,
        'permanentDiscountPercent': 12,
        'permanentDiscountLabel': 'For BNC customers',
        'websiteUrl': 'https://harbourelectric.example',
        'socialLinks': {
          'instagram': 'https://instagram.com/harbourelectric',
          'empty': '',
          'invalid': 42,
        },
        'locations': [
          {
            'addressLine1': 'Marine Drive',
            'locality': 'Ernakulam',
            'city': 'Kochi',
            'latitude': '9.9816',
            'longitude': '76.2756',
          },
        ],
        'categories': [
          {
            'category': {'name': 'Electricians', 'slug': 'electricians'},
          },
        ],
        'media': [
          {'url': 'https://images.example/cover.jpg'},
        ],
        'attributes': {
          'languages': ['English', 'Malayalam'],
          'paymentMethods': ['UPI'],
        },
        'subscriptions': [
          {
            'plan': {
              'name': 'Local Plus',
              'starLevel': 4,
              'sponsoredPlacement': true,
            },
          },
        ],
      });

      expect(business.category, 'Electricians');
      expect(business.locality, 'Ernakulam');
      expect(business.address, 'Marine Drive, Ernakulam, Kochi');
      expect(business.latitude, closeTo(9.9816, 0.0001));
      expect(business.gallery, ['https://images.example/cover.jpg']);
      expect(business.languages, contains('Malayalam'));
      expect(business.paymentMethods, ['UPI']);
      expect(business.websiteUrl, 'https://harbourelectric.example');
      expect(business.socialLinks, {
        'instagram': 'https://instagram.com/harbourelectric',
      });
      expect(business.bncStarLevel, 4);
      expect(business.planName, 'Local Plus');
      expect(business.permanentDiscountPercent, 12);
      expect(business.permanentDiscountLabel, 'For BNC customers');
      expect(business.distanceKm, isNull);
    });

    test('trust, premium, and sponsored states remain independent', () {
      final business = Business.fromJson({
        'verified': true,
        'premium': false,
        'sponsored': true,
        'bncStarLevel': 6,
        'planName': 'Premier',
      });

      expect(business.verified, isTrue);
      expect(business.premium, isFalse);
      expect(business.sponsored, isTrue);
      expect(business.bncStarLevel, 6);
      expect(business.planName, 'Premier');
    });

    test('Business parses the flat customer search response', () {
      final business = Business.fromJson({
        'id': 'business-search-1',
        'name': 'Fixora',
        'slug': 'fixora',
        'categoryName': 'Home services',
        'categorySlug': 'home-services',
        'priceRange': 2,
        'locality': 'Kakkanad',
        'city': 'Kochi',
        'distanceKm': null,
        'bncStarLevel': 3,
        'planName': 'Growth',
        'permanentDiscountPercent': 8,
      });

      expect(business.category, 'Home services');
      expect(business.categorySlug, 'home-services');
      expect(business.priceRange, '₹₹');
      expect(business.distanceKm, isNull);
      expect(business.bncStarLevel, 3);
      expect(business.permanentDiscountPercent, 8);
    });

    test('Product parses the live catalogue response shape', () {
      final product = Product.fromJson({
        'id': 'product-1',
        'businessId': 'business-1',
        'name': 'Kerala Essentials Basket',
        'brand': 'Green Basket',
        'description': 'Local essentials',
        'price': '1999',
        'discountPrice': '1799',
        'stockStatus': 'IN_STOCK',
        'minimumOrderQty': 2,
        'deliveryOptions': ['pickup', 'local_delivery'],
        'category': {'name': 'Grocery', 'slug': 'grocery'},
        'business': {
          'id': 'business-1',
          'name': 'Green Basket',
          'slug': 'green-basket',
          'publicPhone': '+91 98765 43210',
          'locations': [
            {'locality': 'Edappally', 'city': 'Kochi'},
          ],
        },
        'distanceKm': '3.4',
        'sponsored': true,
        'courierAvailable': true,
        'unitsSold': 8,
        'bncStarLevel': 5,
        'planName': 'Diamond',
        'media': [
          {'publicUrl': 'https://images.example/product.jpg'},
        ],
      });

      expect(product.category, 'Grocery');
      expect(product.imageUrl, 'https://images.example/product.jpg');
      expect(product.businessName, 'Green Basket');
      expect(product.businessSlug, 'green-basket');
      expect(product.businessPhone, '+91 98765 43210');
      expect(product.businessLocality, 'Edappally');
      expect(product.businessCity, 'Kochi');
      expect(product.distanceKm, 3.4);
      expect(product.sponsored, isTrue);
      expect(product.courierAvailable, isTrue);
      expect(product.unitsSold, 8);
      expect(product.bncStarLevel, 5);
      expect(product.planName, 'Diamond');
      expect(product.effectivePrice, 1799);
      expect(product.minimumOrderQty, 2);
      expect(product.deliveryOptions, contains('local_delivery'));
      expect(product.homeDeliveryAvailable, isTrue);
    });

    test('Product distinguishes pickup from explicit home delivery', () {
      final pickupOnly = Product.fromJson({
        'id': 'pickup-product',
        'name': 'Pickup item',
        'price': 500,
        'deliveryOptions': ['pickup'],
      });
      final legacyDelivery = Product.fromJson({
        'id': 'delivery-product',
        'name': 'Delivered item',
        'price': 700,
        'deliveryOptions': [
          {'homeDelivery': true},
        ],
      });
      final courier = Product.fromJson({
        'id': 'courier-product',
        'name': 'Courier item',
        'price': 900,
        'deliveryOptions': ['courier'],
      });
      final noDelivery = Product.fromJson({
        'id': 'no-delivery-product',
        'name': 'No delivery item',
        'price': 300,
        'deliveryOptions': null,
      });

      expect(pickupOnly.homeDeliveryAvailable, isFalse);
      expect(legacyDelivery.homeDeliveryAvailable, isTrue);
      expect(legacyDelivery.deliveryOptions, contains('home_delivery'));
      expect(courier.courierDeliveryAvailable, isTrue);
      expect(courier.homeDeliveryAvailable, isTrue);
      expect(noDelivery.deliveryOptions, isEmpty);
      expect(noDelivery.homeDeliveryAvailable, isFalse);
    });

    test('Service parses provider, media and duration from the live API', () {
      final service = Service.fromJson({
        'id': 'service-1',
        'businessId': 'business-1',
        'name': 'Deep Home Cleaning',
        'startingPrice': '1299',
        'pricingType': 'STARTING_AT',
        'durationMinutes': 90,
        'homeService': true,
        'category': {'name': 'Home services'},
        'business': {
          'id': 'business-1',
          'name': 'Fixora',
          'slug': 'fixora',
          'averageRating': '4.8',
          'reviewCount': 37,
          'verified': true,
          'locations': [
            {'locality': 'Kakkanad', 'city': 'Kochi'},
          ],
        },
        'distanceKm': '5.2',
        'bncStarLevel': 4,
        'planName': 'Platinum',
        'media': [
          {'publicUrl': 'https://images.example/service.jpg'},
        ],
      });

      expect(service.businessName, 'Fixora');
      expect(service.businessSlug, 'fixora');
      expect(service.businessLocality, 'Kakkanad');
      expect(service.businessCity, 'Kochi');
      expect(service.distanceKm, 5.2);
      expect(service.businessRating, 4.8);
      expect(service.businessReviewCount, 37);
      expect(service.businessVerified, isTrue);
      expect(service.bncStarLevel, 4);
      expect(service.planName, 'Platinum');
      expect(service.category, 'Home services');
      expect(service.duration, '90 min');
      expect(service.pricingUnit, 'onwards');
      expect(service.imageUrl, 'https://images.example/service.jpg');
    });

    test('Business derives truthful availability from published hours', () {
      final business = Business.fromJson({
        'workingHours': [
          for (var day = 0; day < 7; day++)
            {
              'dayOfWeek': day,
              'opensAt': '00:00',
              'closesAt': '23:59',
              'closed': false,
            },
        ],
      });

      expect(business.hoursKnown, isTrue);
      expect(business.openNow, isTrue);
      expect(business.closesAt, '11:59 PM');
      expect(business.availabilityLabel, 'Open now');
    });

    test('Business does not invent open status when hours are absent', () {
      final business = Business.fromJson({'name': 'No hours business'});

      expect(business.hoursKnown, isFalse);
      expect(business.openNow, isFalse);
      expect(business.availabilityLabel, 'Hours not listed');
    });

    test('Offer maps coupon, expiry and public business destination', () {
      final offer = Offer.fromJson({
        'id': 'offer-1',
        'businessId': 'business-1',
        'title': 'Welcome offer',
        'description': 'For first orders',
        'type': 'PERCENTAGE',
        'discountValue': '15',
        'couponCode': 'WELCOME15',
        'minimumSpend': '500',
        'endsAt': '2026-09-01T00:00:00.000Z',
        'business': {
          'id': 'business-1',
          'name': 'Local Mart',
          'slug': 'local-mart',
          'locations': [
            {'locality': 'Kaloor', 'city': 'Kochi'},
          ],
        },
      });

      expect(offer.discount, '15% off');
      expect(offer.code, 'WELCOME15');
      expect(offer.minimumSpend, 500);
      expect(offer.expiresAt, '2026-09-01T00:00:00.000Z');
      expect(offer.businessSlug, 'local-mart');
      expect(offer.businessLocality, 'Kaloor');
      expect(offer.businessCity, 'Kochi');
    });

    test('Enquiry maps nested location and matched businesses', () {
      final enquiry = Enquiry.fromJson({
        'id': 'enquiry-1',
        'requirement': 'Need an electrician',
        'location': {'locality': 'Kakkanad'},
        'status': 'MATCHED',
        'createdAt': '2026-08-07T00:00:00.000Z',
        'lead': {
          'assignments': [
            {
              'business': {'name': 'Harbour Electric'},
            },
            {
              'business': {'name': 'Kochi Electricals'},
            },
          ],
        },
      });

      expect(enquiry.locality, 'Kakkanad');
      expect(enquiry.businessName, 'Harbour Electric');
      expect(enquiry.matches, 2);
    });

    test('Enquiry retains its direct business for secure chat', () {
      final enquiry = Enquiry.fromJson({
        'id': 'enquiry-direct',
        'business': {'id': 'business-1', 'name': 'Harbour Electric'},
      });

      expect(enquiry.businessId, 'business-1');
      expect(enquiry.businessName, 'Harbour Electric');
    });

    test('Order maps live snapshots, totals, business and payment state', () {
      final order = Order.fromJson({
        'id': 'order-1',
        'orderNumber': 'BNC-260807-ABC123',
        'status': 'CONFIRMED',
        'subtotal': '1999',
        'discount': '200',
        'deliveryFee': '50',
        'total': '1849',
        'fulfilmentType': 'delivery',
        'deliveryAddress': {'addressLine1': 'Marine Drive', 'city': 'Kochi'},
        'createdAt': '2026-08-07T00:00:00.000Z',
        'business': {'name': 'Local Mart', 'slug': 'local-mart'},
        'items': [
          {
            'id': 'item-1',
            'nameSnapshot': 'Kerala Essentials Basket',
            'quantity': 2,
            'unitPrice': '999.5',
          },
        ],
        'payments': [
          {'status': 'CAPTURED'},
        ],
      });

      expect(order.orderNumber, 'BNC-260807-ABC123');
      expect(order.businessName, 'Local Mart');
      expect(order.businessSlug, 'local-mart');
      expect(order.lines.single.name, 'Kerala Essentials Basket');
      expect(order.paymentStatus, 'CAPTURED');
      expect(order.deliveryAddress.string('city'), 'Kochi');
      expect(order.total, 1849);
    });

    test('Notification resolves customer destinations from API metadata', () {
      final orderNotification = AppNotification.fromJson({
        'id': 'notification-1',
        'type': 'ORDER_UPDATE',
        'title': 'Order update',
        'body': 'Your order is dispatched',
        'createdAt': '2026-08-07T00:00:00.000Z',
        'data': {'orderId': 'order-1'},
      });
      final messageNotification = AppNotification.fromJson({
        'id': 'notification-2',
        'type': 'CUSTOMER_RESPONSE',
        'title': 'New response',
        'body': 'A business replied',
        'createdAt': '2026-08-07T00:00:00.000Z',
        'data': {'conversationId': 'conversation-1'},
      });

      expect(orderNotification.destination, '/orders/order-1');
      expect(messageNotification.destination, '/messages/conversation-1');
    });

    test('Notification hides owner events and maps customer-only events', () {
      final leadNotification = AppNotification.fromJson({
        'id': 'notification-owner',
        'type': 'NEW_LEAD',
        'title': 'New lead',
        'body': 'Owner-only event',
        'createdAt': '2026-08-07T00:00:00.000Z',
      });
      final reviewReply = AppNotification.fromJson({
        'id': 'notification-review',
        'type': 'REVIEW_REPLY',
        'title': 'Business replied',
        'body': 'A business replied to your review',
        'createdAt': '2026-08-07T00:00:00.000Z',
      });
      final supportUpdate = AppNotification.fromJson({
        'id': 'notification-support',
        'type': 'SUPPORT_UPDATE',
        'title': 'Support update',
        'body': 'Your request was updated',
        'createdAt': '2026-08-07T00:00:00.000Z',
      });

      expect(leadNotification.customerVisible, isFalse);
      expect(reviewReply.customerVisible, isTrue);
      expect(reviewReply.destination, '/account/reviews');
      expect(supportUpdate.destination, '/contact');
    });
  });

  group('SearchFilters', () {
    test(
      'maps UI sort names to the API contract and omits inactive filters',
      () {
        final query = const SearchFilters(
          query: '  electrician ',
          location: 'Kochi',
          constituency: 'Ernakulam',
          district: 'Ernakulam',
          state: 'Kerala',
          latitude: 9.93,
          longitude: 76.26,
          radiusKm: 10,
          verified: true,
          delivery: true,
          fastResponse: true,
          priceRange: 2,
          payment: 'UPI',
          language: 'Malayalam',
          minYears: 5,
          sort: 'distance',
        ).toQuery(page: 2, pageSize: 12);

        expect(query['query'], 'electrician');
        expect(query['constituency'], 'Ernakulam');
        expect(query['district'], 'Ernakulam');
        expect(query['state'], 'Kerala');
        expect(query['sort'], 'nearest');
        expect(query['page'], 2);
        expect(query['pageSize'], 12);
        expect(query['verified'], isTrue);
        expect(query['delivery'], isTrue);
        expect(query['fastResponse'], isTrue);
        expect(query['priceRange'], 2);
        expect(query['payment'], 'UPI');
        expect(query['language'], 'Malayalam');
        expect(query['minYears'], 5);
        expect(query.containsKey('openNow'), isFalse);
        expect(query.containsKey('offers'), isFalse);
      },
    );

    test('omits an empty locality while retaining precise coordinates', () {
      final query = const SearchFilters(
        location: '',
        latitude: 9.95,
        longitude: 76.28,
      ).toQuery();

      expect(query.containsKey('location'), isFalse);
      expect(query['latitude'], 9.95);
      expect(query['longitude'], 76.28);
    });

    test('passes price sorting through to the shared search contract', () {
      expect(
        const SearchFilters(sort: 'price-low').toQuery()['sort'],
        'price-low',
      );
      expect(
        const SearchFilters(sort: 'price-high').toQuery()['sort'],
        'price-high',
      );
    });

    test('records completed searches with location and active filters', () {
      final payload = const SearchFilters(
        query: '  laptop repair ',
        location: 'Kochi',
        latitude: 9.93,
        longitude: 76.26,
        radiusKm: 10,
        verified: true,
        language: 'Malayalam',
        sort: 'rating',
      ).toHistoryPayload(resultCount: 14, interfaceLanguage: 'ml');

      expect(payload['query'], 'laptop repair');
      expect(payload['language'], 'ml');
      expect(payload['resultCount'], 14);
      expect(payload['location'], {
        'label': 'Kochi',
        'latitude': 9.93,
        'longitude': 76.26,
      });
      expect(payload['filters'], containsPair('verified', true));
      expect(payload['filters'], containsPair('language', 'Malayalam'));
      expect(payload['filters'], containsPair('sort', 'rating'));
    });

    test('reopens shared web history with its original search context', () {
      final entry = SearchHistoryEntry.fromJson({
        'id': 'history-1',
        'query': 'doctor',
        'resultCount': 7,
        'createdAt': '2026-08-07T00:00:00.000Z',
        'location': {
          'label': 'Kozhikode',
          'constituency': 'Kozhikode North',
          'district': 'Kozhikode',
          'state': 'Kerala',
          'latitude': 11.2588,
          'longitude': 75.7804,
        },
        'filters': {
          'radiusKm': 25,
          'openNow': true,
          'price': '₹₹',
          'sort': 'nearest',
        },
      });

      expect(entry.resultCount, 7);
      expect(entry.filters.priceRange, 2);
      expect(entry.filters.sort, 'distance');
      expect(entry.filters.constituency, 'Kozhikode North');
      expect(entry.filters.district, 'Kozhikode');
      expect(entry.filters.state, 'Kerala');
      expect(entry.destination.queryParameters, containsPair('q', 'doctor'));
      expect(
        entry.destination.queryParameters,
        containsPair('location', 'Kozhikode'),
      );
      expect(entry.destination.queryParameters, containsPair('radius', '25'));
      expect(
        entry.destination.queryParameters,
        containsPair('constituency', 'Kozhikode North'),
      );
      expect(
        entry.destination.queryParameters,
        containsPair('district', 'Kozhikode'),
      );
      expect(
        entry.destination.queryParameters,
        containsPair('state', 'Kerala'),
      );
      expect(
        entry.destination.queryParameters,
        containsPair('openNow', 'true'),
      );
      expect(
        entry.destination.queryParameters,
        containsPair('priceRange', '2'),
      );
    });
  });

  test('PageResult reports whether another page exists', () {
    const first = PageResult<int>(
      items: [1, 2],
      page: 1,
      pageSize: 2,
      total: 3,
    );
    const last = PageResult<int>(items: [3], page: 2, pageSize: 2, total: 3);

    expect(first.hasMore, isTrue);
    expect(last.hasMore, isFalse);
  });
}
