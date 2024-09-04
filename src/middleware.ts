import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const adminSession = request.cookies.get('admin_session')?.value;
    console.log(request.nextUrl.pathname);
    if (adminSession !== 'true' && request.nextUrl.pathname !== '/api/auth') {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/', '/post/:path*', '/project/:path*', '/api/:path*',],
};
