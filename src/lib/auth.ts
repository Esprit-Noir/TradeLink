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
          password: z.string().min(8).max(128),
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
        // Use a transaction to prevent race conditions on concurrent sign-ins
        await authPrisma.$transaction(async (tx) => {
          // Find or create user by email
          let dbUser = await tx.user.findUnique({
            where: { email: user.email! },
          })

          if (!dbUser) {
            // Create new user from Google OAuth
            dbUser = await tx.user.create({
              data: {
                email: user.email!,
                name: user.name || "",
              },
            })
          }

          // Link OAuth account if not already linked
          const existingOAuth = await tx.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
          })

          if (!existingOAuth) {
            await tx.account.create({
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
          const existingAccount = await tx.tradingAccount.findFirst({
            where: { userId: dbUser.id },
          })

          if (!existingAccount) {
            await tx.tradingAccount.create({
              data: {
                userId: dbUser.id,
                name: "Main Account",
                baseCurrency: "USD",
                initialBalance: 10000,
                isDefault: true,
              },
            })
          }

          await tx.user.update({
            where: { id: dbUser.id },
            data: { lastLoginAt: new Date() },
          })

          // Attach the DB user id to the JWT
          user.id = dbUser.id
        })
      }

      return true
    },
    async jwt({ token, user }) {
      // Au moment de la connexion, on charge toutes les infos
      if (user) {
        token.id = user.id
        const dbUser = await authPrisma.user.findUnique({
          where: { id: user.id as string },
          select: { role: true, status: true, tokenVersion: true },
        })
        if (dbUser) {
          token.role = dbUser.role as string
          token.status = dbUser.status as string
          token.tokenVersion = dbUser.tokenVersion
        }
      }

      // Throttle DB check — only every 60s to avoid a query per request
      if (token.id && token.tokenVersion !== undefined) {
        const now = Date.now()
        const lastCheck = (token as Record<string, unknown>).lastDbCheck as number | undefined
        if (!lastCheck || now - lastCheck > 60_000) {
          const dbUser = await authPrisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, status: true, tokenVersion: true },
          })
          ;(token as Record<string, unknown>).lastDbCheck = now

          if (!dbUser) {
            delete token.id
            delete token.role
            delete token.status
            return token
          }

          if (dbUser.tokenVersion !== token.tokenVersion) {
            token.role = dbUser.role as string
            token.status = dbUser.status as string
            token.tokenVersion = dbUser.tokenVersion
          } else {
            token.role = dbUser.role as string
            token.status = dbUser.status as string
          }
        }
      }

      return token
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      if (token.role) session.user.role = token.role as string
      if (token.status) session.user.status = token.status as string
      if (token.tokenVersion !== undefined) session.user.tokenVersion = token.tokenVersion as number
      return session
    },
  },
})
