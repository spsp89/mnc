import { NextResponse } from "next/server";

const forwardedHeaders = [
  "content-type",
  "x-amz-checksum-sha256",
  "x-amz-meta-bnc-business",
  "x-amz-meta-bnc-owner",
  "x-amz-meta-bnc-purpose",
  "x-amz-server-side-encryption",
] as const;

export async function PUT(request: Request) {
  const rawTarget = request.headers.get("x-bnc-local-upload-target");
  const configuredEndpoint = process.env.OBJECT_STORAGE_ENDPOINT;
  if (!rawTarget || !configuredEndpoint) {
    return NextResponse.json({ message: "Local media storage is not configured." }, { status: 503 });
  }

  let target: URL;
  let endpoint: URL;
  try {
    target = new URL(rawTarget);
    endpoint = new URL(configuredEndpoint);
  } catch {
    return NextResponse.json({ message: "The local upload destination is invalid." }, { status: 400 });
  }

  if (target.origin !== endpoint.origin || !["127.0.0.1", "localhost"].includes(endpoint.hostname)) {
    return NextResponse.json({ message: "The upload destination is not an allowed local store." }, { status: 403 });
  }

  const headers = new Headers();
  for (const name of forwardedHeaders) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  try {
    const upstream = await fetch(target, {
      method: "PUT",
      headers,
      body: await request.arrayBuffer(),
    });
    if (!upstream.ok) {
      return NextResponse.json(
        { message: `Local media storage rejected the upload (${upstream.status}).` },
        { status: upstream.status },
      );
    }
    return new NextResponse(null, { status: upstream.status });
  } catch {
    return NextResponse.json({ message: "The local media store could not be reached." }, { status: 502 });
  }
}
