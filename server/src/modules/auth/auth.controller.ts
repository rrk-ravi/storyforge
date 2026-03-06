import type { CookieOptions, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendEmail } from "../../utils/mail.js";
import { createExpiryDate, createRandomToken, hashToken } from "../../utils/tokens.js";
import { signAccessToken } from "../../utils/jwt.js";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema
} from "./auth.schemas.js";

const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 1000 * 60 * 60 * 24 * 7
};

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  bio: true,
  role: true,
  isEmailVerified: true,
  createdAt: true
} as const;

const issueSession = (
  res: Response,
  user: { id: string; email: string; name: string; role: "USER" | "ADMIN"; isEmailVerified: boolean }
): void => {
  const token = signAccessToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isEmailVerified: user.isEmailVerified
  });

  res.cookie("accessToken", token, authCookieOptions);
};

const sendVerificationEmail = async (user: { id: string; email: string; name: string }): Promise<void> => {
  const rawToken = createRandomToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = createExpiryDate(60 * 24);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: expiresAt
    }
  });

  const verificationUrl = `${env.APP_BASE_URL}/verify-email?token=${encodeURIComponent(rawToken)}`;

  await sendEmail({
    to: user.email,
    subject: "Verify your StoryForge account",
    text: `Hi ${user.name}, verify your email: ${verificationUrl}`,
    html: `<p>Hi ${user.name},</p><p>Please verify your email address to start publishing:</p><p><a href="${verificationUrl}">Verify Email</a></p>`
  });
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const payload = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({
    where: { email: payload.email.toLowerCase() },
    select: { id: true }
  });

  if (existing) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(payload.password, env.BCRYPT_SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: payload.email.toLowerCase(),
      name: payload.name,
      passwordHash
    },
    select: publicUserSelect
  });

  await sendVerificationEmail(user);

  res.status(201).json({
    success: true,
    message: "Account created. Please verify your email before logging in.",
    data: user
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const payload = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: payload.email.toLowerCase() }
  });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(payload.password, user.passwordHash);
  if (!passwordMatches) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isEmailVerified) {
    throw new ApiError(403, "Please verify your email before logging in");
  }

  issueSession(res, {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isEmailVerified: user.isEmailVerified
  });

  res.json({
    success: true,
    message: "Logged in",
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      bio: user.bio,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt
    }
  });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required");
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: publicUserSelect
  });

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  res.json({
    success: true,
    data: user
  });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie("accessToken", authCookieOptions);

  res.json({
    success: true,
    message: "Logged out"
  });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const payload = verifyEmailSchema.parse(req.body);
  const tokenHash = hashToken(payload.token);

  const user = await prisma.user.findFirst({
    where: {
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: {
        gt: new Date()
      }
    },
    select: publicUserSelect
  });

  if (!user) {
    throw new ApiError(400, "Verification token is invalid or expired");
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerificationTokenHash: null,
      emailVerificationExpiresAt: null
    },
    select: publicUserSelect
  });

  issueSession(res, {
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name,
    role: updatedUser.role,
    isEmailVerified: updatedUser.isEmailVerified
  });

  res.json({
    success: true,
    message: "Email verified successfully",
    data: updatedUser
  });
});

export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  const payload = resendVerificationSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: payload.email.toLowerCase() },
    select: {
      id: true,
      email: true,
      name: true,
      isEmailVerified: true
    }
  });

  if (user && !user.isEmailVerified) {
    await sendVerificationEmail(user);
  }

  res.json({
    success: true,
    message: "If the account exists, a verification email has been sent"
  });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const payload = forgotPasswordSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: payload.email.toLowerCase() },
    select: {
      id: true,
      email: true,
      name: true
    }
  });

  if (user) {
    const rawToken = createRandomToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = createExpiryDate(30);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: expiresAt
      }
    });

    const resetUrl = `${env.APP_BASE_URL}/reset-password?token=${encodeURIComponent(rawToken)}`;

    await sendEmail({
      to: user.email,
      subject: "Reset your StoryForge password",
      text: `Hi ${user.name}, reset your password: ${resetUrl}`,
      html: `<p>Hi ${user.name},</p><p>Use the link below to reset your password:</p><p><a href="${resetUrl}">Reset Password</a></p>`
    });
  }

  res.json({
    success: true,
    message: "If the account exists, a password reset email has been sent"
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const payload = resetPasswordSchema.parse(req.body);
  const tokenHash = hashToken(payload.token);

  const user = await prisma.user.findFirst({
    where: {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: {
        gt: new Date()
      }
    },
    select: {
      id: true
    }
  });

  if (!user) {
    throw new ApiError(400, "Reset token is invalid or expired");
  }

  const passwordHash = await bcrypt.hash(payload.password, env.BCRYPT_SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null
    }
  });

  res.json({
    success: true,
    message: "Password has been reset. You can now log in."
  });
});
