import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import logger from "./utils/logger.js";
import errorHandler from "./middlewares/errorHandler.js";
import Post from "./models/Post.js";
import mongoose from "mongoose";
import Redis from "ioredis";
import postRouter from "./routes/postRoutes.js";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import connectRabbitMQ from "./utils/rabbitmq.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3008;

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

//rate limiting

const sensetiveEndpointLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensetive endpoint Ratelimit reached for ip: ${req.ip}`);
    res.status(429).send("Too many requests");
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

app.use("/api/posts", sensetiveEndpointLimiter);

// routes
app.use(
  "/api/posts",
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  postRouter
);

app.use(errorHandler);

async function startServer() {
  try {
    await connectRabbitMQ();
    app.listen(PORT, () => {
      logger.info(`Post service started on port ${PORT}`);
    });
  } catch (error) {
    logger.error("failed to connect to server", error);
  }
}

startServer();
