import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from "@nestjs/common";
import { Pool } from "pg";

import { PG_POOL } from "../database/database.constants.js";
import { IHeathDBAvailable } from "./health.types.js";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

@Controller("health")
export class HealthController {
  constructor(@InjectDataSource() private readonly _dataSource: DataSource) {}

  @Get()
  public async getHealth(): Promise<IHeathDBAvailable> {
    try {
      await this._dataSource.query("SELECT 1");
    } catch {
      throw new ServiceUnavailableException("Database is unreachable");
    }

    return { status: "ok", uptime: process.uptime() };
  }
}
