import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
    '/',
    '/api(.*)'
])

export default clerkMiddleware(async (auth, request) => {
    // 1. Enforce Authentication
    if (!isPublicRoute(request)) {
        await auth.protect()
    }

    // 2. Enforce Locale (App Router next-intl fix for _not-found)
    const response = NextResponse.next()
    if (!request.cookies.has('NEXT_LOCALE')) {
        response.cookies.set('NEXT_LOCALE', 'en')
    }

    return response
})

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
}
