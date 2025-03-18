import express from "express";
import { registerUser } from "../controllers/identityController.js";

const router = express.Router();

router.post("/register", registerUser);

export default router;
