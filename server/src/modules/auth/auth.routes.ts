import { Router } from "express";
import {
	forgotPassword,
	login,
	logout,
	me,
	register,
	resendVerification,
	resetPassword,
	verifyEmail
} from "./auth.controller.js";
import { requireAuth } from "../../middleware/require-auth.js";

export const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/verify-email", verifyEmail);
authRoutes.post("/resend-verification", resendVerification);
authRoutes.post("/forgot-password", forgotPassword);
authRoutes.post("/reset-password", resetPassword);
authRoutes.post("/logout", logout);
authRoutes.get("/me", requireAuth, me);
