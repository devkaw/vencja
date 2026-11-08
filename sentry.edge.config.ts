import * as Sentry from "@sentry/nextjs";

// Error monitoring only: no session replay and no personal data, because screens hold clients' financial data.
Sentry.init({
  dsn: "https://e928221cf072de5d62bd0fd3e8b5b922@o4511339087527936.ingest.us.sentry.io/4511339091460097",
  enabled: process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_SENTRY_DISABLED !== "1",
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
});
