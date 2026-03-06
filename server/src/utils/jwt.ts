import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "../config/env.js";

export type AccessTokenPayload = JwtPayload & {
  sub: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  isEmailVerified: boolean;
};

export const signAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]
  });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
};
