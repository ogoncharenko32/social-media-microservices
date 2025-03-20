import Media from "../models/Media.js";
import { deleteMediaFromCloudinary } from "../utils/cloudinary.js";
import logger from "../utils/logger.js";

export const handlePostDeleted = async (data) => {
  console.log(data);

  const { postId, userId, mediaUrls } = data;
  try {
    const mediaToDelete = await Media.find({
      _id: { $in: mediaUrls },
    });
    for (const media of mediaToDelete) {
      await deleteMediaFromCloudinary(media.publicId);
      await Media.deleteOne({ _id: media._id });

      logger.info(
        `Media deleted: ${media._id} assosiated with post: ${postId}`
      );
    }

    logger.info(`Processed deletion of post: ${postId} by user: ${userId}`);
  } catch (error) {
    logger.error("Error deleting post", error);
  }
};
