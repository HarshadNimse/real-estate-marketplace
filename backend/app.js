const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const env = require("./config/env");
const authRouter = require("./routes/authRoutes");
const adminRouter = require("./routes/adminRoutes");
const propertyRouter = require("./routes/propertyRoutes");
const inquiryRouter = require("./routes/inquiryRoutes");
const favRouter = require("./routes/favouriteRoutes");
const { notFound } = require("./middlewares/notFoundMiddleware");
const { errorHandler } = require("./middlewares/errorMiddleware");

const app = express();

app.use(helmet());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use(
  cors({
    origin: (origin, callback) => {
      // Dev-friendly CORS:
      // - allow local file pages (origin null/undefined/"null")
      // - allow configured origin
      // - allow localhost/127.0.0.1 on any port (common Live Server setups)
      if (!origin || origin === "null") return callback(null, true);

      const allowed = new Set([env.corsOrigin].filter(Boolean));
      if (env.corsOrigin) {
        allowed.add(env.corsOrigin.replace("localhost", "127.0.0.1"));
        allowed.add(env.corsOrigin.replace("127.0.0.1", "localhost"));
      }

      const isLocalhostDev = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/i.test(origin);

      if (allowed.has(origin) || (env.nodeEnv === "development" && isLocalhostDev)) {
        return callback(null, true);
      }

      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "API is healthy.",
  });
});

app.use("/api/auth", authLimiter, authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/properties", propertyRouter);
app.use("/api/inquiries", inquiryRouter);
app.use("/api/favourites", favRouter);

const frontendRoot = path.join(__dirname, "../frontend");
const frontendPages = path.join(frontendRoot, "pages");
app.use("/css", express.static(path.join(frontendRoot, "css")));
app.use("/js", express.static(path.join(frontendRoot, "js")));
app.use(express.static(frontendPages, { index: "index.html" }));
app.get(/^\/(?!api).*/, (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.status(404).sendFile(path.join(frontendPages, "404.html"));
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
