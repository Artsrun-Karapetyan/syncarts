import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  REQUEST_BODY_LIMIT: z.string().min(1).default("50mb"),
  CORS_ORIGINS: z.string().optional(),
});

export function getAppConfig(env: NodeJS.ProcessEnv = process.env) {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error(
      `Invalid backend env: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`,
    );
  }

  return {
    databaseUrl: parsed.data.DATABASE_URL,
    port: parsed.data.PORT,
    requestBodyLimit: parsed.data.REQUEST_BODY_LIMIT,
    corsOrigins: parseCorsOrigins(parsed.data.CORS_ORIGINS),
  };
}

function parseCorsOrigins(value?: string) {
  const origins = value
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins?.length ? origins : true;
}
