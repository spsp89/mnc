# BNC mobile architecture decisions

## One Flutter application

Android and iOS share the Dart features, models, state, repository, design
system, and navigation. Native projects contain platform permissions, signing,
deep links, splash resources, and provider integration.

## Feature-first presentation and narrow core

`lib/features` owns screens and feature-local providers. `lib/core` contains
cross-cutting configuration, networking, storage, state, models, and the API
repository. Shared visual primitives live in `lib/design_system`.

Riverpod owns dependency injection and asynchronous state. GoRouter owns
URL-addressable customer navigation and authentication guards. Owner and
administrator workspaces are intentionally website-only.

## Live-only repository boundary

Screens call one `AppRepository`, which maps NestJS `/api/v1` responses into
domain models. There is no environment switch for local records and no network
fallback dataset. Errors remain visible and retryable.

Customer jobs, appointments, weekly draws, saved items, recently viewed
profiles, business comparison, review history and conversations use live
contracts. Owner/admin contracts can remain in the shared backend without
becoming mobile routes.

The website and Flutter share customer data only when both target the same
deployed NestJS `/api/v1` prefix and database. Repository co-location alone
does not synchronize website-local React state. Cross-client behavior such as
search history must use an explicit shared API contract.

## Customer-only route boundary

`lib/app/router.dart` is the authoritative mobile product boundary. It exposes
customer discovery, transactions, messages and account routes only. There is
no owner/admin landing page, shell, role switch or route. Old owner-oriented
presentation files and repository methods are unreachable legacy code and do
not make those workspaces mobile capabilities.

Authentication guards cover exact root destinations such as `/saved`,
`/messages` and `/account` as well as their nested routes. A protected action
keeps a sanitized route-specific `returnTo` so the customer resumes the
original workflow after login.

## Session and API safety

- Access/refresh tokens and the serialized user live in secure storage.
- Preferences contain non-secret locale, location, onboarding, and recent
  presentation state. Authenticated search history itself is server-backed so
  the website and app can share it.
- Requests carry an `x-request-id`.
- Structured errors retain code, details, status, and request ID.
- 401 refresh is single-flight and a request retries only once.
- A failed refresh clears the session.

## Commerce and payments

The cart is local UI state. Order creation sends product IDs and quantities;
the server rechecks price and stock. Checkout requires a provider key and
server-created order. The client does not generate a successful payment result.
Only the signed provider webhook can confirm payment.

## Trust semantics

Verification, premium subscription, and sponsored placement are independent
states. Enquiry contact sharing requires explicit consent. Verification
evidence uses a private object key and is never rendered as a public URL.

Business distance is nullable and must remain absent when the API cannot
calculate it. Availability is displayed only from explicit state or usable
published working hours. BNC star level, plan name and permanent customer
discount are separate API fields and are never inferred from a missing value.

## Search and location semantics

The customer search state carries mode, query, sorting, filters, city,
coordinates and radius. Known cities can map to known coordinates. A precise
or current location omits a misleading city text filter, and an unknown city
never reuses coordinates from another city.

Explicit authenticated searches are recorded through
`POST /users/me/search-history`; debounced intermediate input is not. A history
record can reconstruct the original search context.

Voice input uses the device speech recognizer through `speech_to_text`.
English and Malayalam locales are selected from installed recognizer locales
with a safe fallback. Permission denial, recognizer unavailability and
recognition errors remain visible; the app never inserts a canned phrase.

## Localization and accessibility

English and Malayalam ARB files are compiled by Flutter tooling. Interactive
components provide Material semantics, readable contrast, native system bars,
large touch targets, and loading/error/empty states.

Android declares `RECORD_AUDIO` plus a speech-recognition service query. iOS
declares microphone and speech-recognition usage descriptions. Native system
bars remain visible; the app is not forced into full-screen mode.
