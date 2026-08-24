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

interface ReceiptEmailProps {
  userName: string;
  amount: string;
  currency: string;
  paymentMethod: string; // "Crypto (USDT)", "Stripe", etc.
  date: string;
  planName: string;
}

export const ReceiptEmail = ({
  userName = "Trader",
  amount = "49.00",
  currency = "USD",
  paymentMethod = "Crypto (USDT)",
  date = new Date().toLocaleDateString(),
  planName = "Pro Plan",
}: ReceiptEmailProps) => {
  const previewText = `Your TradeLink Receipt - ${planName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-zinc-950 text-zinc-100 font-sans my-auto mx-auto px-2">
          <Container className="border border-solid border-zinc-800 rounded my-[40px] mx-auto p-[20px] w-[465px] bg-zinc-900">
            <Heading className="text-zinc-50 text-[24px] font-normal text-center p-0 my-[30px] mx-0 font-bold">
              Payment Receipt
            </Heading>
            <Text className="text-zinc-300 text-[14px] leading-[24px]">
              Hello {userName},
            </Text>
            <Text className="text-zinc-300 text-[14px] leading-[24px]">
              Thank you for your purchase. Here are the details of your recent transaction for TradeLink <strong>{planName}</strong>.
            </Text>
            <div className="bg-zinc-950 border border-zinc-800 rounded p-6 my-6">
              <div className="flex justify-between mb-4">
                <Text className="text-zinc-400 text-[14px] m-0">Amount Paid</Text>
                <Text className="text-zinc-50 font-bold text-[14px] m-0">{amount} {currency}</Text>
              </div>
              <div className="flex justify-between mb-4">
                <Text className="text-zinc-400 text-[14px] m-0">Payment Method</Text>
                <Text className="text-zinc-300 text-[14px] m-0">{paymentMethod}</Text>
              </div>
              <div className="flex justify-between">
                <Text className="text-zinc-400 text-[14px] m-0">Date</Text>
                <Text className="text-zinc-300 text-[14px] m-0">{date}</Text>
              </div>
            </div>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#a1ff00] rounded-md text-zinc-950 text-[14px] font-semibold no-underline text-center px-6 py-3"
                href="https://tradelink.vercel.app/billing"
              >
                View Billing Details
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

export default ReceiptEmail;
