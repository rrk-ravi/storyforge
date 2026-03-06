import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api-error.js";

export const requireAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.user) {
    next(new ApiError(401, "Authentication required"));
    return;
  }

  if (req.user.role !== "ADMIN") {
    next(new ApiError(403, "Admin access required"));
    return;
  }

  next();
};
