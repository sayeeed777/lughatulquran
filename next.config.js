const isProd = process.env.NODE_ENV === "production";

const buildCsp = () => {
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    // Next.js App Router emits inline scripts; keep this strict elsewhere, but allow inline in prod.
    "script-src 'self' 'unsafe-inline'",
    "connect-src 'self'",
    "media-src 'self' https://everyayah.com https://audio.qurancdn.com",
    "worker-src 'self'",
    "manifest-src 'self'"
  ];

  return directives.join("; ");
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  headers: async () => {
    const headers = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" }
    ];

    if (isProd) {
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload"
      });
      headers.push({
        key: "Content-Security-Policy",
        value: buildCsp()
      });
    }

    return [
      {
        source: "/(.*)",
        headers
      }
    ];
  }
};

export default nextConfig;
