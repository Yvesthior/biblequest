import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import type { Adapter } from "@auth/core/adapters"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "votre@email.com" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password as string, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
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
})
