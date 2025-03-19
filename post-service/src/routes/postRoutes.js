import express from "express";
import { authenticateRequest } from "../middlewares/authMeddleware.js";
import {
  createPost,
  getAllPosts,
  getPost,
  deletePost,
} from "../controllers/postController.js";

const router = express();

router.use(authenticateRequest);

router.post("/create", createPost);

router.get("/", getAllPosts);
router.get("/:id", getPost);
router.delete("/:id", deletePost);

export default router;
