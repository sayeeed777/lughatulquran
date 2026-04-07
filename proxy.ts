import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  localeFromPathname
} from "./app/lib/locales";

const createNonce = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
};

const buildCsp = (nonce: string) =>
  [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob:",
    "font-src 'self' data: https://verses.quran.foundation https://cdn.jsdelivr.net",
    `style-src 'self' 'nonce-${nonce}'`,
    `script-src 'self' 'nonce-${nonce}'`,
    "connect-src 'self' https://vitals.vercel-insights.com https://api.quran.com",
    "media-src 'self' https://everyayah.com https://audio.qurancdn.com https://download.quranicaudio.com",
    "worker-src 'self'",
    "manifest-src 'self'"
  ].join("; ");

const CANONICAL_HOST = "openfurqan.com";
const LEGACY_PRODUCTION_HOSTS = new Set([
  "www.openfurqan.com",
  "quranbeta.vercel.app"
]);
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const setLocaleCookie = (response: NextResponse, locale: string) => {
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
};

export function proxy(request: NextRequest) {
  const { hostname, pathname } = request.nextUrl;
  const localeFromPath = localeFromPathname(pathname);

  // These endpoints are image/static-like payloads and don't need CSP nonces
  // or locale header work on every request.
  if (
    pathname === "/apple-touch-icon.png"
    || pathname === "/apple-touch-icon-precomposed.png"
    || pathname.startsWith("/favicon-")
    || pathname === "/opengraph-image"
    || pathname.endsWith("/opengraph-image")
  ) {
    return NextResponse.next();
  }

  // Redirect known legacy production hosts to canonical domain.
  if (LEGACY_PRODUCTION_HOSTS.has(hostname)) {
    const url = request.nextUrl.clone();
    url.hostname = CANONICAL_HOST;
    return NextResponse.redirect(url, 301);
  }

  // Keep English canonical at root: /en and /en/* → / and /*.
  if (pathname === "/en" || pathname === "/en/" || pathname.startsWith("/en/")) {
    const url = request.nextUrl.clone();
    let normalizedPath = pathname === "/en" || pathname === "/en/"
      ? "/"
      : pathname.replace(/^\/en(?=\/)/, "");
    if (normalizedPath !== "/" && normalizedPath.endsWith("/")) {
      normalizedPath = normalizedPath.slice(0, -1);
    }
    url.pathname = normalizedPath || "/";
    const response = NextResponse.redirect(url, 308);
    setLocaleCookie(response, DEFAULT_LOCALE);
    return response;
  }

  // Remove trailing slashes (except root)
  if (pathname !== "/" && pathname.endsWith("/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(0, -1);
    return NextResponse.redirect(url, 301);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", localeFromPath || DEFAULT_LOCALE);

  let nonce: string | undefined;
  if (process.env.NODE_ENV === "production") {
    nonce = createNonce();
    requestHeaders.set("x-nonce", nonce);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });

  if (localeFromPath) {
    setLocaleCookie(response, localeFromPath);
  }

  if (nonce) {
    response.headers.set("Content-Security-Policy", buildCsp(nonce));
    response.headers.set("x-nonce", nonce);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|sw-register.js|offline.html|icons|robots\\.txt|sitemap\\.xml|sitemap|apple-touch-icon\\.png|apple-touch-icon-precomposed\\.png|favicon-32x32\\.png|favicon-48x48\\.png|favicon-96x96\\.png).*)"
  ]
};
