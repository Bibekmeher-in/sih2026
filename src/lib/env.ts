import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGODB_URI: z
    .string()
    .min(1, "MONGODB_URI is required")
    .default("mongodb://localhost:27017/KISANOVA"),
  GEMINI_API_KEY: z
    .string()
    .min(1, "GEMINI_API_KEY is required")
    .default("dummy_gemini_api_key_for_development"),
  AUTH_SECRET: z
    .string()
    .min(1, "AUTH_SECRET is required")
    .default("development_secret_change_in_production_min_32_chars"),
  NEXTAUTH_URL: z.string().url().optional(),
});

/**
 * Validates and retrieves server-side environment variables.
 * Ensures secrets are never exposed or called on the client.
 */
function validateEnv() {
  if (typeof window !== "undefined") {
    throw new Error("Critical security violation: Server environment variables accessed on client!");
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formattedErrors = result.error.flatten().fieldErrors;
    console.error("❌ Invalid environment variables:", formattedErrors);
    throw new Error(
      `Invalid environment configuration: ${Object.keys(formattedErrors).join(", ")}`
    );
  }

  return result.data;
}

export const env = validateEnv();
