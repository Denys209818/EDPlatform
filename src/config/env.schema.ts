import { z } from "zod";

export const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),

  DB_HOST: z.string().nonempty(),
  DB_PORT: z.coerce.number().int().positive().default(5000),
  DB_USER: z.string().nonempty(),
  DB_NAME: z.string().nonempty(),
  DB_PASSWORD_FILE: z.string().nonempty(),

  DB_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validate(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);

  if (!parsed.success) {
    const lines = parsed.error.errors
      .map((err) => `${err.path.join(".") || "root"}: ${err.message}`)
      .join("\n");

    throw new Error(
      `Невалідна конфігурація\n${lines}\nПорівняй .env.example із .env`,
    );
  }

  return parsed.data;
}
