import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../../middleware/require-auth.js";
import { requireVerifiedEmail } from "../../middleware/require-verified-email.js";
import { uploadCoverImage } from "./uploads.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

export const uploadRoutes = Router();

uploadRoutes.post("/image", requireAuth, requireVerifiedEmail, upload.single("file"), uploadCoverImage);
