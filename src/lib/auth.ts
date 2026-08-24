import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { authPrisma } from "@/lib/prisma"
import { z } from "zod"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z.object({
          email: z.string().email(),
          password: z.string().min(8),
        }).safeParse(credentials)

        if (!parsed.success) return null

        const user = await authPrisma.user.findUnique({
          where: { email: parsed.data.email },
        })

        if (!user || !user.passwordHash) return null

        if (user.status === "SUSPENDED" || user.status === "BANNED") {
          return null
        }

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!valid) return null

        await authPrisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user?.email) {
        // Find or create user by email
        let dbUser = await authPrisma.user.findUnique({
          where: { email: user.email },
        })

        if (!dbUser) {
          // Create new user from Google OAuth
          dbUser = await authPrisma.user.create({
            data: {
              email: user.email,
              name: user.name || "",
            },
          })
        }

        // Link OAuth account if not already linked
        const existingOAuth = await authPrisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
        })

        if (!existingOAuth) {
          await authPrisma.account.create({
            data: {
              userId: dbUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              expires_at: account.expires_at,
            },
          })
        }

        // Create default trading account if none exists
        const existingAccount = await authPrisma.tradingAccount.findFirst({
          where: { userId: dbUser.id },
        })

        if (!existingAccount) {
          await authPrisma.tradingAccount.create({
            data: {
              userId: dbUser.id,
              name: "Main Account",
              baseCurrency: "USD",
              initialBalance: 10000,
              isDefault: true,
            },
          })
        }

        await authPrisma.user.update({
          where: { id: dbUser.id },
          data: { lastLoginAt: new Date() },
        })

        // Attach the DB user id to the JWT
        user.id = dbUser.id
      }

      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }

      const userId = token.id as string
      if (userId) {
        const dbUser = await authPrisma.user.findUnique({
          where: { id: userId },
          select: { role: true, status: true },
        })
        if (dbUser) {
          token.role = dbUser.role as string
          token.status = dbUser.status as string
        }
      }

      return token
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      if (token.role) (session.user as unknown as Record<string, unknown>).role = token.role as string
      if (token.status) (session.user as unknown as Record<string, unknown>).status = token.status as string
      return session
    },
  },
})
