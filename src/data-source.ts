import { DataSource, type DataSourceOptions } from "typeorm";
import { config } from "dotenv";
import { ConfigService } from "@nestjs/config";
import { join, dirname } from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const configService = new ConfigService();

const passwordFile = configService.get("DB_PASSWORD_FILE", { infer: true });

const currentPassword = readFileSync(passwordFile, "utf8").trim();

export const dataSourceOptions: DataSourceOptions = {
  type: "postgres",
  host: configService.getOrThrow<string>("DB_HOST"),
  port: configService.getOrThrow<number>("DB_PORT"),
  username: configService.getOrThrow<string>("DB_USER"),
  password: currentPassword,
  database: configService.getOrThrow<string>("DB_NAME"),
  migrations: [join(__dirname, "migrations/*.ts")],
  entities: [join(__dirname, "entities/**/*.entity.ts")],
  migrationsTableName: "migrations",
  migrationsRun: false,
  logging: process.env.ENV !== "production",
  extra: {
    connectionLimit: 10,
  },
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
