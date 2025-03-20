import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import logger from "./utils/logger.js";
import errorHandler from "./middlewares/errorHandler.js";
import mongoose from "mongoose";
import Redis from "ioredis";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import mediaRouter from "./routes/mediaRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3007;

mongoose.connect(process.env.MONGODB_URI).then(() => {
  logger.info("Connected to database");
});

const redisClient = new Redis(process.env.REDIS_URL);

// middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body: ${JSON.stringify(req.body)}`);
  next();
});

app.use("/api/media", mediaRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Media service started on port ${PORT}`);
});

//unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("unhandledRejection", promise, reason);
});
