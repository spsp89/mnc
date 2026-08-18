# BNC identity, roles, and portal architecture

Updated: 7 August 2026

## One identity, three portals

BNC uses one `User` identity and one sign-in system. A person does not need
separate passwords for customer, business, and administration work.

- Customer portal: `/account`
- Business portal: `/business/dashboard`
- Administration portal: `/admin`

The Next.js application exchanges credentials with the NestJS API through
same-origin route handlers. Access and refresh tokens are stored in
`HttpOnly`, `SameSite=Lax` cookies and are not exposed to browser JavaScript.
All state-changing Next.js API requests also pass a strict same-origin check
in `proxy.ts` to prevent cross-site form submissions.

## Authorization layers

Global roles are assigned in `GlobalRoleAssignment`. They control
platform-wide administration:

- `SUPER_ADMIN`
- `STATE_ADMIN`
- `DISTRICT_ADMIN`
- `AREA_MANAGER`
- `VERIFICATION`
- `MODERATOR`
- `SUPPORT`
- `SALES`
- `FINANCE`

Business access is scoped to an individual business through `BusinessMember`.
The owner always has full access. Team roles are:

| Business role | Default access |
|---|---|
| Owner | All workspace capabilities |
| Administrator | All workspace capabilities |
| Manager | Profile, catalogue, leads, orders, and analytics |
| Catalogue editor | Products and services |
| Lead agent | Leads, enquiries, messages, and orders |
| Viewer | Read-only workspace and analytics |

The API checks a capability on every protected business mutation. Supplying a
different `businessId` is not enough to access another business.

## Product publishing workflow

1. An owner or catalogue editor creates a product.
2. The product is stored as `DRAFT` and is not public.
3. The business submits the product, changing it to `SUBMITTED`.
4. An administrator or moderator publishes or rejects it.
5. Only `PUBLISHED` products appear in public catalogue and order APIs.

Product states are `DRAFT`, `SUBMITTED`, `PUBLISHED`, `REJECTED`, and
`ARCHIVED`.

## Business onboarding and team access

- A signed-in customer can create their first draft business at
  `/business/add`.
- The creator becomes the `BusinessOwner`.
- Business verification and public activation remain separate review steps.
- The owner manages colleagues at `/business/team`.
- A colleague must first create and verify their own BNC account.
- Passwords are never shared.
- Deactivating a team member removes their business conversation memberships.
- Team membership changes are written to the chained audit log.

## Administrator bootstrap

Admin registration is deliberately not public. Create and verify the intended
user through the normal email flow, then grant the role from a trusted server
shell:

```bash
cd '/path/to/bnc'

DATABASE_URL='postgresql://...' \
  npm run admin:grant -- \
  --email admin@example.com \
  --role SUPER_ADMIN \
  --reason 'Initial BNC platform administrator' \
  --confirm
```

The command:

- accepts only administrative roles;
- requires an active, email-verified account;
- requires an audit reason;
- requires an explicit `--confirm`;
- creates or reactivates the role assignment; and
- writes the change to `AuditLog`.

Never expose this command as a public API or run it from the browser.

## Required deployment order

1. Back up PostgreSQL.
2. Upload the code without deleting unrelated server files.
3. Install locked dependencies with `npm ci`.
4. Run `npm run prisma:generate`.
5. Run `npx prisma migrate deploy` from `apps/api`.
6. Build the API and web application.
7. Restart the isolated BNC services.
8. Verify login, business creation, product submission, moderation, and team
   revocation.

The migration
`20260807090000_identity_roles_and_product_workflow` must be applied before
starting this version of the API.

## Server-side web configuration

Set `BNC_API_URL` to the private/internal NestJS API base URL. For example:

```text
BNC_API_URL=http://127.0.0.1:4000/api/v1
```

`NEXT_PUBLIC_BNC_API_URL` remains useful for public client-side data requests,
but authentication and protected mutations use the server-side
`BNC_API_URL`.

## Security verification

- Customer credentials cannot open `/admin`.
- A business user without a workspace is routed to `/business/add`.
- A viewer cannot edit products, subscriptions, billing, or team access.
- A catalogue editor cannot access billing or team management.
- A lead agent cannot manage the product catalogue.
- An archived or rejected product cannot be ordered publicly.
- Removing a team member blocks future protected API access.
- Tokens are absent from `localStorage` and `sessionStorage`.
- Refresh tokens rotate through the existing API refresh flow.
