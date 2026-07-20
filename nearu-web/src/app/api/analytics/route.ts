import { NextRequest, NextResponse } from "next/server";

import { isAnalyticsEventType, recordAnalyticsEvent } from "@/lib/catalog";

const sessionCookieName = "nearu_analytics_session";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      businessSlug?: unknown;
      eventType?: unknown;
      source?: unknown;
      metadata?: unknown;
    };
    const businessSlug = typeof body.businessSlug === "string" ? body.businessSlug.trim() : "";
    const eventType = typeof body.eventType === "string" ? body.eventType.trim() : "";
    const source = typeof body.source === "string" ? body.source.trim() : "unknown";

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(businessSlug)) {
      return NextResponse.json({ ok: false, error: "Invalid business slug." }, { status: 400 });
    }

    if (!isAnalyticsEventType(eventType)) {
      return NextResponse.json({ ok: false, error: "Invalid event type." }, { status: 400 });
    }

    const sessionId = request.cookies.get(sessionCookieName)?.value || crypto.randomUUID();
    const result = await recordAnalyticsEvent({
      businessSlug,
      eventType,
      source,
      metadata: safeMetadata(body.metadata),
      sessionId,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.message }, { status: 400 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(sessionCookieName, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 180,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

function safeMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}
