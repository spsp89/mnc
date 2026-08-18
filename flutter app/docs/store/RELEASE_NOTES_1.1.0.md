# BNC mobile 1.1.0 (build 2)

Updated 14 August 2026.

## What changed

- Added the missing Jobs experience: browse jobs, view details, apply and review submitted applications.
- Added an auto-moving six-poster promotion rail above Home search.
- Moved Deals Around You directly below Home search.
- Added auto-scrolling Home rails with manual swipe support and reduced-motion accessibility.
- Changed recent searches and recently viewed businesses to horizontal history rails.
- Added weekly gifts, monthly draws and festival bumpers.
- Retained customer reward-ID claiming while keeping reward administration on the website.
- Retained salon, clinic, doctor and other simple appointment booking, rescheduling and cancellation.
- Synced constituency, district and state discovery context with the website so the API can apply plan-aware listing reach.
- Added privacy-safe recording of explicit signed-in searches for entitled business lead alerts.
- Added direct enquiry detail links with live response, close and conversation actions.
- Shows home delivery and enables delivery checkout only when the backend explicitly supports it; pickup-only products remain pickup-only.
- Respects plan-filtered public descriptions, social links and product delivery options without invented fallback content.
- Removed business-owner login and workspace routes from Flutter; owner and administrator features remain on the website.

## Not included

- Cinema/theatre ticket booking and seat selection are intentionally excluded from this build.
- Business-owner login, merchant management, Business Club, pricing and administrator tools are website-only.

## Test note to accompany the APK

“This customer-only build syncs the updated website discovery context, privacy-safe search intent, truthful delivery checkout and direct enquiry details. It also includes Jobs, appointment booking, the updated Home experience and the temporary `123456` phone OTP for shared testing. Business-owner/admin tools and cinema booking are not included.”

## Test artifact

- File: `releases/BNC-live-current.apk`
- SHA-256: `88db06445a2295637615b892aa84acd7ad77334ba6609f14fcf34358e0fba4dd`
- Signing: Android debug certificate, APK Signature Scheme v2
- Purpose: client testing only; this is not a store-signed release
