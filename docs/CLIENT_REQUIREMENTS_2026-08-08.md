# Client requirements implementation — 8 August 2026

This document is the acceptance checklist for the translated client feedback. Cinema and theatre seat/ticket booking is explicitly excluded from this release at the client’s direction.

## Delivered in this implementation

| Requirement | Website | Flutter app | Backend / rule |
| --- | --- | --- | --- |
| Jobs in the app | Existing public and merchant job workspaces retained | Jobs discovery, detail, application and application history are routed and visible | Live job publishing, application and moderation contracts |
| Top poster rail | Six-item, auto-advancing promotional poster rail above search | Six-item auto-advancing promotion carousel above search | Built from live offers and businesses; media records are type-aware for later video activation |
| Search then deals | Deals Around You now follows the hero/search immediately | Deals follows the search header immediately | Uses live active offers |
| Auto-moving horizontal content | Homepage horizontal rails advance automatically and retain manual controls | Homepage rails advance automatically, pause for manual use and respect reduced-motion settings | No fabricated fallback records |
| Horizontal history | Website history remains horizontally browsable | Recent searches and recently viewed businesses are horizontal | Shared live history APIs remain authoritative |
| Customer ↔ merchant chat | Existing protected BNC conversation workspace retained | Existing protected conversations and messages retained | Server conversation membership and message persistence |
| Merchant workspace | Existing dashboard retained | Owner role now lands in a five-tab merchant workspace | Role and per-business permission checks remain server-side |
| Orders and cancellation | Customer and merchant order workspaces retained | Customer cancellation and merchant fulfilment transitions retained | Valid transition rules prevent unsafe state changes |
| Delivery partner workflow | Existing merchant delivery console retained | Merchant delivery management route restored | Quote, dispatch, tracking, proof and settlement contracts |
| Digital business card | Every public business profile now exposes a downloadable vCard | Every public profile is shareable; owner editor labels social links as the digital business card | Generated from the current verified public profile, never a separate stale record |
| Social/video profile links | Owner can add Facebook, Instagram, YouTube, LinkedIn, X and TikTok | Owner can progressively add the same six links | API validates URL protocols and enforces a maximum of six |
| Lead/enquiry/referral graphs | Existing owner analytics and admin consoles retained | Merchant dashboard shows calls, chat/WhatsApp and enquiry performance | Owner summary and BNC platform summary use live analytics events |
| Plan-based BNC Stars | Explicit `BNC N Stars` badges retained | Explicit BNC star level and plan benefits retained | Subscription plan `starLevel` is authoritative from 0–6; Ruby can be configured at 6 |
| Business Club | Private chapter chat, member directory, events and referrals | Private club chapter/workspace routes restored | Only 5–6 star plans; room capacity is enforced at 16; total shops and club membership counts are exposed |
| Weekly gifts and festival bumpers | Customer reward page and admin creation support weekly, monthly and festival types | Reward list supports all draw types | Draw kind, occasion and minimum purchase are persisted |
| ₹200 unique draw ID | Merchant order console generates and copies a one-time ID | Merchant order screen generates and copies the ID; customer draw screen claims it | IDs are stored as HMAC hashes, are one-time claimable and enter the audited draw only after claim |
| Direct merchant payment | Public profile displays the merchant UPI QR and account display name | Public profile displays the same UPI QR and can open a UPI app | BNC does not collect or hold these funds; payment details are merchant controlled |
| Simple appointments | Existing provider/service booking retained | Doctor, clinic, salon and other appointment flows retained | Provider schedule, time-off, slot, reschedule and cancellation contracts |
| APK release notes | Not applicable | Version advanced to `1.1.0+2`; release notes added | Release checklist requires a note with every APK |

## Explicitly excluded

- Cinema/theatre listings, auditorium layouts, seat selection and ticket booking.
- BNC custody of direct merchant/customer payments.

## Production configuration notes

- Set a strong `DRAW_CODE_SECRET` on the API. It may be rotated only with a planned invalidation of unclaimed reward IDs.
- Apply Prisma migrations before enabling merchant reward issuance or the 16-member Business Club rule.
- Business images/documents continue to use S3-compatible object storage; verification evidence must remain private.
- Promotional video playback is intentionally not activated in this release. The current media records are type-aware, so a later admin uploader/player can be introduced without changing the homepage ordering contract.
