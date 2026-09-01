import type { Metadata } from "next"
import { PlaybooksClient } from "@/components/playbooks/PlaybooksClient"

export const metadata: Metadata = {
  title: "Playbooks",
}

export default function PlaybooksPage() {
  return <PlaybooksClient />
}
