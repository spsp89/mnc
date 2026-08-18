import 'package:bnc_mobile/app/router.dart';
import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/features/auth/presentation/auth_screens.dart';
import 'package:bnc_mobile/features/discovery/presentation/search_screen.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('public discovery pages do not require authentication', () {
    expect(routeRequiresAuthentication('/home'), isFalse);
    expect(routeRequiresAuthentication('/search'), isFalse);
    expect(routeRequiresAuthentication('/business/harbour-electric'), isFalse);
    expect(routeRequiresAuthentication('/jobs'), isFalse);
    expect(routeRequiresAuthentication('/jobs/job-1'), isFalse);
    expect(routeRequiresAuthentication('/jobs/job-1/apply'), isFalse);
    expect(routeRequiresAuthentication('/bookings'), isFalse);
    expect(routeRequiresAuthentication('/weekly-draw'), isFalse);
    expect(routeRequiresAuthentication('/locations'), isFalse);
    expect(routeRequiresAuthentication('/services/svc-fx-1'), isFalse);
    expect(routeRequiresAuthentication('/offers/kochi'), isFalse);
    expect(routeRequiresAuthentication('/compare'), isFalse);
    expect(routeRequiresAuthentication('/help'), isFalse);
    expect(routeRequiresAuthentication('/about'), isFalse);
    expect(routeRequiresAuthentication('/privacy'), isFalse);
    expect(routeRequiresAuthentication('/terms'), isFalse);
    expect(routeRequiresAuthentication('/refunds'), isFalse);
  });

  test('customer account and transaction routes require authentication', () {
    for (final path in [
      '/saved',
      '/messages',
      '/account',
      '/account/profile',
      '/account/settings',
      '/account/support',
      '/account/bookings',
      '/account/messages',
      '/account/enquiries/enquiry-1',
      '/checkout',
      '/orders/order-1',
      '/notifications',
      '/messages/conversation-1',
      '/review/new',
      '/account/job-applications',
    ]) {
      expect(
        routeRequiresAuthentication(path),
        isTrue,
        reason: '$path must be private',
      );
    }
  });

  test('customer authentication safely preserves a private return route', () {
    expect(customerAuthDestination('/orders/order-1'), '/orders/order-1');
    expect(
      customerAuthDestination('/product/product-1?from=offer'),
      '/product/product-1?from=offer',
    );
    expect(
      customerAuthDestination('/review/new?business=harbour-electric'),
      '/review/new?business=harbour-electric',
    );
    expect(customerAuthDestination('https://evil.example'), '/home');
    expect(customerAuthDestination('/admin/users'), '/home');
    expect(customerAuthDestination('/business-dashboard'), '/home');
    expect(customerAuthDestination('/business/settings'), '/home');
    expect(
      customerAuthDestination('/business/harbour-electric'),
      '/business/harbour-electric',
    );
    expect(customerAuthDestination('/login'), '/home');
  });

  test('every authenticated role stays in the customer mobile shell', () {
    expect(routeRequiresAdministrator('/admin'), isFalse);
    expect(routeRequiresAdministrator('/admin/users'), isFalse);
    expect(routeRequiresAdministrator('/home'), isFalse);

    const customer = UserProfile(
      id: 'customer',
      phone: '',
      displayName: 'Customer',
      role: 'CUSTOMER',
    );
    const administrator = UserProfile(
      id: 'administrator',
      phone: '',
      displayName: 'Administrator',
      role: 'SUPER_ADMIN',
    );
    const owner = UserProfile(
      id: 'owner',
      phone: '',
      displayName: 'Owner',
      role: 'BUSINESS_OWNER',
    );
    expect(authenticatedLandingRoute(customer), '/home');
    expect(authenticatedLandingRoute(owner), '/home');
    expect(authenticatedLandingRoute(administrator), '/home');
  });

  test('home discovery links configure search filters and map view', () {
    final screen = searchScreenFromUri(
      Uri.parse(
        '/search?q=Doctors&radius=2&openNow=true&offers=true&'
        'premium=true&homeService=true&verified=true&rating=4.5&'
        'delivery=true&fastResponse=true&priceRange=2&payment=UPI&'
        'language=Malayalam&minYears=5&sort=price-low&view=map',
      ),
    );

    expect(screen.initialQuery, 'Doctors');
    expect(screen.initialRadiusKm, 2);
    expect(screen.initialOpenNow, isTrue);
    expect(screen.initialOffers, isTrue);
    expect(screen.initialPremium, isTrue);
    expect(screen.initialHomeService, isTrue);
    expect(screen.initialVerified, isTrue);
    expect(screen.initialRating, 4.5);
    expect(screen.initialDelivery, isTrue);
    expect(screen.initialFastResponse, isTrue);
    expect(screen.initialPriceRange, 2);
    expect(screen.initialPayment, 'UPI');
    expect(screen.initialLanguage, 'Malayalam');
    expect(screen.initialMinYears, 5);
    expect(screen.initialSort, 'price-low');
    expect(screen.initialMapView, isTrue);
  });

  test('catalogue location links retain city or precise coordinates', () {
    final city = searchScreenFromUri(
      Uri.parse('/search?location=Kozhikode&radius=10'),
    );
    final precise = searchScreenFromUri(
      Uri.parse(
        '/search?location=Current%20location&latitude=10.1&longitude=76.2&'
        'constituency=Thrippunithura&district=Ernakulam&state=Kerala',
      ),
    );

    expect(city.initialLocation, 'Kozhikode');
    expect(city.initialRadiusKm, 10);
    expect(precise.initialLocation, 'Current location');
    expect(precise.initialLatitude, 10.1);
    expect(precise.initialLongitude, 76.2);
    expect(precise.initialConstituency, 'Thrippunithura');
    expect(precise.initialDistrict, 'Ernakulam');
    expect(precise.initialState, 'Kerala');
  });

  test('product and service links retain administrative discovery context', () {
    final uri = Uri.parse(
      '/products?q=chair&constituency=Thrippunithura&district=Ernakulam&'
      'state=Kerala&radius=25',
    );
    final products = productsScreenFromUri(uri);
    final services = servicesScreenFromUri(
      uri.replace(path: '/services', queryParameters: {...uri.queryParameters}),
    );

    expect(products.initialQuery, 'chair');
    expect(products.initialConstituency, 'Thrippunithura');
    expect(products.initialDistrict, 'Ernakulam');
    expect(products.initialState, 'Kerala');
    expect(products.initialRadiusKm, 25);
    expect(services.initialConstituency, 'Thrippunithura');
    expect(services.initialDistrict, 'Ernakulam');
    expect(services.initialState, 'Kerala');
  });

  test('wide discovery links retain courier and quality sorting', () {
    final products = productsScreenFromUri(
      Uri.parse(
        '/products?category=electronics&status=IN_STOCK&courier=true&'
        'sort=best-selling',
      ),
    );
    final services = servicesScreenFromUri(
      Uri.parse('/services?sort=top-rated'),
    );

    expect(products.initialCategory, 'electronics');
    expect(products.initialStock, 'IN_STOCK');
    expect(products.initialCourier, isTrue);
    expect(products.initialSort, 'best-selling');
    expect(services.initialSort, 'top-rated');
  });

  test('website booking and cart context is retained in Flutter', () {
    final booking = bookingsScreenFromUri(
      Uri.parse('/bookings?q=Dental&service=service-1'),
    );
    final myBookings = bookingsScreenFromUri(
      Uri.parse('/account/bookings'),
      initialTab: 1,
    );
    final cart = cartScreenFromUri(Uri.parse('/cart?add=product-1'));

    expect(booking.initialQuery, 'Dental');
    expect(booking.initialServiceId, 'service-1');
    expect(booking.initialTab, 0);
    expect(myBookings.initialTab, 1);
    expect(cart.initialProductId, 'product-1');
  });
}
