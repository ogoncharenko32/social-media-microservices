import { Redis } from "ioredis";
import Search from "../models/Search.js";
import logger from "../utils/logger.js";

const redisClient = new Redis(process.env.REDIS_URL);

async function invalidatePostCache() {
  const cachedKey = `searchPosts:*`;
  await redisClient.del(cachedKey);

  const keys = await redisClient.keys("searchPosts:*");
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
}

export async function searchEventHandler(event) {
  try {
    const newSearchPost = await Search.create({
      postId: event.postId,
      userId: event.userId,
      content: event.content,
      createdAt: event.createdAt,
    });

    await invalidatePostCache();
    logger.info(`New search post created: ${newSearchPost}`);
  } catch (error) {
    logger.error("Error handling creation event for posts", error);
  }
}

export async function postDeletedEventHandler(event) {
  try {
    await Search.findOneAndDelete({ postId: event.postId });
    logger.info(`Deleted search posts for post: ${event.postId}`);
  } catch (error) {
    logger.error("Error handling deletion event for posts", error);
  }
}
