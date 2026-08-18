"use client";

const configuredBasePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "")
  .trim()
  .replace(/\/+$/, "");

export function appPath(path: string): string {
  if (!path.startsWith("/")) {
    throw new Error("Application paths must start with a slash.");
  }
  if (
    !configuredBasePath ||
    path === configuredBasePath ||
    path.startsWith(`${configuredBasePath}/`)
  ) {
    return path;
  }
  return `${configuredBasePath}${path}`;
}

export async function readJsonResponse<T>(
  response: Response,
  fallback: string,
): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      response.ok
        ? fallback
        : "The website returned an unexpected response. Please reload and try again.",
    );
  }
}
