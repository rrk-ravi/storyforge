import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFound } from "./middleware/not-found.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { storyRoutes } from "./modules/stories/stories.routes.js";
import { uploadRoutes } from "./modules/uploads/uploads.routes.js";

export const app = express();

app.disable("x-powered-by");

if (env.NODE_ENV === "production") {
  // Needed for secure cookies and correct client IP when behind load balancers.
  app.set("trust proxy", 1);
}

app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true
  })
);
app.use(helmet());
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    uptime: process.uptime()
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/uploads", uploadRoutes);

app.use(notFound);
app.use(errorHandler);
