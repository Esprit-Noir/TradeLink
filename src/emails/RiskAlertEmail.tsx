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

interface RiskAlertEmailProps {
  userName: string;
  alertType: string;
  description: string;
}

export const RiskAlertEmail = ({ userName = "Trader", alertType = "Drawdown Alert", description = "You have hit a significant drawdown." }: RiskAlertEmailProps) => {
  const previewText = `TradeLink Risk Alert: ${alertType}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-zinc-950 text-zinc-100 font-sans my-auto mx-auto px-2">
          <Container className="border border-solid border-red-900 rounded my-[40px] mx-auto p-[20px] w-[465px] bg-zinc-900">
            <Heading className="text-red-500 text-[24px] font-normal text-center p-0 my-[30px] mx-0 font-bold">
              Risk Alert
            </Heading>
            <Text className="text-zinc-300 text-[14px] leading-[24px]">
              Hello {userName},
            </Text>
            <Text className="text-zinc-300 text-[14px] leading-[24px]">
              Our behavioral engine has detected a potential risk in your recent trading activity:
            </Text>
            <div className="bg-red-950/30 border border-red-900 rounded p-4 my-6">
              <Text className="text-red-400 font-bold text-[16px] m-0">{alertType}</Text>
              <Text className="text-zinc-300 text-[14px] mt-2 mb-0">{description}</Text>
            </div>
            <Text className="text-zinc-300 text-[14px] leading-[24px]">
              We highly recommend reviewing your recent trades and considering a short break to reset your mindset. Protecting your capital is rule #1.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-md text-[14px] font-semibold no-underline text-center px-6 py-3"
                href="https://tradelink.vercel.app/behavioral"
              >
                Review Behavioral Score
              </Button>
            </Section>
            <Text className="text-zinc-500 text-[12px] leading-[24px] text-center mt-6 border-t border-zinc-800 pt-4">
              © {new Date().getFullYear()} TradeLink. Automated risk notification.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default RiskAlertEmail;
