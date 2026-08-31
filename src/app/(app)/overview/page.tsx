import { auth } from "@/lib/auth"
import { OverviewClient } from "@/components/dashboard/OverviewClient"

export const metadata = {
  title: "Overview",
}

export default async function OverviewPage() {
  const session = await auth()
  const sessionUser = session?.user as { name?: string | null; username?: string | null } | undefined
  const username = sessionUser?.name || sessionUser?.username || undefined

  return (
    <div>
      <OverviewClient username={username} />
    </div>
  )
}
