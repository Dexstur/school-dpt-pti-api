"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const submit_control_1 = require("../controllers/submit.control");
const express_1 = require("express");
const auth_1 = require("../auth/auth");
const router = (0, express_1.Router)();
router.post("/task/:taskId", auth_1.auth0, submit_control_1.submitTask);
router.get("/view", auth_1.auth1, submit_control_1.viewSubmission);
router.get("/view/all", auth_1.auth1, submit_control_1.viewSubmissions);
router.post("/update/:id", auth_1.auth0, submit_control_1.updateSubmission);
router.get("/student", auth_1.auth0, submit_control_1.mySubmission);
exports.default = router;