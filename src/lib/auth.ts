import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
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

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        })

        if (!user || !user.passwordHash) return null

        // Block suspended/banned users
        if (user.status === "SUSPENDED" || user.status === "BANNED") {
          return null
        }

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!valid) return null

        // Update lastLoginAt
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On sign-in, set the id
      if (user) {
        token.id = user.id
      }

      // Always refresh role/status from DB (lightweight query)
      const userId = token.id as string
      if (userId) {
        const dbUser = await prisma.user.findUnique({
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
