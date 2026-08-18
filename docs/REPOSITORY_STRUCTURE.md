# Repository structure

```text
.
├── app/                     Next.js App Router routes and hosted route handlers
├── components/              Shared responsive web components
├── db/                      Sites D1 schema and access helper
├── drizzle/                 Generated D1 migrations
├── lib/                     Search, types, demo records and utilities
├── apps/
│   └── api/                 NestJS REST API and Prisma production backend
├── packages/
│   └── contracts/           Framework-neutral API contracts
├── docs/                    Architecture, operations and product evidence
├── tests/                   Web rendered-output and behaviour tests
├── worker/                  Vinext Cloudflare Worker entry
├── docker-compose.yml       Local infrastructure
└── .openai/hosting.json     Sites logical D1/R2 bindings
```

