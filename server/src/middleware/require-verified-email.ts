import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api-error.js";

export const requireVerifiedEmail = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    next(new ApiError(401, "Authentication required"));
    return;
  }

  if (!req.user.isEmailVerified) {
    next(new ApiError(403, "Please verify your email before using this feature"));
    return;
  }

  next();
};
