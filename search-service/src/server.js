import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import logger from "./utils/logger.js";
import errorHandler from "./middlewares/errorHandler.js";
import Search from "./models/Search.js";
import mongoose from "mongoose";
import Redis from "ioredis";
import searchRouter from "./routes/searchRoutes.js";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import connectRabbitMQ, { consumeEvent } from "./utils/rabbitmq.js";
import {
  postDeletedEventHandler,
  searchEventHandler,
} from "./eventHandlers/searchEventHandler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3006;

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

app.use(
  "/api/search",
  (req, res, next) => {
    req.redisClient = redisClient;
    next();
  },
  searchRouter
);

app.use(errorHandler);

async function startServer() {
  try {
    await connectRabbitMQ();

    //consume events
    await consumeEvent("post.deleted", postDeletedEventHandler);
    await consumeEvent("post.created", searchEventHandler);

    app.listen(PORT, () => {
      logger.info(`Search service started on port ${PORT}`);
    });
  } catch (error) {
    logger.error("failed to connect to server", error);
    process.exit(1);
  }
}

startServer();
