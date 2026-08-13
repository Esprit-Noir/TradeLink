import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { MonthlyReport } from "@/components/report/MonthlyReport"

export const metadata = {
  title: "Monthly Report",
}

export default async function ReportPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  return (
    <div>
      <MonthlyReport />
    </div>
  )
}
