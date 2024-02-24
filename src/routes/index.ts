import express from "express";
import { uploadDocument } from "../uploads/upload";
import { auth0 } from "../auth/auth";

const router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.json({
    message: "Welcome to the Department API",
    data: null,
  });
});

router.post("/upload", auth0, uploadDocument);

export default router;
