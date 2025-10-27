import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from './auth'

export default auth(async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const session = await auth()
  const isLoggedIn = !!session?.user

  // Define public and protected routes
  const publicRoutes = ['/login', '/billing', '/pay', '/success']
  const protectedRoutes = ['/', '/invoicing']
  
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route))
  const isProtectedRoute = protectedRoutes.some(route => pathname === route)

  // If trying to access protected route without auth, redirect to login
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If logged in and trying to access login page, redirect to home
  if (pathname === '/login' && isLoggedIn) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (image files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
}

