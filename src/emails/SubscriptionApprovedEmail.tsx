import * as React from "react"
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Button,
} from "@react-email/components"

interface SubscriptionApprovedEmailProps {
  name: string
  planName: string
}

export const SubscriptionApprovedEmail = ({ 
  name = "Trader", 
  planName = "Pro" 
}: SubscriptionApprovedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your {planName} subscription is now active! 🎉</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Payment Received & Approved</Heading>
          
          <Text style={text}>Hi {name},</Text>
          
          <Text style={text}>
            Good news! We&apos;ve received your payment and your account has been successfully upgraded to the <strong>{planName} Plan</strong>. 
            All premium features are now unlocked and ready to use.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href="https://tradelink.vercel.app/billing">
              View your Subscription
            </Button>
          </Section>

          <Text style={text}>
            You now have access to:
            <br />
            - Advanced Behavioral Analytics
            <br />
            - Full Replay Simulator
            <br />
            - Advanced Prop Firm Tracking
            <br />
            - Priority Support
          </Text>

          <Hr style={hr} />
          
          <Text style={footer}>
            Thank you for investing in your trading edge. Let&apos;s conquer the markets!
            <br /><br />
            Stay disciplined,
            <br />
            The TradeLink Team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default SubscriptionApprovedEmail

const main = {
  backgroundColor: "#000000",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "600px",
  backgroundColor: "#0a0a0a",
  border: "1px solid #27272a",
  borderRadius: "12px",
}

const h1 = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "30px 0",
  padding: "0",
}

const text = {
  color: "#a1a1aa",
  fontSize: "15px",
  lineHeight: "24px",
  marginBottom: "20px",
}

const buttonContainer = {
  marginTop: "30px",
  marginBottom: "30px",
}

const button = {
  backgroundColor: "#00c758",
  borderRadius: "6px",
  color: "#000000",
  fontSize: "15px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
}

const hr = {
  borderColor: "#27272a",
  margin: "30px 0",
}

const footer = {
  color: "#71717a",
  fontSize: "13px",
  lineHeight: "22px",
}
