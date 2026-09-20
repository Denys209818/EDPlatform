import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { Request, Response } from "express";
import { HttpError } from "express-openapi-validator/dist/framework/types.js";

@Catch(HttpError)
export class OpenApiExceptionFilter implements ExceptionFilter {
  catch(error: HttpError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    response
      .status(error.status)
      .type("application/problem+json")
      .json({
        type: "https://example.com/errors/validation-error",
        title: error.name ?? "Validation Error",
        status: error.status,
        detail: error.errors?.[0]?.message ?? error.message,
        instance: `${request.protocol}://${request.get("host")}${request.originalUrl}`,
      });
  }
}
