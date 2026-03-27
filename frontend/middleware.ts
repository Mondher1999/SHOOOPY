import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Admin route soft gate — redirect unauthenticated users before rendering
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const hasAuth = request.cookies.get("shopflow_auth");
    if (!hasAuth) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  const response = NextResponse.next();

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Control referrer information
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Enforce HTTPS
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );

  // Restrict browser feature access
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );

  // Basic Content Security Policy — tighten per-feature as app grows
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      `img-src 'self' data: blob: ${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}`,
      "font-src 'self' https://fonts.gstatic.com",
      `connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}`,
      "frame-ancestors 'none'",
    ].join("; ")
  );

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
