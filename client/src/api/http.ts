import axios from "axios";
import type { ApiEnvelope } from "../types";

const baseURL = import.meta.env.VITE_API_URL || "/api";

export const http = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

export const unwrap = <T>(envelope: ApiEnvelope<T>): T => envelope.data;

export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const responseMessage = error.response?.data?.message;
    if (typeof responseMessage === "string") {
      return responseMessage;
    }

    if (typeof error.message === "string" && error.message.length > 0) {
      return error.message;
    }
  }

  return "Something went wrong. Please try again.";
};
