export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_HONO_API_BASE_URL ?? "https://api.example.com",
  sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? "",
};
