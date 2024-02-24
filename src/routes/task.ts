import {
  createTask,
  ongoingTasks,
  allOngoingTasks,
  viewTask,
} from "../controllers/task.control";
import { Router } from "express";
import { auth0, auth1, auth2 } from "../auth/auth";

const router = Router();

router.post("/create/:courseId", auth1, createTask);
router.get("/ongoing", auth0, ongoingTasks);
router.get("/ongoing/all", auth2, allOngoingTasks);
router.get("/view", auth0, viewTask);

export default router;
