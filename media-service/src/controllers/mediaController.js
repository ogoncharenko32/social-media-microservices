import Media from "../models/Media.js";
import { uploadMediaToCloudinary } from "../utils/cloudinary.js";
import logger from "../utils/logger.js";

export const uploadMedia = async (req, res) => {
  logger.info("Media upload started");
  try {
    if (!req.file) {
      logger.error("No file uploaded");
      return res
        .status(400)
        .json({ success: false, error: "No file uploaded" });
    }

    const { originalname, mimetype, buffer } = req.file;
    const userId = req.user.userId;

    logger.info(`Feliname details: ${originalname}, ${mimetype}, ${userId}`);
    logger.info("Uploading to cloudinary started");

    const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file);
    logger.info(
      `Uploading to cloudinary completed. Public ID: ${cloudinaryUploadResult.public_id}`
    );
    const media = await Media.create({
      publicId: cloudinaryUploadResult.public_id,
      originalName: originalname,
      mimeType: mimetype,
      url: cloudinaryUploadResult.secure_url,
      userId,
    });

    return res
      .status(201)
      .json({ success: true, message: "Media uploaded successfully", media });
  } catch (error) {
    logger.error("Error uploading media", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
