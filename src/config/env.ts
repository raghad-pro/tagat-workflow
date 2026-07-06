
export const ENV = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || "https://workflow.aliservice.site/api/v1",
  API_TIMEOUT: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000,
  ACCESS_TOKEN_KEY: process.env.NEXT_PUBLIC_ACCESS_TOKEN_KEY || "accessToken",
  REFRESH_TOKEN_KEY: process.env.NEXT_PUBLIC_REFRESH_TOKEN_KEY || "refreshToken",
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "Workflow",
  APP_VERSION: "1.0.0",
  APP_ENV: process.env.NODE_ENV || "development",
  DISABLE_DASHBOARD_PROTECTION: process.env.NEXT_PUBLIC_DISABLE_DASHBOARD_PROTECTION === "true",
  IS_MOCK: process.env.NEXT_PUBLIC_IS_MOCK === "true",
};