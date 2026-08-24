import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface PropAlertEmailProps {
  userName: string;
  firmName: string;
  eventType: string; // e.g. "Drawdown Warning", "Challenge Breached", "Target Hit"
  severity: "info" | "warning" | "critical";
  message: string;
}

export const PropAlertEmail = ({
  userName = "Trader",
  firmName = "Prop Firm",
  eventType = "Prop Firm Alert",
  severity = "info",
  message = "You have a new update regarding your challenge.",
}: PropAlertEmailProps) => {
  const previewText = `TradeLink Prop Alert: ${eventType}`;

  const colors = {
    info: "text-blue-500 border-blue-900 bg-blue-950/30",
    warning: "text-amber-500 border-amber-900 bg-amber-950/30",
    critical: "text-red-500 border-red-900 bg-red-950/30",
  };
  
  const headingColors = {
    info: "text-blue-500",
    warning: "text-amber-500",
    critical: "text-red-500",
  };

  const currentTheme = colors[severity];
  const headingColor = headingColors[severity];

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-zinc-950 text-zinc-100 font-sans my-auto mx-auto px-2">
          <Container className="border border-solid border-zinc-800 rounded my-[40px] mx-auto p-[20px] w-[465px] bg-zinc-900">
            <Heading className={`${headingColor} text-[24px] font-normal text-center p-0 my-[30px] mx-0 font-bold`}>
              {eventType}
            </Heading>
            <Text className="text-zinc-300 text-[14px] leading-[24px]">
              Hello {userName},
            </Text>
            <Text className="text-zinc-300 text-[14px] leading-[24px]">
              An event was logged for your <strong>{firmName}</strong> challenge:
            </Text>
            <div className={`${currentTheme} border rounded p-4 my-6`}>
              <Text className="text-zinc-300 text-[14px] mt-2 mb-0">{message}</Text>
            </div>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md text-[14px] font-semibold no-underline text-center px-6 py-3"
                href="https://tradelink.vercel.app/challenges"
              >
                View Challenge Dashboard
              </Button>
            </Section>
            <Text className="text-zinc-500 text-[12px] leading-[24px] text-center mt-6 border-t border-zinc-800 pt-4">
              © {new Date().getFullYear()} TradeLink. Automated prop firm tracking.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default PropAlertEmail;
