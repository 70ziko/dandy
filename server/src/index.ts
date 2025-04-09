import express from "express";
import { createServer } from "http";
import type { Request, Response } from "express";

import { mongodb } from "./services/mongodb";
import { websocket } from "./services/websocket";
import { guestAuth, rateLimiter, validateRequest } from "./middleware/auth";

import { router as guestRouter } from "./routers/guest.router";
import { router as tableRouter } from "./routers/table.router";
import { errorHandlerPlugin } from "./lib/error-handler.plugin";
import { notFoundPlugin } from "./lib/not-found.plugin";

import prettyLog from "./lib/loggers";

prettyLog.configure({
  showTimestamp: true,
  showLevel: true,
  colors: true,
});

const app = express();
const server = createServer(app);
const port = process.env.PORT || 3001;

websocket.initialize(server);

app.options("*", (req: Request, res: Response) => {
  setCorsHeaders(res);
  res.status(204).end();
});

app.use((req: Request, res: Response, next) => {
  setCorsHeaders(res);
  next();
});

function setCorsHeaders(res: Response): void {
  const allowedOrigins = [
    process.env.CLIENT_URL || "http://client:3000",
    "http://localhost:3000",
  ];

  const origin = res.req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Guest-Id, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Expose-Headers", "X-Guest-Id");
}

app.use(rateLimiter());

app.use(guestAuth);
app.use(guestRouter);

app.use(validateRequest, express.json(), tableRouter);

app.use(notFoundPlugin).use(errorHandlerPlugin);

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);

  process.on("SIGTERM", async () => {
    console.error("SIGTERM received. Shutting down gracefully...");
    await mongodb.close();
    process.exit(0);
  });
});
