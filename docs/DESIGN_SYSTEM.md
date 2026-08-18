# BNC design system

## Brand

BNC stands for **Business Near & Close**. The visual identity is calm, direct and local: white surfaces, royal blue actions, sky-blue discovery areas, charcoal text, green verification states and restrained warm colour for offers.

## Tokens

- Brand blue: `#0F48D8`
- Deep blue: `#07216D`
- Sky surface: `#F1F6FF`
- Ink: `#15213D`
- Muted text: `#67728A`
- Verification green: `#147A50`
- Offer orange: `#B94C12`
- Border: `#E3E8F2`

Core radii are 12, 18, 26 and 34 pixels. Shadows are soft and reserved for floating search, popovers and elevated decision cards.

## Interaction rules

- Every control has a visible focus state and a minimum comfortable touch target on mobile.
- Motion is short, functional and disabled through `prefers-reduced-motion`.
- Sponsored listings are labelled; verification and rating are never conflated.
- Forms explain consent at the point of collection.
- Desktop grids become horizontally scrollable rails only where browsing benefits from continuity.
- Mobile retains persistent navigation and context-specific contact actions.

## Typography

Geist is loaded once through `next/font`. Headings use tight tracking and compact line height; body text uses generous line height. Malayalam content remains readable through the system Malayalam fallback.

## Components

The shared web component library includes the global search, location selector, category, business, product, offer and review cards, ratings, filter sheet, enquiry form, badges, responsive shell, mobile navigation and dashboard tables.

