import Search from "../models/Search.js";
import logger from "../utils/logger.js";

export const searchPostController = async (req, res) => {
  logger.info("Searching for posts");
  try {
    const { query } = req.query;

    const cacheKey = `searchPosts:${query}`;
    const cachedPosts = await req.redisClient.get(cacheKey);
    if (cachedPosts) {
      logger.info("Search posts fetched from cache");
      return res
        .status(200)
        .json({ success: true, posts: JSON.parse(cachedPosts) });
    }

    const results = await Search.find({
      content: {
        $regex: query,
        $options: "i",
      },
    })
      .sort({ createdAt: -1, _id: -1 })
      .limit(10);

    await req.redisClient.setex(cacheKey, 300, JSON.stringify(results));

    logger.info("Search posts fetched from database");
    return res.status(200).json({ success: true, results });
  } catch (error) {
    logger.error("Error searching for posts", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};
