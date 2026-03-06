import { http, unwrap } from "./http";
import type { ApiEnvelope } from "../types";

interface UploadImageResponse {
  url: string;
  publicId: string;
}

export const uploadsApi = {
  uploadCoverImage: async (file: File): Promise<UploadImageResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await http.post<ApiEnvelope<UploadImageResponse>>("/uploads/image", formData);
    return unwrap(data);
  }
};
