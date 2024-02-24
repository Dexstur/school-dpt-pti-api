import { Router } from "express";
import {
  createCourse,
  viewCourse,
  assignLecturer,
  viewCourses,
  countCourses,
  addStudent,
  myCourses,
} from "../controllers/course.control";
import { auth0, auth1, auth2 } from "../auth/auth";

const router = Router();

router.post("/", auth2, createCourse);
router.get("/", auth0, viewCourse);
router.post("/lecturer/:courseId", auth2, assignLecturer);
router.get("/all", auth0, viewCourses);
router.get("/count", auth0, countCourses);
router.post("/student/:courseId", auth1, addStudent);
router.get("/user", auth0, myCourses);

export default router;
