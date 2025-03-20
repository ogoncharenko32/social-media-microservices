import { Router } from "express";
import multer from "multer";
import logger from "../utils/logger.js";
import { authenticateRequest } from "../middlewares/authMeddleware.js";
import { uploadMedia } from "../controllers/mediaController.js";

const mediaRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}).single("file");

mediaRouter.post(
  "/upload",
  authenticateRequest,
  (req, res, next) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        logger.error("Multer error", err);
        return res.status(400).json({
          success: false,
          message: "Multer error while uploading file",
          error: err.message,
        });
      } else if (err) {
        logger.error("Unknown error", err);
        return res.status(500).json({
          success: false,
          message: "Unknown error while uploading file",
          error: "Internal server error",
        });
      }
      if (!req.file) {
        logger.error("No file uploaded");
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
          error: "No file uploaded",
        });
      }
      next();
    });
  },
  uploadMedia
);

export default mediaRouter;
