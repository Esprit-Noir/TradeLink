import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { AccountDetail } from "@/components/accounts/AccountDetail"
import { Suspense } from "react"

export const metadata = {
  title: "Account Detail | TradeLink",
}

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const { id } = await params

  const account = await prisma.tradingAccount.findUnique({
    where: { id },
  })

  if (!account || account.userId !== session.user.id) {
    redirect("/accounts")
  }

  return (
    <div>
      <Suspense fallback={<div className="skeleton" style={{ height: "400px" }} />}>
        <AccountDetail accountId={id} />
      </Suspense>
    </div>
  )
}
