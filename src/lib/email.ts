import { Resend } from "resend"
import { ReactNode } from "react"

// Initialize Resend with the API key from environment variables.
// If RESEND_API_KEY is missing, it will instantiate but API calls will fail or we can mock them.
const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_key")

type SendEmailOptions = {
  to: string | string[]
  subject: string
  react: ReactNode
}

export async function sendEmail({ to, subject, react }: SendEmailOptions) {
  // If no API key is provided, log to console (useful for local development)
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_dummy_key") {
    console.log("--------------------------------------------------")
    console.log(`📧 MOCK EMAIL SENT TO: ${to}`)
    console.log(`📧 SUBJECT: ${subject}`)
    console.log(`📧 REACT PAYLOAD RECEIVED`)
    console.log("--------------------------------------------------")
    return { success: true, mocked: true }
  }

  try {
    const data = await resend.emails.send({
      from: "TradeLink <onboarding@resend.dev>", // Replace with verified domain when going to production
      to,
      subject,
      react,
    })

    return { success: true, data }
  } catch (error) {
    console.error("Failed to send email:", error)
    return { success: false, error }
  }
}
