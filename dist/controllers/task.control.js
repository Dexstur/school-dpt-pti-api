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
exports.viewTask = exports.allOngoingTasks = exports.ongoingTasks = exports.createTask = void 0;
const task_model_1 = __importDefault(require("../models/task.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const course_model_1 = __importDefault(require("../models/course.model"));
const validation_1 = require("../utils/validation");
const user_1 = require("../utils/user");
const mail_1 = __importDefault(require("../utils/mail"));
const createTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { courseId } = req.params;
        const currentUser = yield (0, user_1.authUser)(req);
        const { error, value } = validation_1.taskCreation.validate(req.body);
        if (error) {
            return res.status(400).json({
                message: "Validation error",
                error: error.details[0].message,
            });
        }
        if (!currentUser) {
            return res.status(401).json({
                message: "Unauthorized",
                error: "No session",
            });
        }
        const course = yield course_model_1.default.findById(courseId);
        if (!course) {
            return res.status(404).json({
                message: "Not Found",
                error: "Course not found",
            });
        }
        if (!course.lecturer) {
            return res.status(403).json({
                message: "Forbidden",
                error: "Course has no lecturer",
            });
        }
        if (course.lecturer.toString() !== currentUser.id) {
            return res.status(403).json({
                message: "Forbidden",
                error: "You are not the lecturer of this course",
            });
        }
        const { name, description, document, deadline } = value;
        const endDate = new Date(deadline);
        endDate.setHours(13, 59, 59, 999);
        const task = yield task_model_1.default.create({
            name,
            description,
            document,
            deadline: endDate.toISOString(),
            lecturer: course.lecturer,
            course: courseId,
            students: course.students,
        });
        const students = yield user_model_1.default.find({ _id: { $in: course.students } });
        const studentEmails = students.map((student) => student.email);
        const promises = studentEmails.map((email) => () => __awaiter(void 0, void 0, void 0, function* () {
            (0, mail_1.default)({
                receipient: email,
                subject: "New Assignment",
                content: `A new assignment has been created for ${course.name}. Please login to your account to view the details`,
            });
        }));
        yield Promise.all(promises);
        return res.json({
            message: "Task created",
            data: task,
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
        });
    }
});
exports.createTask = createTask;
const ongoingTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currentUser = yield (0, user_1.authUser)(req);
        if (!currentUser) {
            return res.status(401).json({
                message: "Unauthorized",
                error: "No session",
            });
        }
        const currentDate = new Date();
        const query = {
            $or: [
                { lecturer: currentUser.id },
                { students: { $in: [currentUser.id] } },
            ],
            deadline: { $gt: currentDate.toISOString() },
        };
        const tasks = yield task_model_1.default.find(query)
            .populate("course", "name")
            .populate("lecturer", "firstName lastName email")
            .exec();
        return res.json({
            message: "Ongoing tasks",
            data: tasks,
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
        });
    }
});
exports.ongoingTasks = ongoingTasks;
const allOngoingTasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { limit = 20, page = 1 } = req.query;
        const numLimit = Number(limit);
        const numPage = Number(page);
        const openTasks = yield task_model_1.default.find({
            deadline: { $gt: new Date().toISOString() },
        })
            .sort({ deadline: 1 })
            .limit(numLimit)
            .skip((numPage - 1) * numLimit)
            .populate("course", "name")
            .populate("lecturer", "firstName lastName email")
            .exec();
        const count = yield task_model_1.default.countDocuments({
            deadline: { $gt: new Date().toISOString() },
        });
        const pages = Math.ceil(count / numLimit);
        return res.json({
            message: "Ongoing tasks",
            data: openTasks,
            count,
            pages,
            page: numPage,
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
        });
    }
});
exports.allOngoingTasks = allOngoingTasks;
const viewTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const task = yield task_model_1.default.findById(id)
            .populate("course", "name")
            .populate("lecturer", "firstName lastName email")
            .exec();
        if (!task) {
            return res.status(404).json({
                message: "Not Found",
                error: "Task not found",
            });
        }
        const rawTask = yield task_model_1.default.findById(id);
        const lecturer = currentUser.id === (rawTask === null || rawTask === void 0 ? void 0 : rawTask.lecturer.toString());
        const student = task.students
            .map((s) => s.toString())
            .includes(currentUser.id);
        return res.json({
            message: "Task details",
            data: task,
            lecturer,
            student,
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
        });
    }
});
exports.viewTask = viewTask;
