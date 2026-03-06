import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { ApiError } from "../utils/api-error.js";
import { verifyAccessToken } from "../utils/jwt.js";

const clearAuthCookie = (res: Response): void => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax"
  });
};

const readToken = (req: Request): string | null => {
  const cookieToken = req.cookies?.accessToken as string | undefined;
  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
};

const attachUser = (req: Request, token: string): void => {
  const payload = verifyAccessToken(token);
  req.user = {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    isEmailVerified: payload.isEmailVerified
  };
};

export const attachOptionalUser = (req: Request, res: Response, next: NextFunction): void => {
  const token = readToken(req);

  if (!token) {
    next();
    return;
  }

  try {
    attachUser(req, token);
  } catch {
    req.user = undefined;
    clearAuthCookie(res);
  }

  next();
};

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const token = readToken(req);

  if (!token) {
    next(new ApiError(401, "Authentication required"));
    return;
  }

  try {
    attachUser(req, token);
    next();
  } catch {
    clearAuthCookie(res);
    next(new ApiError(401, "Invalid or expired session"));
  }
};
