const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");

const swaggerSpec = require("./config/swagger");
const logger = require("./config/logger");
const { errorHandler } = require("./middleware/errorHandler");

// Routes
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const fastingRoutes = require("./routes/fasting.routes");
const trackerRoutes = require("./routes/tracker.routes");
const postRoutes = require("./routes/post.routes");
const goalRoutes = require("./routes/goal.routes");
const earnRoutes = require("./routes/earn.routes");
const blogRoutes = require("./routes/blog.routes");
const coachRoutes = require("./routes/coach.routes");
const mealRoutes = require("./routes/meal.routes");
const socialRoutes = require("./routes/social.routes");
const notificationRoutes = require("./routes/notification.routes");
const healthRoutes = require("./routes/health.routes");
const appointmentRoutes = require("./routes/appointment.routes");
const shoppingRoutes = require("./routes/shopping.routes");
const challengeRoutes = require("./routes/challenge.routes");
const groupRoutes = require("./routes/group.routes");
const workoutRoutes = require("./routes/workout.routes");
const marketplaceRoutes = require("./routes/marketplace.routes");

const app = express();

// ── Security & parsing ──────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:8081")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (React Native mobile, curl, Postman)
      if (!origin) return cb(null, true);
      // Allow any React Native / Expo origin (they use custom schemes or no origin)
      if (allowedOrigins.includes("*")) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      const error = new Error("Not allowed by CORS");
      error.statusCode = 403;
      cb(error);
    },
    credentials: true,
  })
);

app.use(compression());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// ── HTTP logging ──────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(
    morgan("combined", {
      stream: { write: (msg) => logger.http(msg.trim()) },
    })
  );
}

// ── Global rate limit ─────────────────────────────────────────────
app.use(
  "/api",
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    // The authenticated dashboard polls several independent live resources.
    // Credential endpoints have their own stricter failed-attempt limiter.
    max: Number(process.env.RATE_LIMIT_MAX) || 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests, please slow down." },
  })
);

// ── Swagger docs ──────────────────────────────────────────────────
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Static uploads ────────────────────────────────────────────────
app.use("/uploads", express.static("uploads"));

// ── Health check ──────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ status: "ok", ts: Date.now() }));

// ── API routes ────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/fasting", fastingRoutes);
app.use("/api/tracker", trackerRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/earn", earnRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/coach", coachRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/health-team", healthRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/shopping", shoppingRoutes);
app.use("/api/challenges", challengeRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/marketplace", marketplaceRoutes);

// ── 404 ───────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: "Route not found" }));

// ── Error handler ─────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
