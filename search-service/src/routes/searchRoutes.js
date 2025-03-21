import { Router } from "express";
import { authenticateRequest } from "../middlewares/authMeddleware.js";
import { searchPostController } from "../controllers/searchController.js";

const searchRouter = Router();

searchRouter.use(authenticateRequest);

searchRouter.get("/posts", searchPostController);

export default searchRouter;
