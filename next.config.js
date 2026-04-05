const isProd = process.env.NODE_ENV === "production";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/api/audio-timings/[reciter]/[surah]": ["./app/data/audio-timings/**/*.json"],
    "/api/lexicon/root/[root]": ["./app/data/root-explorer/**/*.json"]
  },
  redirects: async () => [
    {
      source: "/bn/:path*",
      destination: "/:path*",
      permanent: true
    },
    {
      source: "/ur/:path*",
      destination: "/:path*",
      permanent: true
    },
    {
      source: "/bn",
      destination: "/",
      permanent: true
    },
    {
      source: "/ur",
      destination: "/",
      permanent: true
    }
  ],
  headers: async () => {
    /* CSP is handled by proxy.ts middleware with proper nonces in production.
       Only non-CSP security headers are set here. */
    const headers = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(), interest-cohort=()" }
    ];

    if (isProd) {
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload"
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
