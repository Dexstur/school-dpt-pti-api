"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskCreation = exports.courseCreation = exports.userUpdateSchema = exports.loginSchema = exports.registrationSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.registrationSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(6).required(),
    firstName: joi_1.default.string().required(),
    lastName: joi_1.default.string().required(),
    middleName: joi_1.default.string().allow("").optional(),
    schoolId: joi_1.default.string().required(),
    adminKey: joi_1.default.string().allow("").optional(),
});
exports.loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(6).required(),
});
exports.userUpdateSchema = joi_1.default.object({
    firstName: joi_1.default.string().allow("").optional(),
    lastName: joi_1.default.string().allow("").optional(),
    middleName: joi_1.default.string().allow("").optional(),
    schoolId: joi_1.default.string().allow("").optional(),
});
exports.courseCreation = joi_1.default.object({
    name: joi_1.default.string().min(6).required(),
    code: joi_1.default.string().required(),
    lecturer: joi_1.default.string().optional(),
});
exports.taskCreation = joi_1.default.object({
    name: joi_1.default.string().min(3).required(),
    description: joi_1.default.string().allow("").optional(),
    document: joi_1.default.string().required(),
    deadline: joi_1.default.string().allow("").optional(),
});
