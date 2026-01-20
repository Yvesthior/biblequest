import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/auth/signin",
    },
    callbacks: {
        async session({ session, token }) {
            if (session.user && token) {
                session.user.id = token.sub as string
                if (token.role) {
                    (session.user as any).role = token.role
                }
            }
            return session
        },
        async jwt({ token, user }) {
            if (user) {
                // On the first sign-in, `user` object is available
                token.role = (user as any).role
            }
            return token
        },
        async redirect({ url, baseUrl }) {
            // Allows us to redirect to the callbackUrl if it exists
            if (url.startsWith(baseUrl)) {
                return url
            }
            // Allows relative callback URLs
            if (url.startsWith("/")) {
                return new URL(url, baseUrl).toString()
            }
            return baseUrl
        },
    },
    session: {
        strategy: "jwt",
    },
    providers: [], // Providers are configured in auth.ts to avoid Edge runtime issues
    secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig
