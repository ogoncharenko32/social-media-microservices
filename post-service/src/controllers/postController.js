import Post from "../models/Post.js";
import logger from "../utils/logger.js";
import { publishMessage } from "../utils/rabbitmq.js";
import { validatePost } from "../utils/validation.js";

async function invalidatePostCache(req, input) {
  const cachedKey = `post:${input}`;
  await req.redisClient.del(cachedKey);

  const keys = await req.redisClient.keys("posts:*");
  if (keys.length > 0) {
    await req.redisClient.del(keys);
  }
}

export const createPost = async (req, res) => {
  logger.info("Creating post");
  try {
    const { error } = validatePost(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res
        .status(400)
        .json({ success: false, error: error.details[0].message });
    }

    const { title, text, mediaUrls } = req.body;
    const post = await Post.create({
      user: req.user.userId,
      title,
      text,
      mediaUrls: mediaUrls || [],
    });
    logger.info("Post created successfully", post);
    res
      .status(201)
      .json({ success: true, message: "Post created successfully", post });

    await publishMessage("post.created", {
      postId: post._id.toString(),
      userId: post.user.toString(),
      content: post.text,
      createdAt: post.createdAt,
    });

    await invalidatePostCache(req, post._id.toString());
  } catch (error) {
    logger.error("Error creating post", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllPosts = async (req, res) => {
  logger.info("Getting all posts");
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const cacheKey = `posts:${page}:${limit}`;
    const cachedPosts = await req.redisClient.get(cacheKey);
    if (cachedPosts) {
      logger.info("Posts fetched from cache");
      return res
        .status(200)
        .json({ success: true, posts: JSON.parse(cachedPosts) });
    }

    const posts = await Post.find({ user: req.user.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ user: req.user.userId });

    const result = {
      success: true,
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      tatalPosts: total,
    };

    await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));

    logger.info("Posts fetched successfully");
    res.status(200).json(result);
  } catch (error) {
    logger.error("Error fetching posts", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPost = async (req, res) => {
  logger.info("Getting post");
  try {
    const postId = req.params.id;

    const cacheKey = `post:${postId}`;
    const cachedPost = await req.redisClient.get(cacheKey);
    if (cachedPost) {
      logger.info("Post fetched from cache");
      return res
        .status(200)
        .json({ success: true, post: JSON.parse(cachedPost) });
    }

    const post = await Post.findById(postId);
    if (!post) {
      logger.warn("Post not found");
      return res.status(404).json({ success: false, error: "Post not found" });
    }
    await req.redisClient.setex(cacheKey, 300, JSON.stringify(post));

    logger.info("Post fetched successfully");
    res.status(200).json({ success: true, post });
  } catch (error) {
    logger.error("Error fetching post", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deletePost = async (req, res) => {
  logger.info("Deleting post");
  try {
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });
    if (!post) {
      logger.warn("Post not found");
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    //publish post deleted event
    await publishMessage("post.deleted", {
      postId: post._id.toString(),
      userId: req.user.userId,
      mediaUrls: post.mediaUrls,
    });

    await invalidatePostCache(req, post._id.toString());

    logger.info("Post deleted successfully");
    res
      .status(200)
      .json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    logger.error("Error deleting post", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
