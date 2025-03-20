import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Log della richiesta in arrivo
  console.log(`[Middleware] Richiesta in arrivo per: ${req.method} ${req.nextUrl.pathname}`);

  // Evita di eseguire il check per le risorse statiche
  if (
    req.nextUrl.pathname.startsWith('/_next') || 
    req.nextUrl.pathname.includes('/api/') ||
    req.nextUrl.pathname.includes('.ico') ||
    req.nextUrl.pathname.includes('.png') ||
    req.nextUrl.pathname.includes('.jpg') ||
    req.nextUrl.pathname.includes('.svg')
  ) {
    console.log(`[Middleware] Skipping auth check for static resource: ${req.nextUrl.pathname}`);
    return NextResponse.next();
  }

  try {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });
    
    console.log(`[Middleware] Checking session for: ${req.nextUrl.pathname}`);
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error(`[Middleware] Error getting session:`, error);
      // In caso di errore, permettiamo comunque l'accesso alle pagine pubbliche
      return NextResponse.next();
    }

    // Lista delle pagine pubbliche che non richiedono autenticazione
    const publicPages = [
      '/login', 
      '/', 
      '/auth/reset-password', 
      '/about', 
      '/pricing', 
      '/privacy',
      '/qrt'
    ];
    
    const isPublicPage = publicPages.includes(req.nextUrl.pathname) || 
                        req.nextUrl.pathname.match(/^\/ebudgets\/[\w-]+$/);

    console.log(`[Middleware] Path: ${req.nextUrl.pathname}`);
    console.log(`[Middleware] Is public page: ${isPublicPage}`);
    console.log(`[Middleware] Has session: ${!!session}`);

    // Se non c'è sessione e non è una pagina pubblica, redirect al login
    if (!session && !isPublicPage) {
      console.log(`[Middleware] Redirecting to login: No session and private page`);
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Se c'è sessione e l'utente prova ad accedere al login, redirect alla lista budget
    if (session && req.nextUrl.pathname === '/login') {
      console.log(`[Middleware] Redirecting to budgets: User already logged in`);
      return NextResponse.redirect(new URL('/budgets', req.url));
    }

    console.log(`[Middleware] Allowing access to: ${req.nextUrl.pathname}`);
    return res;

  } catch (error) {
    console.error(`[Middleware] Unexpected error:`, error);
    // In caso di errore imprevisto, permettiamo l'accesso alle pagine pubbliche
    return NextResponse.next();
  }
}

// Matcher più specifico per il middleware
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
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};