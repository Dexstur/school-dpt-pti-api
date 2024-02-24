import express from "express";
import { register, sayHi, invite } from "../controllers/admin.control";
import { auth0, auth2 } from "../auth/auth";

const router = express.Router();

/* on '/admin' route */

router.post("/register", register);
router.get("/protected", auth0, sayHi);
router.post("/invite", auth2, invite);

export default router;
