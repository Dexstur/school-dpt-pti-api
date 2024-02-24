import {
  submitTask,
  viewSubmission,
  viewSubmissions,
  updateSubmission,
  mySubmission,
} from "../controllers/submit.control";
import { Router } from "express";
import { auth0, auth1, auth2 } from "../auth/auth";

const router = Router();

router.post("/task/:taskId", auth0, submitTask);
router.get("/view", auth1, viewSubmission);
router.get("/view/all", auth1, viewSubmissions);
router.post("/update/:id", auth0, updateSubmission);
router.get("/student", auth0, mySubmission);

export default router;
