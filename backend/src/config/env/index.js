import dotenv from "dotenv";

const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";

dotenv.config({
  path: envFile,
});

const requiredEnv = [
  "NODE_ENV",
  "PORT",
  "MONGO_URI",
  "JWT_SECRET",
  "JWT_EXPIRES_IN",
  "REFRESH_TOKEN_SECRET",
  "REFRESH_TOKEN_EXPIRES_IN",
  "GOOGLE_MAPS_API_KEY",
  "IMEI_API_KEY",
  "GOOGLE_CLIENT_ID",
  "FACEBOOK_APP_ID",
  "FACEBOOK_APP_SECRET",
  "FACEBOOK_GRAPH_API_VERSION",
];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
}

export const env = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: Number(process.env.PORT),
  API_VERSION: process.env.API_VERSION,

  MONGO_URI: process.env.MONGO_URI,

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,

  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN,

  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  IMEI_API_KEY: process.env.IMEI_API_KEY,

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,

  FACEBOOK_APP_ID:
    process.env.FACEBOOK_APP_ID,

  FACEBOOK_APP_SECRET:
    process.env.FACEBOOK_APP_SECRET,

    FACEBOOK_GRAPH_API_VERSION:
  process.env.FACEBOOK_GRAPH_API_VERSION,
};