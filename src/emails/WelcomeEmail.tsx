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

interface WelcomeEmailProps {
  userName: string;
}

export const WelcomeEmail = ({ userName = "Trader" }: WelcomeEmailProps) => {
  const previewText = `Welcome to TradeLink, ${userName}!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-zinc-950 text-zinc-100 font-sans my-auto mx-auto px-2">
          <Container className="border border-solid border-zinc-800 rounded my-[40px] mx-auto p-[20px] w-[465px] bg-zinc-900">
            <Heading className="text-zinc-50 text-[24px] font-normal text-center p-0 my-[30px] mx-0 font-bold">
              Welcome to <span className="text-[#a1ff00]">TradeLink</span>
            </Heading>
            <Text className="text-zinc-300 text-[14px] leading-[24px]">
              Hello {userName},
            </Text>
            <Text className="text-zinc-300 text-[14px] leading-[24px]">
              Welcome to TradeLink! We are thrilled to have you on board. TradeLink is designed to give you deep insights into your trading behavior and performance.
            </Text>
            <Text className="text-zinc-300 text-[14px] leading-[24px]">
              Get started by exploring your dashboard and linking your trading accounts.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#a1ff00] rounded-md text-zinc-950 text-[14px] font-semibold no-underline text-center px-6 py-3"
                href="https://tradelink.vercel.app/dashboard"
              >
                Access Dashboard
              </Button>
            </Section>
            <Text className="text-zinc-500 text-[12px] leading-[24px] text-center mt-6 border-t border-zinc-800 pt-4">
              © {new Date().getFullYear()} TradeLink. All rights reserved.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WelcomeEmail;
