/**
 * server.js — Express HTTP API for monitored products (MongoDB via Mongoose).
 *
 * Loads environment variables, connects to MongoDB, exposes JSON routes, and
 * starts a cron-based mock monitor that reuses the same check logic as PATCH.
 */

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cron from "node-cron";
import { connectDB } from "./config/db.js";
import Product from "./models/Product.js";
import Notification from "./models/Notification.js";
import { runMockInventoryCheckOnProduct } from "./services/mockInventoryCheck.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, ".env") });

const PORT = Number.parseInt(process.env.PORT ?? "3001", 10);

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.type("text/plain").send("Inventory Monitor API is running");
});

app.get("/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ _id: -1 }).exec();
    res.json(products);
  } catch (err) {
    console.error("[GET /products]", err);
    res.status(500).json({ error: "Could not load products from the database." });
  }
});

app.post("/products", async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const url = typeof req.body?.url === "string" ? req.body.url.trim() : "";

  if (!name || !url) {
    return res.status(400).json({
      error: "Both name and url are required and cannot be empty.",
    });
  }

  try {
    const now = new Date().toLocaleString();
    const doc = await Product.create({
      name,
      url,
      status: "Out of Stock",
      lastChecked: now,
      statusChanged: false,
      history: [],
    });
    res.status(201).json(doc);
  } catch (err) {
    console.error("[POST /products]", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({
        error: "Invalid product data.",
        details: err.message,
      });
    }
    res.status(500).json({ error: "Could not save the product." });
  }
});

/**
 * PATCH /products/:id/check
 *
 * Manual check from the UI. Delegates to runMockInventoryCheckOnProduct so
 * behavior matches the automatic cron runs (same history + notification rules).
 */
app.patch("/products/:id/check", async (req, res) => {
  const { id } = req.params;

  try {
    const doc = await Product.findById(id).exec();

    if (!doc) {
      return res.status(404).json({ error: "Product not found." });
    }

    await runMockInventoryCheckOnProduct(doc);

    res.json(doc);
  } catch (err) {
    console.error("[PATCH /products/:id/check]", err);
    if (err.name === "CastError") {
      return res.status(400).json({ error: "Invalid product id." });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({
        error: "Invalid product data after check.",
        details: err.message,
      });
    }
    res.status(500).json({ error: "Could not update product status." });
  }
});

app.get("/notifications", async (req, res) => {
  const LIMIT = 10;

  try {
    const items = await Notification.find()
      .sort({ _id: -1 })
      .limit(LIMIT)
      .exec();
    res.json(items);
  } catch (err) {
    console.error("[GET /notifications]", err);
    res
      .status(500)
      .json({ error: "Could not load notifications from the database." });
  }
});

app.delete("/products/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Product.findByIdAndDelete(id).exec();

    if (!deleted) {
      return res.status(404).json({ error: "Product not found." });
    }

    res.status(204).send();
  } catch (err) {
    console.error("[DELETE /products/:id]", err);
    if (err.name === "CastError") {
      return res.status(400).json({ error: "Invalid product id." });
    }
    res.status(500).json({ error: "Could not delete the product." });
  }
});

/**
 * startScheduledMockChecks — register the repeating task with node-cron.
 *
 * What is cron?
 * - A classic way to express schedules (“every minute”, “at 9am”). node-cron
 *   runs a callback on that cadence inside your Node process—no extra worker
 *   app required for this learning project.
 *
 * Why scheduled tasks in monitoring?
 * - Real systems poll sources on a timer. This mimics that: the server checks
 *   every product periodically, not only when a user clicks a button.
 *
 * Pattern: '* * * * *' = every minute (minute, hour, day-of-month, month, weekday).
 */
function startScheduledMockChecks() {
  cron.schedule(
    "* * * * *",
    async () => {
      console.log("[cron] Scheduled mock inventory check starting…");

      try {
        const products = await Product.find().exec();
        let notificationsCreated = 0;

        for (const doc of products) {
          const { notificationCreated } =
            await runMockInventoryCheckOnProduct(doc);
          if (notificationCreated) notificationsCreated += 1;
        }

        console.log(
          `[cron] Finished. Products checked: ${products.length}. Notifications created: ${notificationsCreated}.`
        );
      } catch (err) {
        console.error("[cron] Scheduled check failed:", err.message);
      }
    }
  );

  console.log(
    "[cron] Mock inventory checks scheduled every 1 minute (node-cron)."
  );
}

async function startServer() {
  await connectDB();

  startScheduledMockChecks();

  const server = app.listen(PORT, () => {
    console.log(`Inventory API listening at http://localhost:${PORT}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `\nPort ${PORT} is already in use (another process is listening).\n\n` +
          `Fix options:\n` +
          `  1) Stop the other server (close its terminal, or kill the process).\n` +
          `  2) On macOS, see what is using the port:  lsof -i :${PORT}\n` +
          `  3) Use a different port: set PORT in backend/.env\n` +
          `     (If you change PORT, set frontend VITE_API_URL to match.)\n`
      );
      process.exit(1);
    }
    throw err;
  });
}

startServer().catch((err) => {
  console.error("[server] Failed to start:", err.message);
  process.exit(1);
});
