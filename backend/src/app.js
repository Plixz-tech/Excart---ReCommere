import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import routes from "./routes/index.js";
import notFound from "./middlewares/errors/notFound.js";
import errorHandler from "./middlewares/errors/errorHandler.js";


const app = express();

// Security
app.use(helmet());

// Enable CORS
app.use(cors());

// Compress responses
app.use(compression());

// Parse JSON
app.use(express.json());

// Parse URL Encoded Data
app.use(express.urlencoded({ extended: true }));

// Parse Cookies
app.use(cookieParser());

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ExCart API is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api", routes);

// Middlewares
app.use(notFound);
app.use(errorHandler);

export default app;