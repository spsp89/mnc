# Customer screen inventory

Last updated: 2026-08-15

The Flutter app is customer-only and uses live API records. Business-owner and
administrator routes remain website-only. `lib/app/router.dart` is the
authoritative route graph.

## Entry and authentication

| Route | Customer screen |
| --- | --- |
| `/splash` | Flat-blue BNC launch and session restore |
| `/onboarding` | Customer introduction, location permission and city choice |
| `/login` | Phone OTP or email registration/login |
| `/otp` | Phone verification |
| `/email-verify` | Email verification |

## Main customer shell

| Route | Customer screen |
| --- | --- |
| `/home` | Live customer home with business, offer, appointment, product, job and city discovery |
| `/search` | Text/voice search, filters, sorting, list/map view and hierarchical location context |
| `/saved` | Saved businesses, saved products and recently viewed |
| `/messages` | Customer conversations |
| `/account` | Customer account |

## Discovery and marketplace

| Route | Customer screen |
| --- | --- |
| `/categories`, `/products?category=:slug`, `/category/:slug` | Compact live category directory, product-first filtered results and the supported mixed-result route |
| `/businesses` | Location/query-aware business directory |
| `/business/:slug` | Public profile, membership benefits, trust/contact/chat actions and related businesses |
| `/compare` | Select and compare 2–3 live businesses |
| `/products`, `/product/:id`, `/products/:id` | Location-aware product directory/detail with category, stock, courier and website-equivalent sorting; truthful delivery, seller, cart and chat; plural detail path is a website-compatible alias |
| `/services`, `/services/:id` | Location-aware service directory/detail with top-rated sorting, provider and chat |
| `/offers`, `/offers/:city` | Location-aware offers and provider chat |
| `/locations` | Active cities, device location and exact coordinates |
| `/weekly-draw` | Weekly/monthly/festival draws, reward-ID claim, winners and audit information |
| `/jobs`, `/jobs/:id`, `/jobs/:id/apply` | Jobs, detail and public application |
| `/bookings` | Appointment providers, slots and customer bookings; accepts `q` and `service` context |

## Customer transactions and activity

| Route | Customer screen |
| --- | --- |
| `/enquiry`, `/enquiry/success` | Direct/matched enquiry flow and conversation handoff |
| `/account/enquiries`, `/account/enquiries/:id` | Enquiry list/direct detail, responses, close and chat |
| `/messages/:id` | Exact customer conversation |
| `/account/job-applications` | Authenticated application history |
| `/review/new`, `/account/reviews` | Review creation/history/edit/delete |
| `/cart`, `/checkout` | Cart, minimum quantities and checkout |
| `/orders`, `/orders/:id` | Order history/detail, timeline, cancel/return/invoice |
| `/notifications` | Customer inbox, safe destinations and preferences |
| `/account/bookings`, `/account/messages` | Website-compatible aliases opening My bookings and customer conversations |

## Account, support and policy

| Route | Customer screen |
| --- | --- |
| `/account/profile` | Profile editing |
| `/account/settings` | Language, city and default radius |
| `/account/history` | Shared search-history replay/clear and recent businesses |
| `/account/addresses` | Saved-address add/edit/remove |
| `/account/blocked` | Blocked-business management |
| `/account/support` | Signed-in support request history and status |
| `/account/privacy` | Sessions, consent records, export and account deletion |
| `/help`, `/contact`, `/report-abuse` | Support/trust and ticket submission |
| `/about`, `/privacy`, `/terms`, `/refunds` | Static customer policy content |

## Navigation and scope rules

- Public discovery, profiles, products, services, offers, jobs, locations,
  support and weekly draws can load without login where the API permits it.
- Customer mutations and private records use safe authentication guards with a
  route-specific `returnTo`.
- `/saved`, `/messages`, `/account` and their nested routes are protected.
- Every authenticated identity lands on `/home`. Business-owner and
  administrator authentication/management paths are rejected as website-only;
  the public customer `/business/:slug` profile remains supported.
- `bnc://app` remains registered for local deep-link verification.
- Native status/navigation bars stay visible; Flutter is not forced into
  full-screen mode.
- iPhone Simulator must not be used for project verification. Android emulator
  use is opt-in; default handoff is source checks plus an APK.
