import RefreshToken from "../models/RefreshToken.js";
import User from "../models/User.js";
import generateTokens from "../utils/generateToken.js";
import logger from "../utils/logger.js";
import { validateLogin, validateRegistration } from "../utils/validation.js";

//registration

export const registerUser = async (req, res) => {
  logger.info("Registering user");
  try {
    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res
        .status(400)
        .json({ success: false, error: error.details[0].message });
    }
    const { email, username, password } = req.body;
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      logger.warn("User already exists");
      return res
        .status(400)
        .json({ success: false, error: "User already exists" });
    }
    user = new User({ email, username, password });
    await user.save();
    logger.warn("User registered successfully", user._id);

    const { accessToken, refreshToken } = await generateTokens(user);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("Error registering user", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

//login
export const loginUser = async (req, res) => {
  logger.info("Logging in user");
  try {
    const { error } = validateLogin(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res
        .status(400)
        .json({ success: false, error: error.details[0].message });
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn("User not found");
      return res.status(401).json({ success: false, error: "User not found" });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn("Invalid credentials");
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }
    logger.info("User logged in successfully");
    const { accessToken, refreshToken } = await generateTokens(user);
    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("Error logging in user", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
//refresh token

export const refreshTokenController = async (req, res) => {
  logger.info("Refreshing token");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh token not found");
      return res
        .status(401)
        .json({ success: false, error: "Refresh token not found" });
    }
    const refreshTokenDoc = await RefreshToken.findOne({ token: refreshToken });
    if (!refreshTokenDoc || refreshTokenDoc.expiresAt < Date.now()) {
      logger.warn("Refresh token not found or expired");
      return res
        .status(401)
        .json({ success: false, error: "Refresh token not found or expired" });
    }
    const user = await User.findById(refreshTokenDoc.user);
    if (!user) {
      logger.warn("User not found");
      return res.status(401).json({ success: false, error: "User not found" });
    }
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateTokens(user);
    await RefreshToken.findOneAndDelete({ user: user._id });

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    logger.error("Error refreshing token", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

//logout

export const logoutUser = async (req, res) => {
  logger.info("Logging out user");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      logger.warn("Refresh token not found");
      return res
        .status(401)
        .json({ success: false, error: "Refresh token not found" });
    }

    await RefreshToken.findOneAndDelete({ token: refreshToken });
    logger.info("Refresh token deleted successfully");
    res
      .status(200)
      .json({ success: true, message: "User logged out successfully" });
  } catch (error) {
    logger.error("Error logging out user", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
