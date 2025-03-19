import express from "express";
import {
  loginUser,
  logoutUser,
  refreshTokenController,
  registerUser,
} from "../controllers/identityController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshTokenController);
router.post("/logout", logoutUser);

export default router;
