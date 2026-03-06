import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const emptyToUndefined = (value: unknown): unknown => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
};

const optionalString = z.preprocess(emptyToUndefined, z.string().optional());
const optionalPort = z.preprocess(
  (value) => {
    const normalized = emptyToUndefined(value);
    if (normalized === undefined) {
      return undefined;
    }

    return Number(normalized);
  },
  z.number().int().positive().optional()
);
const optionalMailFrom = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .refine((value) => value.includes("@"), "SMTP_FROM must be an email or Name <email>")
    .optional()
);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(24, "JWT_SECRET must be at least 24 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CLIENT_ORIGIN: z.url(),
  APP_BASE_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  SMTP_HOST: optionalString,
  SMTP_PORT: optionalPort,
  SMTP_USER: optionalString,
  SMTP_PASS: optionalString,
  SMTP_FROM: optionalMailFrom,
  CLOUDINARY_CLOUD_NAME: optionalString,
  CLOUDINARY_API_KEY: optionalString,
  CLOUDINARY_API_SECRET: optionalString
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration", parsed.error.issues);
  process.exit(1);
}

export const env = parsed.data;

if (!env.APP_BASE_URL) {
  env.APP_BASE_URL = env.CLIENT_ORIGIN;
}
