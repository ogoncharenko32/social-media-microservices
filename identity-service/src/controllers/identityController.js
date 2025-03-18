import User from "../models/User.js";
import generateTokens from "../utils/generateToken.js";
import logger from "../utils/logger.js";
import { validateRegistration } from "../utils/validation.js";

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

//refresh token

//logout
