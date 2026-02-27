import { NextResponse } from 'next/server';

// Launch date: 2 March 2026 at 08:00 CET (UTC+1) = 07:00 UTC
const LAUNCH_DATE = new Date('2026-03-02T07:00:00.000Z');

export function middleware(request) {
    const now = new Date();
    const { pathname } = request.nextUrl;

    // Only block the root path "/"
    // Everything else (/chat, /admin, /api, /about, etc.) passes through freely
    const isRootOnly = pathname === '/';

    if (!isRootOnly) {
        return NextResponse.next();
    }

    // If before launch date and visiting "/" → redirect to coming soon
    if (now < LAUNCH_DATE) {
        const url = request.nextUrl.clone();
        url.pathname = '/coming-soon';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
