import * as path from "path";
import * as OpenApiValidator from "express-openapi-validator";
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { OpenApiExceptionFilter } from "../exceptions/openapi-exception.filter.js";
import { TaskModule } from "./tasks/task.module.js";
import { TestModule } from "./tests/test.module.js";
import { HttpExceptionFilter } from "../exceptions/http-exception.filter.js";
import { ConfigModule } from "@nestjs/config";
import { validate } from "../config/env.schema.js";
import { DatabaseModule } from "./database/database.module.js";
import { HealthModule } from "./health/health.module.js";

// Took example from: https://github.com/ahilke/nestjs-with-express-openapi-validator
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"],
      validate,
    }),
    DatabaseModule,
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
