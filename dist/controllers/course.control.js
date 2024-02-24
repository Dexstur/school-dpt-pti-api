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
exports.myCourses = exports.viewCourses = exports.countCourses = exports.addStudent = exports.assignLecturer = exports.viewCourse = exports.createCourse = void 0;
const user_1 = require("../utils/user");
const course_model_1 = __importDefault(require("../models/course.model"));
const task_model_1 = __importDefault(require("../models/task.model"));
const validation_1 = require("../utils/validation");
const user_model_1 = __importDefault(require("../models/user.model"));
const createCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { error, value } = validation_1.courseCreation.validate(req.body);
        if (error) {
            return res.status(400).json({
                message: "Validation error",
                error: error.details[0].message,
            });
        }
        const { name, code, lecturer } = value;
        const validLecturer = lecturer
            ? yield user_model_1.default.findOne({ _id: lecturer, authority: { $gte: 1 } })
            : null;
        const newCourse = validLecturer
            ? new course_model_1.default({ name, code, lecturer: validLecturer._id })
            : new course_model_1.default({ name, code });
        yield newCourse.save();
        return res.status(201).json({
            message: "Course created successfully",
            data: newCourse,
            lecturer: validLecturer ? true : false,
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
exports.createCourse = createCourse;
const viewCourse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.query;
        if (!id) {
            return res.status(400).json({
                message: "Validation error",
                error: "Course id is required",
            });
        }
        const currentUser = yield (0, user_1.authUser)(req);
        if (!currentUser) {
            return res.status(401).json({
                message: "Unauthorized",
                error: "No session",
            });
        }
        const course = yield course_model_1.default.findOne({ _id: id })
            .populate("lecturer", "email lastName firstName")
            .populate("students", "email lastName firstName middleName")
            .populate("assistants", "email lastName firstName")
            .exec();
        if (!course) {
            return res.status(404).json({
                message: "Not Found",
                error: "Course not found",
            });
        }
        const rawCourse = yield course_model_1.default.findById(id);
        const lecturer = (rawCourse === null || rawCourse === void 0 ? void 0 : rawCourse.lecturer)
            ? rawCourse.lecturer.toString() === currentUser.id
            : false;
        return res.json({
            message: "Course details",
            data: course,
            lecturer,
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
exports.viewCourse = viewCourse;
const assignLecturer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { courseId } = req.params;
        const { lecturerId } = req.body;
        if (!lecturerId) {
            return res.status(400).json({
                message: "Validation error",
                error: "Lecturer id is required",
            });
        }
        const course = yield course_model_1.default.findOne({ _id: courseId });
        const lecturer = yield user_model_1.default.findOne({
            _id: lecturerId,
            authority: { $gte: 1 },
        });
        if (!course || !lecturer) {
            return res.status(404).json({
                message: "Not Found",
                error: "Course or lecturer not found",
            });
        }
        if (course.lecturer) {
            if (course.lecturer === lecturer._id) {
                return res.status(409).json({
                    message: "Conflict",
                    error: "Lecturer already assigned to course",
                });
            }
            else {
                const prevLecturer = yield user_model_1.default.findOne({ _id: course.lecturer });
                if (prevLecturer) {
                    prevLecturer.courses = prevLecturer.courses.filter((c) => c.toString() !== course._id.toString());
                    yield prevLecturer.save();
                }
            }
        }
        course.lecturer = lecturer._id;
        lecturer.courses.push(course._id);
        yield course.save();
        yield lecturer.save();
        const openTasks = yield task_model_1.default.find({ _id: courseId, completed: false });
        const promises = openTasks.map((task) => () => __awaiter(void 0, void 0, void 0, function* () {
            task.lecturer = lecturer._id;
            yield task.save();
        }));
        yield Promise.all(promises);
        return res.json({
            message: "Lecturer assigned",
            data: course,
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
exports.assignLecturer = assignLecturer;
const addStudent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { courseId } = req.params;
        const { studentId } = req.body;
        if (!studentId) {
            return res.status(400).json({
                message: "Validation error",
                error: "Student id is required",
            });
        }
        const course = yield course_model_1.default.findById(courseId);
        const student = yield user_model_1.default.findById(studentId);
        if (!course || !student) {
            return res.status(404).json({
                message: "Not Found",
                error: "Course or student not found",
            });
        }
        const currentUser = yield (0, user_1.authUser)(req);
        if (!currentUser) {
            return res.status(401).json({
                message: "Unauthorized",
                error: "No session",
            });
        }
        if (((_a = course.lecturer) === null || _a === void 0 ? void 0 : _a.toString()) !== currentUser.id) {
            return res.status(403).json({
                message: "Forbidden",
                error: "You are not the lecturer of this course",
            });
        }
        if (course.students.includes(student._id)) {
            return res.status(409).json({
                message: "Conflict",
                error: "Student already in course",
            });
        }
        course.students.push(student._id);
        student.courses.push(course._id);
        yield course.save();
        yield student.save();
        return res.json({
            message: "Student added to course",
            data: course,
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
exports.addStudent = addStudent;
const countCourses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const courseCount = yield course_model_1.default.countDocuments();
        return res.json({
            message: "Course count",
            data: courseCount,
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
exports.countCourses = countCourses;
const viewCourses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10 } = req.query;
        const numPage = parseInt(page);
        const numLimit = parseInt(limit);
        if (isNaN(numPage) || isNaN(numLimit)) {
            return res.status(400).json({
                message: "Bad request",
                error: "Invalid page or limit",
            });
        }
        const courses = yield course_model_1.default.find()
            .skip((numPage - 1) * numLimit)
            .limit(numLimit)
            .populate("lecturer", "email lastName firstName")
            .exec();
        const courseCount = yield course_model_1.default.countDocuments();
        const pages = Math.ceil(courseCount / numLimit);
        return res.json({
            message: "Courses",
            data: courses,
            page: numPage,
            pages,
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
exports.viewCourses = viewCourses;
const myCourses = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currentUser = yield (0, user_1.authUser)(req);
        const { page = 1, limit = 10 } = req.query;
        const numPage = parseInt(page);
        const numLimit = parseInt(limit);
        if (!currentUser) {
            return res.status(401).json({
                message: "Unauthorized",
                error: "No session",
            });
        }
        const { id, authority } = currentUser;
        const query = authority > 0
            ? {
                $or: [{ lecturer: id }, { assistants: { $in: [id] } }],
            }
            : {
                students: { $in: [id] },
            };
        const courses = yield course_model_1.default.find(query)
            .skip((numPage - 1) * numLimit)
            .limit(numLimit)
            .populate("lecturer", "email lastName firstName")
            .exec();
        const total = yield course_model_1.default.countDocuments(query);
        const pages = Math.ceil(total / numLimit);
        return res.json({
            message: "Your courses",
            data: courses,
            page: numPage,
            pages,
            total,
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
exports.myCourses = myCourses;
