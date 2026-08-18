# Testing, accessibility and performance

## Automated checks

Run from the repository root:

```bash
npm run lint
npm run typecheck
DIRECT_DATABASE_URL=postgresql://bnc:bnc_dev_password@localhost:5432/bnc npm run prisma:validate
npm run api:test
npm test
```

The web integration suite imports the built Cloudflare worker and performs HTTP requests against it. It verifies:

- production server rendering and branded content;
- CSP and MIME security headers;
- search, profile, product, service, city/category, offers and Malayalam routes;
- sitemap, robots and manifest output;
- secure redirect of anonymous account access;
- branded 404 semantics.

The API unit suite verifies AES-GCM round trips/tamper rejection, deterministic privacy fingerprints, Razorpay raw-body signatures, durable event persistence, duplicate webhook acknowledgement and asynchronous queuing.

## Manual release smoke test

1. Search `laptop repair` in Kochi and widen/narrow the radius.
2. Apply rating, verified, price, language and sort options.
3. Switch between list and map.
4. Open a business, expand media, save/share and submit a consented enquiry.
5. Switch to Malayalam and return to English.
6. Verify mobile OTP in a development stack, add the participating charger to cart, apply `LOCAL10`, and open test checkout.
7. Confirm a signed test webhook updates the payment and order history.
8. Accept a matched lead as the seeded Fixora owner and confirm contact is unavailable before acceptance.
9. Complete a verification decision as an authorized admin and inspect the appended audit record.
10. Disconnect the network after one visit and confirm `/offline` is usable.

## Accessibility acceptance

- All flows are keyboard reachable with a visible focus ring.
- Controls use semantic buttons/links and labelled inputs.
- Dialogs expose a name and modal state.
- Status, error and loading messages use appropriate live semantics.
- Images have useful alt text; decorative thumbnails use an empty alt.
- Text and controls target WCAG AA contrast.
- Mobile layouts preserve touch spacing and do not rely on hover.
- Motion is restrained; the loading animation respects the global reduced-motion treatment.

## Performance targets

The release target is a Lighthouse performance score above 90 on representative public pages. Validate homepage, search and a business profile against a production build on a throttled mobile profile. Track LCP, CLS and INP rather than only the aggregate score.

The implementation uses server rendering, optimized responsive images, route-level loading, long image cache TTL, limited client state and content rails on small screens. Production should serve approved media through a CDN and cache stable category/location suggestions in Redis.
