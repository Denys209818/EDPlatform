import * as path from "path";
import * as OpenApiValidator from "express-openapi-validator";
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { OpenApiExceptionFilter } from "../exceptions/openapi-exception.filter.js";
import { TaskModule } from "./tasks/task.module.js";
import { TestModule } from "./tests/test.module.js";
import { HttpExceptionFilter } from "../exceptions/http-exception.filter.js";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Env, validate } from "../config/env.schema.js";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HealthModule } from "./health/health.module.js";
import { readFile } from "node:fs/promises";
import { UserModule } from "./user/user.module.js";

// Took example from: https://github.com/ahilke/nestjs-with-express-openapi-validator
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"],
      validate,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService<Env, true>) => {
        const passwordFile = config.get("DB_PASSWORD_FILE", { infer: true });

        const currentPassword = (await readFile(passwordFile, "utf8")).trim();

        return {
          type: "postgres",
          host: config.get("DB_HOST", { infer: true }),
          port: config.get("DB_PORT", { infer: true }),
          username: config.get("DB_USER", { infer: true }),
          password: currentPassword,
          database: config.get("DB_NAME", { infer: true }),
        };
      },
    }),
    UserModule,
    HealthModule,
    TaskModule,
    TestModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: OpenApiExceptionFilter },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    const middlewares = OpenApiValidator.middleware({
      apiSpec: path.join(process.cwd(), "openapi/openapi.yaml"),
      ignorePaths: /^\/health/,
      validateRequests: {
        allowUnknownQueryParameters: true,
        coerceTypes: false,
      },
      validateResponses: true,
      validateFormats: "full",
      validateSecurity: false,
    });

    consumer.apply(...middlewares).forRoutes("*");
  }
}
