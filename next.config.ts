import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() || "";
const allowHttp = process.env.BNC_ALLOW_HTTP === "true";
const allowDevelopmentEval = process.env.NODE_ENV !== "production";
const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  {
    protocol: "https",
    hostname: "images.unsplash.com",
    pathname: "/**",
  },
];

try {
  const storageUrl = process.env.OBJECT_STORAGE_PUBLIC_URL
    ? new URL(process.env.OBJECT_STORAGE_PUBLIC_URL)
    : null;
  if (storageUrl && ["http:", "https:"].includes(storageUrl.protocol)) {
    remotePatterns.push({
      protocol: storageUrl.protocol.slice(0, -1) as "http" | "https",
      hostname: storageUrl.hostname,
      port: storageUrl.port,
      pathname: "/**",
    });
  }
} catch {
  // Runtime environment validation reports malformed storage URLs.
}

const nextConfig: NextConfig = {
  basePath,
  images: {
    remotePatterns,
    minimumCacheTTL: 86400,
  },
  async headers() {
    const securityHeaders = [
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "base-uri 'self'",
          "connect-src 'self' https:",
          "font-src 'self' data:",
          "form-action 'self'",
          "frame-ancestors 'none'",
          "frame-src https://www.openstreetmap.org https://api.razorpay.com https://checkout.razorpay.com",
          "img-src 'self' data: blob: https:",
          "object-src 'none'",
          `script-src 'self' 'unsafe-inline'${allowDevelopmentEval ? " 'unsafe-eval'" : ""} https://checkout.razorpay.com`,
          "style-src 'self' 'unsafe-inline'",
          ...(allowHttp ? [] : ["upgrade-insecure-requests"]),
        ].join("; "),
      },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(self)" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
    ];
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
