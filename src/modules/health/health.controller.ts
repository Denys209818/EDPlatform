import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from "@nestjs/common";
import { Pool } from "pg";

import { PG_POOL } from "../database/database.constants.js";
import { IHeathDBAvailable } from "./health.types.js";

@Controller("health")
export class HealthController {
  constructor(@Inject(PG_POOL) private readonly _pool: Pool) {}

  @Get()
  public async getHealth(): Promise<IHeathDBAvailable> {
    try {
      await this._pool.query("SELECT 1");
    } catch {
      throw new ServiceUnavailableException("Database is unreachable");
    }

    return { status: "ok", uptime: process.uptime() };
  }
}
