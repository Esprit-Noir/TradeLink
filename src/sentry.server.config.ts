import * as Sentry from "@sentry/nextjs";

// Server-side SDK initialization (Node.js runtime).
Sentry.init({
  dsn: process.env.SENTRY_DSN,

  dataCollection: {
    // userInfo: false,
    // httpBodies: [],
  },

  // Capture 100% in dev, 10% in production
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
});