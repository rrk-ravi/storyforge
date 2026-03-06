import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { ApiError } from "../utils/api-error.js";

interface PrismaLikeError {
  code: string;
  meta?: unknown;
}

const isPrismaLikeError = (err: unknown): err is PrismaLikeError => {
  return typeof err === "object" && err !== null && "code" in err;
};

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      details: err.issues
    });
    return;
  }

  if (isPrismaLikeError(err) && err.code === "P2002") {
    res.status(409).json({
      success: false,
      message: "A unique field already exists",
      details: err.meta
    });
    return;
  }

  if (env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
};
