const isProd = process.env.NODE_ENV === "production";

/* A fixed policy (no per-request nonce) so pages can be prerendered at build
   time and served from the CDN without running a function. Next.js's inline
   bootstrap scripts then need 'unsafe-inline'. */
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self' data: https://verses.quran.foundation https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self' https://vitals.vercel-insights.com https://api.quran.com",
  "media-src 'self' https://everyayah.com https://audio.qurancdn.com https://download.quranicaudio.com",
  "worker-src 'self'",
  "manifest-src 'self'"
].join("; ");

const CANONICAL_ORIGIN = "https://openfurqan.com";
const LEGACY_PRODUCTION_HOSTS = ["www.openfurqan.com", "quranbeta.vercel.app"];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/api/audio-timings/[reciter]/[surah]": ["./app/data/audio-timings/**/*.json"],
    "/api/lexicon/root/[root]": ["./app/data/root-explorer/**/*.json"]
  },
  redirects: async () => [
    ...LEGACY_PRODUCTION_HOSTS.map((host) => ({
      source: "/:path*",
      has: [{ type: /** @type {const} */ ("host"), value: host }],
      destination: `${CANONICAL_ORIGIN}/:path*`,
      permanent: true
    })),
    // Locale prefixes all collapse to the English root. The bare prefixes must
    // come first: "/en/:path*" also matches "/en" and yields an empty Location.
    ...["en", "bn", "ur"].flatMap((locale) => [
      {
        source: `/${locale}`,
        destination: "/",
        permanent: true
      },
      {
        source: `/${locale}/:path*`,
        destination: "/:path*",
        permanent: true
      }
    ])
  ],
  headers: async () => {
    const headers = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(), interest-cohort=()" }
    ];

    if (isProd) {
      headers.push(
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload"
        },
        { key: "Content-Security-Policy", value: contentSecurityPolicy }
      );
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
