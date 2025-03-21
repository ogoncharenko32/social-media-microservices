import logger from "../utils/logger.js";

export const authenticateRequest = (req, res, next) => {
  const userId = req.headers["x-user-id"];
  if (!userId) {
    logger.warn("Access attempt without authentication");
    return res
      .status(401)
      .json({ success: false, error: "User not authenticated" });
  }
  req.user = { userId };
  next();
};
