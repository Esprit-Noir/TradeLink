import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { NotificationsCenter } from "@/components/notifications/NotificationsCenter"

export const metadata = {
  title: "Notifications",
}

export default async function NotificationsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  return (
    <div>
      <NotificationsCenter />
    </div>
  )
}
