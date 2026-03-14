import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = request.cookies.get("token")?.value
  const refreshToken = request.cookies.get("refreshToken")?.value
  const adminToken = request.cookies.get("adminToken")?.value
  const adminRefreshToken = request.cookies.get("adminRefreshToken")?.value

  const isAuthenticated = Boolean(token || refreshToken)
  const isAdminAuthenticated = Boolean(adminToken || adminRefreshToken)

  const isAuthPage =
    pathname === "/login" || pathname === "/register"

  const isPublicPage = pathname === "/"

  const isDashboard = pathname.startsWith("/dashboard")
  const isAdmin = pathname.startsWith("/admin")
  const isAdminLogin = pathname === "/admin/login"

  if (isAuthenticated || isAdminAuthenticated) {
    if (isAuthPage || isPublicPage) {
      return NextResponse.redirect(
        new URL("/dashboard", request.url)
      )
    }
    if (isAdminLogin) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url))
    }
    return NextResponse.next()
  }

  if (!isAuthenticated && (isDashboard || isAdmin) && !isAdminLogin) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/dashboard/:path*",
    "/admin/:path*",
    "/blocked",
  ],
}
