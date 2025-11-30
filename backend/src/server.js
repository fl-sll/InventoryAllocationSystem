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
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api", routes);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await db.sequelize.authenticate();
    console.log("Database connected");
    app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
}

start();
