import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(error: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    response
      .status(error.getStatus())
      .type("application/problem+json")
      .json({
        type: "https://example.com/errors/validation-error",
        title: error.name ?? "Validation Error",
        status: error.getStatus(),
        detail: error.message,
        instance: `${request.protocol}://${request.get("host")}${request.originalUrl}`,
      });
  }
}
