import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import logger from "./utils/logger.js";
import errorHandler from "./middlewares/errorHandler.js";
import router from "./routes/identity-service.js";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import Redis from "ioredis";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3010;

// connect to database
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    logger.info("Connected to database");
  })
  .catch((error) => {
    logger.error(error);
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

//DDos protection

const limiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "identity-service",
  points: 10,
  duration: 1,
  execEvenly: false,
  blockDuration: 5,
});

app.use((req, res, next) => {
  limiter
    .consume(req.ip)
    .then(() => {
      next();
    })
    .catch(() => {
      logger.warn(`Ratelimit reached for ip: ${req.ip}`);
      res.status(429).send("Too many requests");
    });
});

//IP rate limiting

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

app.use("/api/auth/register", sensetiveEndpointLimiter);

// routes
app.use("/api/auth", router);

// error handler
app.use(errorHandler);

// start server
app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`);
});

//unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("unhandledRejection", promise, reason);
});
