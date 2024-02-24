"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mySubmission = exports.updateSubmission = exports.viewSubmissions = exports.viewSubmission = exports.submitTask = void 0;
const submit_model_1 = __importDefault(require("../models/submit.model"));
const task_model_1 = __importDefault(require("../models/task.model"));
const user_1 = require("../utils/user");
const submitTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { taskId } = req.params;
        const currentUser = yield (0, user_1.authUser)(req);
        if (!currentUser) {
            return res.status(401).json({
                message: "Unauthorized",
                error: "No session",
            });
        }
        if (currentUser.authority !== 0) {
            return res.status(403).json({
                message: "Forbidden",
                error: "You are not a student",
            });
        }
        const { document } = req.body;
        const task = yield task_model_1.default.findById(taskId);
        if (!task) {
            return res.status(404).json({
                message: "Not Found",
                error: "Task not found",
            });
        }
        if (!document) {
            return res.status(400).json({
                message: "Bad Request",
                error: "Document is required",
            });
        }
        const submission = yield submit_model_1.default.create({
            task: taskId,
            title: task.name,
            student: currentUser.id,
            document,
        });
        return res.status(201).json({
            message: "Submission successful",
            data: submission,
        });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
        });
    }
});
exports.submitTask = submitTask;
const viewSubmission = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.query;
        const currentUser = yield (0, user_1.authUser)(req);
        if (!currentUser) {
            return res.status(401).json({
                message: "Unauthorized",
                error: "No session",
            });
        }
        if (!id) {
            return res.status(400).json({
                message: "Bad Request",
                error: "Submission id is required",
            });
        }
        const submission = yield submit_model_1.default.findById(id);
        if (!submission) {
            return res.status(404).json({
                message: "Not Found",
                error: "Submission not found",
            });
        }
        const task = yield task_model_1.default.findById(submission.task);
        if (!task) {
            return res.status(404).json({
                message: "Not Found",
                error: "Task not found",
            });
        }
        const lecturer = task.lecturer.toString() === currentUser.id;
        const student = submission.student.toString() === currentUser.id;
        const admin = currentUser.authority === 2;
        if (!lecturer && !student && !admin) {
            return res.status(403).json({
                message: "Forbidden",
                error: "You are not allowed to view this submission",
            });
        }
        return res.json({
            message: "Submission details",
            data: submission,
        });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
        });
    }
});
exports.viewSubmission = viewSubmission;
const viewSubmissions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.query;
        const currentUser = yield (0, user_1.authUser)(req);
        const task = yield task_model_1.default.findById(id);
        if (!currentUser) {
            return res.status(401).json({
                message: "Unauthorized",
                error: "No session",
            });
        }
        if (!task) {
            return res.status(404).json({
                message: "Not Found",
                error: "Task not found",
            });
        }
        const lecturer = task.lecturer.toString() === currentUser.id;
        const admin = currentUser.authority === 2;
        if (!lecturer && !admin) {
            return res.status(403).json({
                message: "Forbidden",
                error: "You are not allowed to view these submissions",
            });
        }
        const submissions = yield submit_model_1.default.find({ task: id })
            .populate("student", "firstName lastName email")
            .exec();
        return res.json({
            message: "Submissions",
            data: submissions,
        });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
        });
    }
});
exports.viewSubmissions = viewSubmissions;
const updateSubmission = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const currentUser = yield (0, user_1.authUser)(req);
        if (!currentUser) {
            return res.status(401).json({
                message: "Unauthorized",
                error: "No session",
            });
        }
        const submission = yield submit_model_1.default.findById(id);
        if (!submission) {
            return res.status(404).json({
                message: "Not Found",
                error: "Submission not found",
            });
        }
        const task = yield task_model_1.default.findById(submission.task);
        if (!task) {
            return res.status(404).json({
                message: "Not Found",
                error: "Task not found",
            });
        }
        const currentDate = Date.parse(new Date().toString());
        const deadline = Date.parse(task.deadline.toString());
        if (currentDate > deadline) {
            return res.status(400).json({
                message: "Bad Request",
                error: "Deadline has passed",
            });
        }
        const student = currentUser.id === submission.student.toString();
        if (!student) {
            return res.status(403).json({
                message: "Forbidden",
                error: "You are not allowed to update this submission",
            });
        }
        const { document } = req.body;
        if (!document) {
            return res.status(400).json({
                message: "Bad Request",
                error: "Document is required",
            });
        }
        submission.document = document;
        yield submission.save();
        return res.json({
            message: "Submission updated",
            data: submission,
        });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
        });
    }
});
exports.updateSubmission = updateSubmission;
const mySubmission = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currentUser = yield (0, user_1.authUser)(req);
        if (!currentUser) {
            return res.status(401).json({
                message: "Unauthorized",
                error: "No session",
            });
        }
        const { id } = req.query;
        if (!id) {
            return res.status(400).json({
                message: "Bad Request",
                error: "Task id is required",
            });
        }
        const task = yield task_model_1.default.findById(id);
        if (!task) {
            return res.status(404).json({
                message: "Not Found",
                error: "Task not found",
            });
        }
        const submission = yield submit_model_1.default.findOne({
            task: id,
            student: currentUser.id,
        });
        if (!submission) {
            return res.status(404).json({
                message: "Not Found",
                error: "Submission not found",
            });
        }
        const currentDate = Date.parse(new Date().toString());
        const deadline = Date.parse(task.deadline.toString());
        const modify = currentDate < deadline;
        return res.json({
            message: "My submission",
            data: submission,
            modify,
        });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
        });
    }
});
exports.mySubmission = mySubmission;
