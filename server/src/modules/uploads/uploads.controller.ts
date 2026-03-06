import type { Request, Response } from "express";
import type { UploadApiResponse } from "cloudinary";
import {
  isCloudinaryConfigured,
  uploadImageBufferToCloudinary
} from "../../config/cloudinary.js";
import { ApiError } from "../../utils/api-error.js";
import { asyncHandler } from "../../utils/async-handler.js";

const uploadFromBuffer = async (buffer: Uint8Array): Promise<UploadApiResponse> => {
  return uploadImageBufferToCloudinary(buffer);
};

export const uploadCoverImage = asyncHandler(async (req: Request, res: Response) => {
  if (!isCloudinaryConfigured) {
    throw new ApiError(503, "Cloud image storage is not configured yet");
  }

  const file = req.file;
  if (!file) {
    throw new ApiError(400, "Please provide an image file");
  }

  if (!file.mimetype.startsWith("image/")) {
    throw new ApiError(400, "Only image uploads are allowed");
  }

  const uploaded = await uploadFromBuffer(file.buffer);

  res.status(201).json({
    success: true,
    message: "Image uploaded",
    data: {
      url: uploaded.secure_url,
      publicId: uploaded.public_id
    }
  });
});
