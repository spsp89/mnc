export async function getRuntimeBindings<T extends object>(): Promise<T> {
  if (process.env.VERCEL === "1") {
    return process.env as unknown as T;
  }

  const cloudflareModule = "cloudflare:workers";
  try {
    const runtime = await import(/* webpackIgnore: true */ cloudflareModule) as { env: T };
    return runtime.env;
  } catch {
    return process.env as unknown as T;
  }
}
