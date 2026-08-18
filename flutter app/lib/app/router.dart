import 'package:bnc_mobile/app/customer_shell.dart';
import 'package:bnc_mobile/core/models/models.dart';
import 'package:bnc_mobile/core/state/app_state.dart';
import 'package:bnc_mobile/features/account/presentation/account_screens.dart';
import 'package:bnc_mobile/features/auth/presentation/auth_screens.dart';
import 'package:bnc_mobile/features/businesses/presentation/business_profile_screen.dart';
import 'package:bnc_mobile/features/catalog/presentation/catalog_screens.dart';
import 'package:bnc_mobile/features/catalog/presentation/product_detail_screen.dart';
import 'package:bnc_mobile/features/catalog/presentation/service_detail_screen.dart';
import 'package:bnc_mobile/features/community/presentation/community_screens.dart';
import 'package:bnc_mobile/features/discovery/presentation/home_screen.dart';
import 'package:bnc_mobile/features/discovery/presentation/search_screen.dart';
import 'package:bnc_mobile/features/enquiries/presentation/enquiry_screens.dart';
import 'package:bnc_mobile/features/jobs/presentation/jobs_screens.dart';
import 'package:bnc_mobile/features/messaging/presentation/messaging_screens.dart';
import 'package:bnc_mobile/features/notifications/presentation/notifications_screen.dart';
import 'package:bnc_mobile/features/onboarding/presentation/onboarding_screens.dart';
import 'package:bnc_mobile/features/orders/presentation/order_screens.dart';
import 'package:bnc_mobile/features/reviews/presentation/review_screen.dart';
import 'package:bnc_mobile/features/saved/presentation/saved_screen.dart';
import 'package:bnc_mobile/features/support/presentation/support_screens.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

final _rootKey = GlobalKey<NavigatorState>(debugLabel: 'root');
final _homeKey = GlobalKey<NavigatorState>(debugLabel: 'home');
final _searchKey = GlobalKey<NavigatorState>(debugLabel: 'search');
final _savedKey = GlobalKey<NavigatorState>(debugLabel: 'saved');
final _messagesKey = GlobalKey<NavigatorState>(debugLabel: 'messages');
final _accountKey = GlobalKey<NavigatorState>(debugLabel: 'account');

BookingsScreen bookingsScreenFromUri(Uri uri, {int initialTab = 0}) =>
    BookingsScreen(
      initialQuery: uri.queryParameters['q'],
      initialServiceId: uri.queryParameters['service'],
      initialTab: initialTab,
    );

CartScreen cartScreenFromUri(Uri uri) =>
    CartScreen(initialProductId: uri.queryParameters['add']);

ProductsScreen productsScreenFromUri(Uri uri) => ProductsScreen(
  initialQuery: uri.queryParameters['q'],
  initialCategory: uri.queryParameters['category'],
  initialStock: uri.queryParameters['status'] ?? uri.queryParameters['stock'],
  initialLocation: uri.queryParameters['location'],
  initialConstituency: uri.queryParameters['constituency'],
  initialDistrict: uri.queryParameters['district'],
  initialState: uri.queryParameters['state'],
  initialLatitude: double.tryParse(uri.queryParameters['latitude'] ?? ''),
  initialLongitude: double.tryParse(uri.queryParameters['longitude'] ?? ''),
  initialRadiusKm: int.tryParse(uri.queryParameters['radius'] ?? ''),
  initialCourier: uri.queryParameters['courier'] == 'true',
  initialSort: uri.queryParameters['sort'],
);

ServicesScreen servicesScreenFromUri(Uri uri) => ServicesScreen(
  initialQuery: uri.queryParameters['q'],
  initialLocation: uri.queryParameters['location'],
  initialConstituency: uri.queryParameters['constituency'],
  initialDistrict: uri.queryParameters['district'],
  initialState: uri.queryParameters['state'],
  initialLatitude: double.tryParse(uri.queryParameters['latitude'] ?? ''),
  initialLongitude: double.tryParse(uri.queryParameters['longitude'] ?? ''),
  initialRadiusKm: int.tryParse(uri.queryParameters['radius'] ?? ''),
  initialSort: uri.queryParameters['sort'],
);

final appRouterProvider = Provider<GoRouter>((ref) {
  final router = GoRouter(
    navigatorKey: _rootKey,
    initialLocation: '/splash',
    debugLogDiagnostics: false,
    redirect: (context, state) {
      final session = ref.read(sessionProvider);
      final path = state.uri.path;
      if (!session.restoring &&
          !session.authenticated &&
          routeRequiresAuthentication(path)) {
        final returnTo = Uri.encodeQueryComponent(state.uri.toString());
        return '/login?returnTo=$returnTo';
      }
      if (session.authenticated && path == '/login') {
        return customerAuthDestination(state.uri.queryParameters['returnTo']);
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        parentNavigatorKey: _rootKey,
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/onboarding',
        parentNavigatorKey: _rootKey,
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(
        path: '/login',
        parentNavigatorKey: _rootKey,
        builder: (context, state) =>
            LoginScreen(returnTo: state.uri.queryParameters['returnTo']),
      ),
      GoRoute(
        path: '/otp',
        parentNavigatorKey: _rootKey,
        builder: (context, state) => OtpScreen(
          phone: state.extra as String? ?? '',
          returnTo: state.uri.queryParameters['returnTo'],
        ),
      ),
      GoRoute(
        path: '/email-verify',
        parentNavigatorKey: _rootKey,
        builder: (context, state) => EmailVerificationScreen(
          email: state.extra as String? ?? '',
          returnTo: state.uri.queryParameters['returnTo'],
        ),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, shell) =>
            CustomerShell(navigationShell: shell),
        branches: [
          StatefulShellBranch(
            navigatorKey: _homeKey,
            routes: [
              GoRoute(
                path: '/home',
                builder: (context, state) => const HomeScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _searchKey,
            routes: [
              GoRoute(
                path: '/search',
                builder: (context, state) => searchScreenFromUri(state.uri),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _savedKey,
            routes: [
              GoRoute(
                path: '/saved',
                builder: (context, state) => const SavedScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _messagesKey,
            routes: [
              GoRoute(
                path: '/messages',
                builder: (context, state) => const ConversationsScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _accountKey,
            routes: [
              GoRoute(
                path: '/account',
                builder: (context, state) => const AccountScreen(),
              ),
            ],
          ),
        ],
      ),
      GoRoute(
        path: '/categories',
        builder: (context, state) => const CategoriesScreen(),
      ),
      GoRoute(
        path: '/businesses',
        builder: (context, state) => const SearchScreen(),
      ),
      GoRoute(
        path: '/category/:slug',
        builder: (context, state) =>
            CategoryScreen(slug: state.pathParameters['slug']!),
      ),
      GoRoute(
        path: '/products',
        builder: (context, state) => productsScreenFromUri(state.uri),
      ),
      GoRoute(
        path: '/product/:id',
        builder: (context, state) =>
            ProductDetailScreen(id: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/products/:id',
        builder: (context, state) =>
            ProductDetailScreen(id: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/services',
        builder: (context, state) => servicesScreenFromUri(state.uri),
      ),
      GoRoute(
        path: '/services/:id',
        builder: (context, state) =>
            ServiceDetailScreen(id: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/offers',
        builder: (context, state) => const OffersScreen(),
      ),
      GoRoute(
        path: '/offers/:city',
        builder: (context, state) =>
            OffersScreen(city: state.pathParameters['city']),
      ),
      GoRoute(path: '/jobs', builder: (context, state) => const JobsScreen()),
      GoRoute(
        path: '/jobs/:id/apply',
        builder: (context, state) =>
            JobApplicationScreen(id: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/jobs/:id',
        builder: (context, state) =>
            JobDetailScreen(id: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/bookings',
        builder: (context, state) => bookingsScreenFromUri(state.uri),
      ),
      GoRoute(
        path: '/weekly-draw',
        builder: (context, state) => const WeeklyDrawsScreen(),
      ),
      GoRoute(
        path: '/locations',
        builder: (context, state) => const LocationsScreen(),
      ),
      GoRoute(
        path: '/compare',
        builder: (context, state) => const CompareBusinessesScreen(),
      ),
      GoRoute(
        path: '/help',
        builder: (context, state) => const HelpCenterScreen(),
      ),
      GoRoute(
        path: '/contact',
        builder: (context, state) => ContactSupportScreen(
          initialTopic: state.uri.queryParameters['topic'],
          initialMessage: state.uri.queryParameters['message'],
        ),
      ),
      GoRoute(
        path: '/report-abuse',
        builder: (context, state) => ContactSupportScreen(
          reportMode: true,
          initialTopic: 'Trust & safety',
          initialMessage: state.uri.queryParameters['business'] == null
              ? null
              : 'Report concerning ${state.uri.queryParameters['business']}: ',
        ),
      ),
      GoRoute(
        path: '/about',
        builder: (context, state) =>
            const InformationScreen(page: BncInformationPage.about),
      ),
      GoRoute(
        path: '/privacy',
        builder: (context, state) =>
            const InformationScreen(page: BncInformationPage.privacy),
      ),
      GoRoute(
        path: '/terms',
        builder: (context, state) =>
            const InformationScreen(page: BncInformationPage.terms),
      ),
      GoRoute(
        path: '/refunds',
        builder: (context, state) =>
            const InformationScreen(page: BncInformationPage.refunds),
      ),
      GoRoute(
        path: '/enquiry',
        builder: (context, state) {
          final extra = state.extra is Map
              ? Map<String, dynamic>.from(state.extra! as Map)
              : <String, dynamic>{};
          return EnquiryScreen(
            business: extra['business'] as Business?,
            product: extra['product'] as Product?,
            service: extra['service'] as Service?,
          );
        },
      ),
      GoRoute(
        path: '/enquiry/success',
        builder: (context, state) {
          final extra = state.extra;
          final data = extra is EnquirySuccessData
              ? extra
              : EnquirySuccessData(
                  enquiry: extra as Enquiry,
                  directBusiness: false,
                );
          return EnquirySuccessScreen(
            enquiry: data.enquiry,
            directBusiness: data.directBusiness,
          );
        },
      ),
      GoRoute(
        path: '/review/new',
        builder: (context, state) => ReviewEntryScreen(
          business: state.extra as Business?,
          businessSlug: state.uri.queryParameters['business'],
        ),
      ),
      GoRoute(
        path: '/messages/:id',
        builder: (context, state) => ChatScreen(
          conversationId: state.pathParameters['id']!,
          conversation: state.extra as Conversation?,
        ),
      ),
      GoRoute(
        path: '/notifications',
        builder: (context, state) => const NotificationsScreen(),
      ),
      GoRoute(
        path: '/cart',
        builder: (context, state) => cartScreenFromUri(state.uri),
      ),
      GoRoute(
        path: '/checkout',
        builder: (context, state) => const CheckoutScreen(),
      ),
      GoRoute(
        path: '/orders',
        builder: (context, state) => const OrdersScreen(),
      ),
      GoRoute(
        path: '/orders/:id',
        builder: (context, state) => OrderDetailScreen(
          id: state.pathParameters['id']!,
          initialOrder: state.extra as Order?,
        ),
      ),
      GoRoute(
        path: '/account/profile',
        builder: (context, state) => const ProfileEditScreen(),
      ),
      GoRoute(
        path: '/account/settings',
        builder: (context, state) => const AccountSettingsScreen(),
      ),
      GoRoute(
        path: '/account/history',
        builder: (context, state) => const HistoryScreen(),
      ),
      GoRoute(
        path: '/account/addresses',
        builder: (context, state) => const AddressesScreen(),
      ),
      GoRoute(
        path: '/account/privacy',
        builder: (context, state) => const PrivacyScreen(),
      ),
      GoRoute(
        path: '/account/enquiries',
        builder: (context, state) => const MyEnquiriesScreen(),
      ),
      GoRoute(
        path: '/account/enquiries/:id',
        builder: (context, state) =>
            EnquiryDetailScreen(id: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/account/job-applications',
        builder: (context, state) => const JobApplicationsScreen(),
      ),
      GoRoute(
        path: '/account/reviews',
        builder: (context, state) => const MyReviewsScreen(),
      ),
      GoRoute(
        path: '/account/blocked',
        builder: (context, state) => const BlockedBusinessesScreen(),
      ),
      GoRoute(
        path: '/account/support',
        builder: (context, state) => const SupportTicketsScreen(),
      ),
      GoRoute(
        path: '/account/bookings',
        builder: (context, state) =>
            bookingsScreenFromUri(state.uri, initialTab: 1),
      ),
      GoRoute(
        path: '/account/messages',
        builder: (context, state) => const ConversationsScreen(),
      ),
      GoRoute(
        path: '/business/:slug',
        builder: (context, state) =>
            BusinessProfileScreen(slug: state.pathParameters['slug']!),
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      appBar: AppBar(),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(30),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.explore_off_rounded, size: 54),
              const SizedBox(height: 16),
              Text(
                'This page is not nearby',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 8),
              Text('${state.error ?? state.uri}'),
              const SizedBox(height: 18),
              ElevatedButton(
                onPressed: () => context.go('/home'),
                child: const Text('Back to BNC'),
              ),
            ],
          ),
        ),
      ),
    ),
  );
  ref.listen<SessionState>(sessionProvider, (previous, next) {
    router.refresh();
  });
  ref.onDispose(router.dispose);
  return router;
});

bool routeRequiresAuthentication(String path) =>
    path == '/saved' ||
    path == '/messages' ||
    path == '/account' ||
    path.startsWith('/account/') ||
    path == '/notifications' ||
    path.startsWith('/messages/') ||
    path == '/review/new' ||
    path == '/checkout' ||
    path == '/orders' ||
    path.startsWith('/orders/');

bool routeRequiresAdministrator(String path) => false;

String authenticatedLandingRoute(UserProfile user) => '/home';
