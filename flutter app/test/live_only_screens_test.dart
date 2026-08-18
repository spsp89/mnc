import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/core/state/app_state.dart';
import 'package:bnc_mobile/core/storage/app_preferences.dart';
import 'package:bnc_mobile/design_system/bnc_theme.dart';
import 'package:bnc_mobile/features/catalog/presentation/catalog_screens.dart';
import 'package:bnc_mobile/features/community/presentation/community_screens.dart';
import 'package:bnc_mobile/features/enquiries/presentation/enquiry_screens.dart';
import 'package:bnc_mobile/features/jobs/presentation/jobs_screens.dart';
import 'package:bnc_mobile/features/orders/presentation/order_screens.dart';
import 'package:bnc_mobile/features/support/presentation/support_screens.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  late SharedPreferences preferences;

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    preferences = await SharedPreferences.getInstance();
  });

  testWidgets('jobs render live empty results', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [liveJobsProvider.overrideWith((ref) async => const [])],
        child: MaterialApp(theme: BncTheme.light, home: const JobsScreen()),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('No open vacancies'), findsOneWidget);
  });

  testWidgets('jobs can be searched and filtered by employment type', (
    tester,
  ) async {
    final jobs = <Json>[
      {
        'id': 'job-1',
        'title': 'UI Designer',
        'description': 'Design customer experiences',
        'employmentType': 'PART_TIME',
        'workplaceType': 'HYBRID',
        'city': 'Kochi',
        'skills': ['Figma'],
        'business': {'name': 'Design Studio'},
      },
      {
        'id': 'job-2',
        'title': 'Store Manager',
        'description': 'Manage a local shop',
        'employmentType': 'FULL_TIME',
        'workplaceType': 'ON_SITE',
        'city': 'Kozhikode',
        'skills': ['Retail'],
        'business': {'name': 'Local Mart'},
      },
    ];
    await tester.pumpWidget(
      ProviderScope(
        overrides: [liveJobsProvider.overrideWith((ref) async => jobs)],
        child: MaterialApp(theme: BncTheme.light, home: const JobsScreen()),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'figma');
    await tester.pump();
    expect(find.text('UI Designer'), findsOneWidget);
    expect(find.text('Store Manager'), findsNothing);

    await tester.enterText(find.byType(TextField), '');
    await tester.pump();
    await tester.tap(find.text('Part time'));
    await tester.pump();
    expect(find.text('UI Designer'), findsOneWidget);
    expect(find.text('Store Manager'), findsNothing);
  });

  testWidgets('pickup orders use a pickup-specific timeline', (tester) async {
    const order = Order(
      id: 'order-pickup',
      orderNumber: 'BNC-PICKUP-1',
      status: 'READY_FOR_PICKUP',
      total: 500,
      createdAt: '2026-08-07T00:00:00.000Z',
      fulfilmentType: 'pickup',
      lines: [
        OrderLine(
          id: 'line-1',
          name: 'Local product',
          quantity: 1,
          unitPrice: 500,
        ),
      ],
    );
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          orderProvider('order-pickup').overrideWith((ref) async => order),
        ],
        child: MaterialApp(
          theme: BncTheme.light,
          home: const OrderDetailScreen(
            id: 'order-pickup',
            initialOrder: order,
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Ready for pickup'), findsWidgets);
    expect(find.text('On the way'), findsNothing);
  });

  testWidgets('cart links add the requested live product once', (tester) async {
    const product = Product(
      id: 'product-1',
      name: 'GaN charger',
      category: 'Electronics',
      price: 1999,
      imageUrl: '',
      businessId: 'business-1',
      minimumOrderQty: 2,
    );
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          cartProductProvider('product-1').overrideWith((ref) async => product),
        ],
        child: MaterialApp(
          theme: BncTheme.light,
          home: const CartScreen(initialProductId: 'product-1'),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('GaN charger'), findsOneWidget);
    expect(find.text('2'), findsOneWidget);
    expect(find.textContaining('Checkout'), findsOneWidget);
    await tester.pump();
    expect(find.text('2'), findsOneWidget);
  });

  testWidgets('booking directory renders live empty results', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          liveBookingsProvider.overrideWith((ref) async => const []),
          bookableServicesProvider.overrideWith((ref) async => const []),
        ],
        child: MaterialApp(theme: BncTheme.light, home: const BookingsScreen()),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('No appointment services'), findsOneWidget);
  });

  testWidgets('booking directory searches service, business and city', (
    tester,
  ) async {
    const services = [
      Service(
        id: 'service-1',
        name: 'Dental consultation',
        startingPrice: 500,
        pricingUnit: 'per visit',
        businessName: 'Kochi Dental Care',
        businessCity: 'Kochi',
        category: 'Clinics',
      ),
      Service(
        id: 'service-2',
        name: 'Hair styling',
        startingPrice: 900,
        pricingUnit: 'onwards',
        businessName: 'Glow Salon',
        businessCity: 'Kozhikode',
        category: 'Beauty & wellness',
      ),
    ];
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          liveBookingsProvider.overrideWith((ref) async => const []),
          bookableServicesProvider.overrideWith((ref) async => services),
        ],
        child: MaterialApp(theme: BncTheme.light, home: const BookingsScreen()),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'Kozhikode');
    await tester.pump();

    expect(find.text('Hair styling'), findsOneWidget);
    expect(find.text('Dental consultation'), findsNothing);
    expect(find.text('1 bookable service'), findsOneWidget);
  });

  testWidgets('booking links preserve query and selected service context', (
    tester,
  ) async {
    const services = [
      Service(
        id: 'service-1',
        name: 'Dental consultation',
        startingPrice: 500,
        pricingUnit: 'per visit',
        businessName: 'Kochi Dental Care',
        businessCity: 'Kochi',
      ),
      Service(
        id: 'service-2',
        name: 'Hair styling',
        startingPrice: 900,
        pricingUnit: 'onwards',
        businessName: 'Glow Salon',
        businessCity: 'Kozhikode',
      ),
    ];
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          liveBookingsProvider.overrideWith((ref) async => const []),
          bookableServicesProvider.overrideWith((ref) async => services),
        ],
        child: MaterialApp(
          theme: BncTheme.light,
          home: const BookingsScreen(
            initialQuery: 'Hair',
            initialServiceId: 'service-2',
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    final field = tester.widget<TextField>(find.byType(TextField));
    expect(field.controller?.text, 'Hair');
    expect(find.text('Hair styling'), findsOneWidget);
    expect(find.text('Dental consultation'), findsNothing);
    expect(find.text('Selected service'), findsOneWidget);
  });

  testWidgets('signed-in support history renders live ticket status', (
    tester,
  ) async {
    final tickets = <Json>[
      {
        'id': 'ticket-1',
        'ticketNumber': 'BNC-20260808-ABC12345',
        'subject': 'Customer account support',
        'category': 'ACCOUNT',
        'status': 'IN_PROGRESS',
        'createdAt': '2026-08-08T10:00:00.000Z',
        'updatedAt': '2026-08-08T11:00:00.000Z',
      },
    ];
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          supportTicketsProvider.overrideWith((ref) async => tickets),
        ],
        child: MaterialApp(
          theme: BncTheme.light,
          home: const SupportTicketsScreen(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Customer account support'), findsOneWidget);
    expect(find.text('BNC-20260808-ABC12345'), findsOneWidget);
    expect(find.text('In Progress'), findsOneWidget);
  });

  testWidgets('enquiry deep links render the authorised live record', (
    tester,
  ) async {
    const enquiry = Enquiry(
      id: 'enquiry-1',
      requirement: 'Need laptop repair this week',
      locality: 'Kakkanad',
      status: 'RESPONDED',
      createdAt: '2026-08-14T10:00:00.000Z',
      businessId: 'business-1',
      businessName: 'Fixora',
      matches: 1,
    );
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          myEnquiriesProvider.overrideWith((ref) async => const [enquiry]),
        ],
        child: MaterialApp(
          theme: BncTheme.light,
          home: const EnquiryDetailScreen(id: 'enquiry-1'),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Need laptop repair this week'), findsOneWidget);
    expect(find.text('Kakkanad · 2026-08-14T10:00:00.000Z'), findsOneWidget);
    expect(find.text('Start or open BNC chat'), findsOneWidget);
  });

  testWidgets('product directory searches live products', (tester) async {
    const products = [
      Product(
        id: 'product-1',
        name: 'GaN charger',
        category: 'Electronics',
        price: 1999,
        imageUrl: '',
        brand: 'Volt',
      ),
      Product(
        id: 'product-2',
        name: 'Study chair',
        category: 'Furniture',
        price: 10800,
        imageUrl: '',
        brand: 'Craft',
      ),
    ];
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(preferences),
          productsProvider.overrideWith((ref) async => products),
        ],
        child: MaterialApp(theme: BncTheme.light, home: const ProductsScreen()),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'Volt');
    await tester.pump();

    expect(find.text('GaN charger'), findsOneWidget);
    expect(find.text('Study chair'), findsNothing);
  });

  testWidgets('service directory filters home services', (tester) async {
    const services = [
      Service(
        id: 'service-home',
        name: 'Home cleaning',
        startingPrice: 1200,
        pricingUnit: 'onwards',
        homeService: true,
      ),
      Service(
        id: 'service-store',
        name: 'In-store consultation',
        startingPrice: 500,
        pricingUnit: 'per visit',
      ),
    ];
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(preferences),
          servicesListProvider.overrideWith((ref) async => services),
        ],
        child: MaterialApp(theme: BncTheme.light, home: const ServicesScreen()),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Home service'));
    await tester.pump();

    expect(find.text('Home cleaning'), findsOneWidget);
    expect(find.text('In-store consultation'), findsNothing);
  });

  testWidgets('offers directory searches business and coupon code', (
    tester,
  ) async {
    const offers = [
      Offer(
        id: 'offer-1',
        title: 'Welcome offer',
        description: 'First local order',
        discount: '15% off',
        expiresAt: '2026-09-01T00:00:00.000Z',
        businessName: 'Local Mart',
        code: 'WELCOME15',
      ),
      Offer(
        id: 'offer-2',
        title: 'Free consultation',
        description: 'For new customers',
        discount: 'Free',
        expiresAt: '2026-09-01T00:00:00.000Z',
        businessName: 'Design Studio',
      ),
    ];
    await tester.pumpWidget(
      ProviderScope(
        overrides: [offersProvider.overrideWith((ref) async => offers)],
        child: MaterialApp(theme: BncTheme.light, home: const OffersScreen()),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), 'WELCOME15');
    await tester.pump();

    expect(find.text('Welcome offer'), findsOneWidget);
    expect(find.text('Free consultation'), findsNothing);
  });

  testWidgets('customer review history renders live empty results', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [myReviewsProvider.overrideWith((ref) async => const [])],
        child: MaterialApp(
          theme: BncTheme.light,
          home: const MyReviewsScreen(),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('No reviews yet'), findsOneWidget);
  });
}
