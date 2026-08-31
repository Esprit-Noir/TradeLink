import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  serverExternalPackages: ["yahoo-finance2"],
};

export default withSentryConfig(withNextIntl(nextConfig), {
  // org/project slugs are used to upload source maps on every production build.
  // Populate SENTRY_PROJECT with your project slug (Settings → Projects → <project>).
  org: process.env.SENTRY_ORG || "espritech",
  project: process.env.SENTRY_PROJECT || "",

  // Upload source maps when a Sentry auth token is present (local/CI).
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
});