import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { authPrisma } from "@/lib/prisma"
import { z } from "zod"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(authPrisma),
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
      if (account?.provider === "google" && user?.id) {
        const existingAccount = await authPrisma.tradingAccount.findFirst({
          where: { userId: user.id },
        })

        if (!existingAccount) {
          await authPrisma.tradingAccount.create({
            data: {
              userId: user.id,
              name: "Main Account",
              baseCurrency: "USD",
              initialBalance: 10000,
              isDefault: true,
            },
          })
        }

        await authPrisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })
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
