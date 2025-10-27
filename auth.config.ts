import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  providers: [], // Empty array - providers are defined in auth.ts
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const pathname = nextUrl.pathname
      
      // Public routes (customer-facing)
      const publicRoutes = ['/billing', '/pay', '/success', '/api']
      const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
      
      // If on login page and already logged in, redirect to home
      if (pathname.startsWith('/login') && isLoggedIn) {
        return Response.redirect(new URL('/', nextUrl))
      }

      // If not logged in and trying to access protected route
      if (!isLoggedIn && !isPublicRoute && !pathname.startsWith('/login')) {
        return Response.redirect(new URL('/login', nextUrl))
      }

      return true
    },
  },
} satisfies NextAuthConfig

