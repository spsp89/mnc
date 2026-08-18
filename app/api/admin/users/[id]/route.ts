import { authenticatedApiRequest } from "@/lib/authenticated-api-route";

export function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return params.then(({ id }) => authenticatedApiRequest(`/admin/users/${encodeURIComponent(id)}`));
}
