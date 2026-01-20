import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  // Vérifie si l'utilisateur est authentifié et a le rôle ADMIN
  if (!req.auth || req.auth.user?.role !== 'ADMIN') {
    // Redirige vers la page de connexion avec un callback vers la page demandée
    const url = req.nextUrl.clone();
    url.pathname = '/auth/signin';
    url.searchParams.set('callbackUrl', req.nextUrl.pathname);

    // Pour les routes API, on renvoie une erreur JSON au lieu de rediriger
    if (req.nextUrl.pathname.startsWith('/api/admin')) {
      return NextResponse.json({ message: 'Authentication failed: User is not an admin.' }, { status: 403 });
    }

    return NextResponse.redirect(url);
  }
});

// Applique le middleware uniquement aux routes admin
export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
