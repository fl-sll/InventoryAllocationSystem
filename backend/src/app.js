import express from "express";
import cors from "cors";
import "dotenv/config";
import routes from "./routes/index.route.js";
import { errorHandler } from "./middleware/errorHandler.js";
import db from "./models/index.js";

const app = express();

const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: allowedOrigins,
  })
);

app.use(express.json());

app.use("/api", routes);

// health check
app.get("/health", (req, res) => res.json({ ok: true }));

app.use(errorHandler);

export async function initApp() {
  await db.sequelize.authenticate();
  return app;
}

export default app;
