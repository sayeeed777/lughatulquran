const isProd = process.env.NODE_ENV === "production";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  headers: async () => {
    const headers = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
      {
        key: "Content-Security-Policy-Report-Only",
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https:",
          "font-src 'self' https://fonts.gstatic.com https://verses.quran.foundation",
          "connect-src 'self' https://api.quran.com https://api.alquran.cloud https://api.quranpedia.net https://audio.qurancdn.com https://everyayah.com https://cdn.jsdelivr.net https://cdn.statically.io https://raw.githubusercontent.com",
          "media-src 'self' https://audio.qurancdn.com https://everyayah.com",
          "frame-src 'none'",
          "base-uri 'self'",
          "form-action 'self'"
        ].join("; ")
      }
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
