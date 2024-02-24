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
exports.invite = exports.sayHi = exports.register = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const mail_1 = __importDefault(require("../utils/mail"));
const jwt_1 = require("../utils/jwt");
const validation_1 = require("../utils/validation");
const user_1 = require("../utils/user");
const log_1 = __importDefault(require("../utils/log"));
const adminSecret = process.env.ADMIN_SECRET || "admin";
const apiUrl = process.env.API_URL || "";
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { error, value } = validation_1.registrationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                message: "Bad Request",
                error: error.message,
            });
        }
        const { lastName, firstName, middleName, email, password, schoolId, adminKey, } = value;
        const mail = email.trim().toLowerCase();
        if (adminKey !== adminSecret) {
            return res.status(403).json({
                message: "Invalid Credentials",
                error: "Invalid Admin Key",
            });
        }
        const existingUser = yield user_model_1.default.findOne({
            email: mail,
        });
        if (existingUser) {
            return res.status(409).json({
                message: "Invalid Credentials",
                error: "User already exists",
            });
        }
        const user = new user_model_1.default({
            lastName: lastName.toUpperCase(),
            firstName,
            middleName,
            email: mail,
            password,
            schoolId,
            authority: 2,
        });
        yield user.save();
        const verifyKey = (0, jwt_1.generateKey)(mail);
        const link = `${apiUrl}/users/verify?key=${verifyKey}`;
        log_1.default.log(verifyKey);
        const mailSent = (0, mail_1.default)({
            receipient: mail,
            subject: "PTI - Verify Account",
            html: true,
            content: `Click <a href="${link}" target="_blank" >HERE</a> to verify your account`,
        });
        return res.status(201).json({
            message: "User created successfully",
            data: user,
            mailSent,
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
exports.register = register;
const sayHi = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield (0, user_1.authUser)(req);
        console.log(user);
        res.json({
            message: "Welcome to the Department API",
            data: "Hi",
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
exports.sayHi = sayHi;
const invite = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        const { type = "student" } = req.query;
        const authority = type.toString() === "staff" ? 1 : 0;
        const mail = email.trim().toLowerCase();
        const existingUser = yield user_model_1.default.findOne({ email: mail });
        if (existingUser) {
            return res.status(409).json({
                message: "Conflict",
                error: "User already exists",
            });
        }
        const key = (0, jwt_1.generateRegKey)({ email: mail, authority });
        log_1.default.log(key);
        const mailSent = (0, mail_1.default)({
            receipient: mail,
            subject: "PTI | pngpd - Invitation",
            html: true,
            content: `Click <a href="${apiUrl}/users/register?key=${key}" target="_blank" >HERE</a> to register your account`,
        });
        return res.json({
            message: "Invitation sent",
            data: mailSent,
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
exports.invite = invite;
