import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;
    const message =
      typeof exceptionResponse === "object" &&
      exceptionResponse !== null &&
      "message" in exceptionResponse
        ? exceptionResponse.message
        : status === HttpStatus.INTERNAL_SERVER_ERROR
          ? "An unexpected error occurred."
          : String(exceptionResponse ?? "Request failed.");

    response.status(status).json({
      error: {
        code: `HTTP_${status}`,
        message,
        requestId: request.headers["x-request-id"] ?? "unknown",
      },
    });
  }
}

