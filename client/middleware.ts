import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const AUTH_DEBUG = process.env.NEXT_PUBLIC_DEBUG_AUTH === "true"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = request.cookies.get("token")?.value
  const refreshToken = request.cookies.get("refreshToken")?.value
  const adminToken = request.cookies.get("adminToken")?.value
  const adminRefreshToken = request.cookies.get("adminRefreshToken")?.value

  const isAuthenticated = Boolean(token || refreshToken)
  const isAdminAuthenticated = Boolean(adminToken || adminRefreshToken)

  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname.startsWith("/forgot-password")
  const isPublicPage = pathname === "/"
  
  const isAdminPage = pathname.startsWith("/admin")
  const isAdminLogin = pathname === "/admin/login"
  
  const isParentPage = pathname.startsWith("/parent")
  const isParentLogin = pathname === "/parent/login"

  if (AUTH_DEBUG) {
    console.log("[AuthDebug] middleware", {
      path: pathname,
      isAuthenticated,
      isAdminAuthenticated,
    })
  }

  // 1. Redirection for Admin Pages
  if (isAdminPage) {
    if (isAdminLogin) {
      if (isAdminAuthenticated) {
        return NextResponse.redirect(new URL("/admin/centers", request.url))
      }
      return NextResponse.next()
    }

    if (!isAdminAuthenticated) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
    return NextResponse.next()
  }

  // 2. Redirection for Parent Pages
  if (isParentPage) {
    if (isParentLogin) {
      if (isAuthenticated) {
        return NextResponse.redirect(new URL("/parent", request.url))
      }
      return NextResponse.next()
    }

    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/parent/login", request.url))
    }
    return NextResponse.next()
  }

  // 3. Redirection for Guest Pages (login/register/home) for normal users
  if (isAuthPage || isPublicPage) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    if (isAdminAuthenticated) {
      return NextResponse.redirect(new URL("/admin/centers", request.url))
    }
    return NextResponse.next()
  }

  // 4. Redirection for all other Platform Pages (e.g. /settings, /students, /teachers, /batches, etc.)
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|images).*)",
  ],
}
