// Звіряє .env.example зі схемою env (npm run check:env).
// Джерело правди — ключі zod-схеми з src/config/env.schema.ts. Правило з
// конвенції: додав змінну в схему → додай у .env.example У ТОМУ Ж коміті,
// інакше цей скрипт (і CI) червоний.
import { readFileSync } from "node:fs";
import { parse } from "dotenv";
import { envSchema } from "../dist/config/env.schema.js";

const schemaKeys = Object.keys(envSchema.shape).sort();
const fileKeys = Object.keys(
  parse(readFileSync(new URL("../.env.example", import.meta.url))),
).sort();

const missing = schemaKeys.filter((k) => !fileKeys.includes(k)); // є в схемі, нема у файлі
const extra = fileKeys.filter((k) => !schemaKeys.includes(k)); // є у файлі, нема в схемі

if (missing.length || extra.length) {
  if (missing.length) console.error(`✗ Нема в .env.example: ${missing.join(", ")}`);
  if (extra.length) console.error(`✗ Зайве у .env.example (у схемі відсутнє): ${extra.join(", ")}`);
  process.exit(1);
}
console.log(`✓ .env.example синхронний зі схемою (${schemaKeys.length} змінних)`);
