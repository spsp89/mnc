import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export function GET() { return authenticatedApiRequest("/subscriptions/plans"); }
