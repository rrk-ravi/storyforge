import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse } from "cloudinary";
import { env } from "./env.js";

export const isCloudinaryConfigured =
  Boolean(env.CLOUDINARY_CLOUD_NAME) &&
  Boolean(env.CLOUDINARY_API_KEY) &&
  Boolean(env.CLOUDINARY_API_SECRET);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

export const uploadImageBufferToCloudinary = async (buffer: Uint8Array): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "storyforge/covers",
        resource_type: "image"
      },
      (error, result) => {
        if (error || !result) {
          const reason = error instanceof Error ? error : new Error("Upload failed");
          reject(reason);
          return;
        }

        resolve(result);
      }
    );

    stream.end(buffer);
  });
};
