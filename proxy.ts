import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

export function proxy(request: NextRequest) {
  const { hostname, pathname } = request.nextUrl;

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

  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  const nonce = createNonce();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });

  response.headers.set("Content-Security-Policy", buildCsp(nonce));
  response.headers.set("x-nonce", nonce);

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|sw-register.js|offline.html|icons).*)"
  ]
};
