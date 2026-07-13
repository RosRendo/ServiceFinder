import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // ✅ Check for token cookie
  const token = request.cookies.get('token')?.value
  
  const protectedRoutes = ['/customer', '/company', '/staff', '/admin']
  const authRoutes = ['/auth/login', '/auth/register']
  
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  
  // No token + trying to access protected route = redirect to login
  if (isProtectedRoute && !token) {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }
  
  if (['/customer', '/company', '/staff', '/admin'].includes(pathname)) {
    if (pathname === '/customer') return NextResponse.redirect(new URL('/customer/dashboard', request.url))
    if (pathname === '/company') return NextResponse.redirect(new URL('/company/dashboard', request.url))
    if (pathname === '/staff') return NextResponse.redirect(new URL('/staff/dashboard', request.url))
    if (pathname === '/admin') return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|monitoring|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
}
