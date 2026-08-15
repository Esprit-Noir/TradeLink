import { auth } from "@/lib/auth"
import { OverviewClient } from "@/components/dashboard/OverviewClient"

export const metadata = {
  title: "Overview",
}

export default async function OverviewPage() {
  const session = await auth()
  const username = (session?.user as any)?.name || (session?.user as any)?.username || null

  return (
    <div>
      <OverviewClient username={username} />
    </div>
  )
}
