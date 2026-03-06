import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { app } from "./app.js";

const start = async (): Promise<void> => {
  await prisma.$connect();

  const server = app.listen(env.PORT, () => {
    console.log(`API server listening on http://localhost:${env.PORT}`);
  });

  const gracefulShutdown = async (signal: string): Promise<void> => {
    console.log(`${signal} received, closing server`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => {
    void gracefulShutdown("SIGINT");
  });

  process.on("SIGTERM", () => {
    void gracefulShutdown("SIGTERM");
  });
};

try {
  await start();
} catch (error) {
  console.error("Failed to start server", error);
  await prisma.$disconnect();
  process.exit(1);
}
