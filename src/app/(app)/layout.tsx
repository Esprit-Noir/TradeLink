import { Sidebar } from "@/components/layout/Sidebar"
import { PageTransition } from "@/components/layout/PageTransition"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  )
}
