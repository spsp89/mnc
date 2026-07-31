const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_REQUESTS = 5;
const RATE_WINDOW_MS = 15 * 60 * 1000;

const attempts = new Map<string, number[]>();

function value(input: unknown) {
  return typeof input === "string" ? input.trim() : "";
}

function isRateLimited(key: string) {
  const now = Date.now();
  const recent = (attempts.get(key) || []).filter(
    (timestamp) => now - timestamp < RATE_WINDOW_MS,
  );
  recent.push(now);
  attempts.set(key, recent);
  return recent.length > MAX_REQUESTS;
}

export async function POST(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientKey = forwardedFor?.split(",")[0]?.trim() || "local";

  if (isRateLimited(clientKey)) {
    return Response.json(
      { message: "Too many attempts. Please wait before trying again." },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ message: "Invalid enquiry." }, { status: 400 });
  }

  if (value(body.website)) {
    return Response.json({ message: "Thank you. Your enquiry has been received." });
  }

  const startedAt = Number(value(body.startedAt));
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < 2500) {
    return Response.json(
      { message: "Please take a moment to complete the form." },
      { status: 400 },
    );
  }

  const enquiry = {
    name: value(body.name),
    email: value(body.email),
    company: value(body.company),
    service: value(body.service),
    challenge: value(body.challenge),
    timeline: value(body.timeline),
    consent: value(body.consent),
  };

  if (
    enquiry.name.length < 2 ||
    !EMAIL_PATTERN.test(enquiry.email) ||
    enquiry.company.length < 2 ||
    !enquiry.service ||
    enquiry.challenge.length < 20 ||
    enquiry.challenge.length > 1500 ||
    !enquiry.timeline ||
    enquiry.consent !== "yes"
  ) {
    return Response.json(
      { message: "Please complete all required fields correctly." },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL || "hello@misbahsalam.com";

  if (!apiKey || !from) {
    return Response.json(
      {
        message:
          "Online enquiries are temporarily unavailable. Please use the email option below.",
      },
      { status: 503 },
    );
  }

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: enquiry.email,
      subject: `Strategy enquiry from ${enquiry.name} · ${enquiry.company}`,
      text: [
        `Name: ${enquiry.name}`,
        `Email: ${enquiry.email}`,
        `Company: ${enquiry.company}`,
        `Service: ${enquiry.service}`,
        `Timeline: ${enquiry.timeline}`,
        "",
        "Challenge:",
        enquiry.challenge,
      ].join("\n"),
    }),
  });

  if (!emailResponse.ok) {
    return Response.json(
      { message: "Your enquiry could not be sent. Please use email instead." },
      { status: 502 },
    );
  }

  return Response.json({ message: "Your enquiry has been sent." });
}
