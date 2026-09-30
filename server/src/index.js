import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { Server } from "socket.io";
import cron from "node-cron";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { registerSockets } from "./sockets/index.js";
import { releaseExpiredHolds } from "./jobs/releaseExpiredHolds.js";
import { paymentWebhook } from "./controllers/bookingController.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: env.clientUrl, methods: ["GET", "POST"] },
});

app.set("io", io);

app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  paymentWebhook
);
app.use(express.json({ limit: "2mb" }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
  })
);

app.use("/api", routes);

registerSockets(io);

cron.schedule("* * * * *", () => releaseExpiredHolds(io));

await connectDB(env.mongodbUri);

server.listen(env.port, () => {
  console.log(`CargoShare API on http://localhost:${env.port}`);
});
