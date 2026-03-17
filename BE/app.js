require("dotenv").config();
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
var mongoose = require("mongoose");

var indexRouter = require("./routes/index");
var rootRouter = require("./routes/root.route");

var app = express();

// ============================================
// MongoDB Connection
// ============================================
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB Atlas successfully!");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });

// ============================================
// Middleware
// ============================================

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

// CORS - Allow requests from React Native / Expo
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
  })
);
// Handle preflight requests
app.options("*", cors());

app.use(logger("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// ============================================
// Routes
// ============================================
app.use("/", indexRouter);
app.use("/api", rootRouter);

// ============================================
// Error Handling
// ============================================

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // API error response (JSON) for /api routes
  if (req.originalUrl.startsWith("/api")) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }

  // HTML error response for other routes
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
