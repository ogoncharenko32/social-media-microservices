import Search from "../models/Search.js";
import logger from "../utils/logger.js";

export async function searchEventHandler(event) {
  try {
    const newSearchPost = await Search.create({
      postId: event.postId,
      userId: event.userId,
      content: event.content,
      createdAt: event.createdAt,
    });
    logger.info(`New search post created: ${newSearchPost}`);
  } catch (error) {
    logger.error("Error handling creation event for posts", error);
  }
}
