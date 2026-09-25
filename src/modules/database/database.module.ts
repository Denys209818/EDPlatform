import { readFile } from "node:fs/promises";

import { Global, Inject, Module, OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool } from "pg";

import { PG_POOL } from "./database.constants.js";
import { Env } from "../../config/env.schema.js";

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const passwordFile = config.get("DB_PASSWORD_FILE", { infer: true });

        const pool = new Pool({
          host: config.get("DB_HOST", { infer: true }),
          port: config.get("DB_PORT", { infer: true }),
          user: config.get("DB_USER", { infer: true }),
          database: config.get("DB_NAME", { infer: true }),
          password: async () => (await readFile(passwordFile, "utf8")).trim(),
        });

        pool.on("error", (error) => {
          console.error("Postgres pool error", error);
        });

        return pool;
      },
    },
  ],
  exports: [PG_POOL],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly _pool: Pool) {}

  public async onApplicationShutdown(): Promise<void> {
    await this._pool.end();
  }
}
