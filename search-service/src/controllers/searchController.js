import Search from "../models/Search.js";
import logger from "../utils/logger.js";

export const searchPostController = async (req, res) => {
  logger.info("Searching for posts");
  try {
    const { query } = req.query;

    const results = await Search.find(
      {
        $text: { $search: query },
      },
      { score: { $meta: "textScore" } }
        .sort({ score: { $meta: "textScore" } })
        .limit(10)
    );

    return res.status(200).json({ success: true, results });
  } catch (error) {
    logger.error("Error searching for posts", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};
