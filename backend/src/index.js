require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const { UPLOADS_DIR } = require("./utils/constants");
const connectDB = require("./config/db");
const cron = require("node-cron");
const { EXPORTS_DIR } = require("./utils/constants");
const { deleteOldFiles } = require("./services/cleanup.service");
const { notFound, errorHandler } = require("./middleware/error.middleware");
const authRouter = require("./routes/auth.routes");
const docRouter = require("./routes/document.routes");
const templateRouter = require("./routes/template.routes");

const app = express();

// CONNECT DATABASE
connectDB();

// MIDDLEWARES
app.use(cors());

app.use(express.json({ limit: "25mb" }));

app.use(express.urlencoded({ extended: true, limit: "25mb" }));

const BackendUrl = process.env.BACKEND_URL;

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// STATIC FILES
app.use("/uploads", express.static(UPLOADS_DIR));
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// HEALTH CHECK
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Veriflow API Running Successfully",
  });
});

// API ROUTES
app.use(`${BackendUrl}auth`, authRouter);

app.use(`${BackendUrl}templates`, templateRouter);

app.use(`${BackendUrl}docs`, docRouter);

// 404 HANDLER
app.use(notFound);

// GLOBAL ERROR HANDLER
app.use(errorHandler);

cron.schedule("0 * * * *", async () => {
  try {
    const twentyFourHours = 24 * 60 * 60 * 1000;
    await deleteOldFiles(EXPORTS_DIR, twentyFourHours);
  } catch (error) {
    console.error("[cleanup] Export cleanup failed:", error.message);
  }
});

// SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
