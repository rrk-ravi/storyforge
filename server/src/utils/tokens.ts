import crypto from "node:crypto";

export const createRandomToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const createExpiryDate = (minutes: number): Date => {
  return new Date(Date.now() + minutes * 60 * 1000);
};
