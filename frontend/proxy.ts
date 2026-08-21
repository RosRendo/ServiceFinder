import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import type { NextRequest } from 'next/server'

/**
 * Edge middleware: verifies the httpOnly session cookie JWT (signature +
 * expiry + role) instead of only checking cookie presence.
 *
 * The token cookie is httpOnly, set by the backend. We re-verify the
 * signature here with the shared JWT_SECRET so a garbage/stale token is
 * treated exactly like no token. Role claims gate /admin, /company, /staff
 * and /customer routes; users are redirected to their own dashboard.
 */

// Secret is server-side only — never expose via NEXT_PUBLIC_.
const getSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    // Fail closed: without the secret nothing can be verified.
    console.error('[proxy] JWT_SECRET is not configured — auth checks are disabled')
    return null
  }
  return new TextEncoder().encode(secret)
}

const PROTECTED_PREFIXES = ['/customer', '/company', '/staff', '/admin']
const AUTH_PAGES = ['/auth/login', '/auth/register']

const dashboardFor = (role?: string): string => {
  switch (role) {
    case 'admin':
      return '/admin/dashboard'
    case 'company':
    case 'company_admin':
      return '/company/dashboard'
    case 'staff':
      return '/staff/dashboard'
    case 'customer':
      return '/customer/dashboard'
    default:
      return '/auth/login'
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')?.value

  const isProtectedRoute = PROTECTED_PREFIXES.some((p) =>
    pathname.startsWith(p),
  )
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p))

  // Root paths redirect to their dashboard (/admin -> /admin/dashboard).
  if (PROTECTED_PREFIXES.includes(pathname)) {
    return NextResponse.redirect(
      new URL(`${pathname}/dashboard`, request.url),
    )
  }

  // Verify the JWT signature + expiry.
  let payload: { role?: string } | null = null
  if (token) {
    const secret = getSecret()
    if (secret) {
      try {
        const { payload: verified } = await jwtVerify(token, secret)
        payload = verified as { role?: string }
      } catch {
        payload = null // invalid signature, expired, or malformed
      }
    }
  }

  const role = payload?.role
  const routeKey = pathname.split('/')[1] // 'admin' | 'company' | 'staff' | 'customer'

  // Unauthenticated (or unverifiable) -> keep off protected routes.
  if (isProtectedRoute && !role) {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Authenticated -> role gate on protected routes.
  if (isProtectedRoute && role) {
    const allowed: Record<string, string[]> = {
      admin: ['admin'],
      company: ['company', 'company_admin'],
      staff: ['staff'],
      customer: ['customer'],
    }
    const ok = (allowed[routeKey] || []).includes(role)
    if (!ok) {
      return NextResponse.redirect(new URL(dashboardFor(role), request.url))
    }
  }

  // Authenticated users visiting login/register -> send them to their dashboard.
  if (isAuthPage && role) {
    return NextResponse.redirect(new URL(dashboardFor(role), request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|monitoring|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
}
