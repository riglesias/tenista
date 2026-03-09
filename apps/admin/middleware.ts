import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Check if user is authenticated
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // If accessing admin routes
  if (request.nextUrl.pathname.startsWith('/(admin)') ||
      request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/leagues') ||
      request.nextUrl.pathname.startsWith('/matches') ||
      request.nextUrl.pathname.startsWith('/courts') ||
      request.nextUrl.pathname.startsWith('/players') ||
      request.nextUrl.pathname.startsWith('/clubs') ||
      request.nextUrl.pathname.startsWith('/cities') ||
      request.nextUrl.pathname.startsWith('/reports') ||
      request.nextUrl.pathname.startsWith('/rating-requests') ||
      request.nextUrl.pathname.startsWith('/settings')) {
    
    // Redirect to login if not authenticated
    if (!user || error) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Check if user has admin access
    try {
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (adminError || !adminUser) {
        // User is authenticated but not an admin
        const unauthorizedUrl = new URL('/unauthorized', request.url)
        return NextResponse.redirect(unauthorizedUrl)
      }

      // Add admin role to headers for use in server components
      response.headers.set('x-admin-role', adminUser.role)
    } catch (adminCheckError) {
      console.error('Error checking admin status:', adminCheckError)
      const errorUrl = new URL('/login', request.url)
      return NextResponse.redirect(errorUrl)
    }
  }

  // If accessing login page while authenticated, redirect to dashboard
  if (request.nextUrl.pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}