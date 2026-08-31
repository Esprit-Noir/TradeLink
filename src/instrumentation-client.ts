import * as Sentry from "@sentry/nextjs";

// Client-side SDK initialization.
// DSN is read from NEXT_PUBLIC_SENTRY_DSN so the actual key stays in .env.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NODE_ENV === "production" ? "production" : process.env.NODE_ENV,

  release: process.env.SENTRY_RELEASE,

  dataCollection: {
    // Prefix logs with instrumentation origin for filtering
    // userInfo: false,
    // httpBodies: [],
  },

  // Capture 100% in dev, 10% in production
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
});

// Instrument router navigations
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;