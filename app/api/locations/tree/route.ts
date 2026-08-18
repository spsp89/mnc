import { apiRequest } from "@/lib/session-config";
export function GET() { return apiRequest("/locations/tree"); }
