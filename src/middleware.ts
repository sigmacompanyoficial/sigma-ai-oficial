import { NextResponse } from 'next/server';

export function middleware(request) {
    // Si el usuario intenta acceder a la raíz ('/'), redirigirlo a '/coming-soon'
    if (request.nextUrl.pathname === '/') {
        return NextResponse.redirect(new URL('/coming-soon', request.url));
    }

    return NextResponse.next();
}

export const config = {
    // Ejecutar este middleware únicamente en la ruta raíz.
    matcher: '/',
};