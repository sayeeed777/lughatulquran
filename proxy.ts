import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  localeFromAcceptLanguage,
  localeFromPathname,
  normalizeLocale,
  withLocalePath
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
    "connect-src 'self'",
    "media-src 'self' https://everyayah.com https://audio.qurancdn.com",
    "worker-src 'self'",
    "manifest-src 'self'"
  ].join("; ");

const CANONICAL_HOST = "openfurqan.com";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const setLocaleCookie = (response: NextResponse, locale: string) => {
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
};

const resolvePreferredLocale = (request: NextRequest) => {
  const cookieLocale = normalizeLocale(request.cookies.get(LOCALE_COOKIE)?.value);
  if (cookieLocale) return cookieLocale;
  return localeFromAcceptLanguage(request.headers.get("accept-language"));
};

export function proxy(request: NextRequest) {
  const { hostname, pathname } = request.nextUrl;
  const localeFromPath = localeFromPathname(pathname);
  const isSurahPath = pathname === "/surah" || pathname.startsWith("/surah/");
  const isSurahOpenGraphImage = pathname.includes("/opengraph-image");

  // Redirect www → non-www
  if (hostname === `www.${CANONICAL_HOST}`) {
    const url = request.nextUrl.clone();
    url.hostname = CANONICAL_HOST;
    return NextResponse.redirect(url, 301);
  }

  // Remove trailing slashes (except root)
  if (pathname !== "/" && pathname.endsWith("/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(0, -1);
    return NextResponse.redirect(url, 301);
  }

  // Locale entrypoint: root always redirects to a locale-prefixed URL.
  if (pathname === "/") {
    const preferredLocale = resolvePreferredLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = withLocalePath(preferredLocale);
    const response = NextResponse.redirect(url, 307);
    setLocaleCookie(response, preferredLocale);
    return response;
  }

  // Keep canonical Surah/Ayah URLs locale-prefixed.
  if (!localeFromPath && isSurahPath && !isSurahOpenGraphImage) {
    const url = request.nextUrl.clone();
    url.pathname = withLocalePath(DEFAULT_LOCALE, pathname);
    const response = NextResponse.redirect(url, 308);
    setLocaleCookie(response, DEFAULT_LOCALE);
    return response;
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
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|sw-register.js|offline.html|icons|robots\\.txt|sitemap\\.xml|sitemap).*)"
  ]
};
