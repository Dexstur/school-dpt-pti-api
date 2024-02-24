import express from "express";
import {
  register,
  verifyMail,
  forgotPassword,
  login,
  logout,
  resetPassword,
  base,
  allStaff,
  allStudents,
} from "../controllers/user.control";
import { auth0, auth1 } from "../auth/auth";

const router = express.Router();

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.json({
    message: "This is the users endpoint",
    data: null,
  });
});

router.post("/register", register);
router.get("/verify", verifyMail);
router.post("/reset-password", forgotPassword);
router.post("/login", login);
router.post("/logout", logout);
router.put("/reset-password", resetPassword);
router.get("/base", auth0, base);
router.get("/staff", auth0, allStaff);
router.get("/students", auth1, allStudents);

export default router;
