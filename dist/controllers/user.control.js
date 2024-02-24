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
exports.allStaff = exports.allStudents = exports.updateProfile = exports.base = exports.resetPassword = exports.forgotPassword = exports.logout = exports.login = exports.verifyMail = exports.register = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const mail_1 = __importDefault(require("../utils/mail"));
const jwt_1 = require("../utils/jwt");
const validation_1 = require("../utils/validation");
const user_1 = require("../utils/user");
const log_1 = __importDefault(require("../utils/log"));
const app_1 = require("../app");
const clientUrl = process.env.CLIENT_URL || "";
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { key } = req.query;
        if (!key) {
            return res.status(401).json({
                message: "Unauthorized",
                error: "No key provided",
            });
        }
        const regKey = (0, jwt_1.verifyRegKey)(key);
        if (!regKey) {
            return res.status(401).json({
                message: "Unauthorized",
                error: "Invalid or expired key",
            });
        }
        const { error, value } = validation_1.registrationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                message: "Bad Request",
                error: error.message,
            });
        }
        const { lastName, firstName, middleName, email, password, schoolId } = value;
        const mail = email.trim().toLowerCase();
        if (mail !== regKey.email) {
            return res.status(401).json({
                message: "Unauthorized",
                error: "Invalid or expired key",
            });
        }
        const existingUser = yield user_model_1.default.findOne({ email: mail });
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
            authority: regKey.authority,
            verified: true,
        });
        yield user.save();
        req.user = undefined;
        const newSession = new Promise((resolve) => {
            req.session.regenerate((err) => {
                if (err) {
                    console.error("Error regenerating session:", err);
                    return res.status(500).json({
                        message: "Internal Server Error",
                        error: err.message,
                    });
                }
                resolve();
            });
        });
        yield newSession;
        const payload = {
            id: user._id.toString(),
            authority: user.authority,
        };
        req.user = req.session.id;
        req.session.user = payload;
        yield new Promise((resolve, reject) => {
            app_1.store.set(req.session.id, req.session, (err) => {
                if (err) {
                    console.log("Error setting session data");
                }
                resolve();
            });
        });
        const token = (0, jwt_1.generateKey)(req.user);
        req.headers = Object.assign(Object.assign({}, req.headers), { Authorization: `Bearer ${token}` });
        res.header("Authorization", `Bearer ${token}`);
        return res.json({
            message: "Registration successful",
            data: user,
            token,
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
exports.register = register;
const verifyMail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { key } = req.query;
        if (!key) {
            return res.status(400).json({
                message: "Bad Request",
                error: "No key provided",
            });
        }
        const email = (0, jwt_1.verifyKey)(key);
        if (!email) {
            return res.status(400).json({
                message: "Bad Request",
                error: "Invalid key",
            });
        }
        const user = yield user_model_1.default.findOne({ email });
        if (!user) {
            return res.status(404).json({
                message: "Not Found",
                error: "User not found",
            });
        }
        if (user.verified) {
            return res.status(409).json({
                message: "Conflict",
                error: "User already verified",
            });
        }
        user.verified = true;
        yield user.save();
        return res.render("verify", {
            title: "PTI | Verification",
            link: clientUrl,
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
exports.verifyMail = verifyMail;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { error, value } = validation_1.loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                message: "Bad Request",
                error: error.message,
            });
        }
        const { email, password } = value;
        const mail = email.trim().toLowerCase();
        const user = yield user_model_1.default.findOne({ email: mail });
        if (!user) {
            return res.status(401).json({
                message: "Invalid Credentials",
                error: "Unauthorised",
            });
        }
        if (!user.verified) {
            return res.status(409).json({
                message: "Invalid Credentials",
                error: "User not verified",
            });
        }
        const match = user.comparePassword(password);
        if (!match) {
            return res.status(401).json({
                message: "Invalid Credentials",
                error: "Unauthorised",
            });
        }
        req.user = undefined;
        const newSession = new Promise((resolve) => {
            req.session.regenerate((err) => {
                if (err) {
                    console.error("Error regenerating session:", err);
                    return res.status(500).json({
                        message: "Internal Server Error",
                        error: err.message,
                    });
                }
                resolve();
            });
        });
        yield newSession;
        const payload = {
            id: user._id.toString(),
            authority: user.authority,
        };
        req.user = req.session.id;
        req.session.user = payload;
        yield new Promise((resolve, reject) => {
            app_1.store.set(req.session.id, req.session, (err) => {
                if (err) {
                    console.log("Error setting session data");
                }
                resolve();
            });
        });
        log_1.default.log("cookies");
        log_1.default.log(req.cookies);
        log_1.default.log(req.user);
        const token = req.user ? (0, jwt_1.generateKey)(req.user) : null;
        if (token) {
            req.headers = Object.assign(Object.assign({}, req.headers), { Authorization: `Bearer ${token}` });
            res.header("Authorization", `Bearer ${token}`);
        }
        res.json({
            message: "Login successful",
            data: user,
            token,
        });
        // const cookies = res.getHeader("Cookie");
        // dev.log(cookies);
        // dev.log("response session");
        // dev.log(res.session);
        return;
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
        });
    }
});
exports.login = login;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (req.user) {
            app_1.store.destroy(req.user, (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({
                        message: "Internal Server Error",
                        error: err.message,
                    });
                }
                else {
                    req.user = undefined;
                }
            });
        }
        req.session.destroy((err) => {
            if (err) {
                return res.status(502).json({
                    message: "Internal Server Error",
                    error: err.message,
                });
            }
            res.clearCookie("sid");
            return res.json({
                message: "Logout successful",
            });
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
exports.logout = logout;
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        const mail = email.trim().toLowerCase();
        const user = yield user_model_1.default.findOne({ email: mail });
        if (!user) {
            return res.status(404).json({
                message: "Not Found",
                error: "User not found",
            });
        }
        const key = (0, jwt_1.limitedKey)(mail);
        const mailSent = (0, mail_1.default)({
            receipient: mail,
            subject: "PTI| PNGPD - Password Reset",
            html: true,
            content: `Click <a href="${clientUrl}/users/reset-password?key=${key}" target="_blank" >HERE</a> to reset your password.\n If you did not request this, please ignore this email.`,
        });
        return res.json({
            message: "Password reset link sent",
            data: mailSent,
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
exports.forgotPassword = forgotPassword;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { key } = req.query;
        const { password, confirmPassword } = req.body;
        if (!key) {
            return res.status(400).json({
                message: "Bad Request",
                error: "No key provided",
            });
        }
        const email = (0, jwt_1.verifyKey)(key);
        if (!email) {
            return res.status(400).json({
                message: "Bad Request",
                error: "Invalid or expired key",
            });
        }
        const user = yield user_model_1.default.findOne({ email });
        if (!user) {
            return res.status(404).json({
                message: "Not Found",
                error: "User not found",
            });
        }
        if (password.length < 6) {
            return res.status(400).json({
                message: "Bad Request",
                error: "Password too short",
            });
        }
        if (password !== confirmPassword) {
            return res.status(409).json({
                message: "Bad Request",
                error: "Passwords do not match",
            });
        }
        user.password = password;
        yield user.save();
        return res.json({
            message: "Password reset successful",
            data: user,
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
exports.resetPassword = resetPassword;
const base = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield (0, user_1.authUser)(req);
    // console.log(user);
    return res.json({
        message: "Active session",
        data: true,
    });
});
exports.base = base;
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.session.user;
        const { error, value } = validation_1.userUpdateSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                message: "Bad Request",
                error: error.message,
            });
        }
        const user = yield user_model_1.default.findById(id);
        for (const key in value) {
            if (value[key] === "") {
                delete value[key];
            }
        }
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
        });
    }
});
exports.updateProfile = updateProfile;
const allStudents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = "1", limit = "20", search = "" } = req.query;
        const pageNumber = parseInt(page.toString());
        const limitNumber = parseInt(limit.toString());
        const searchParam = search.toString().trim();
        const skip = (pageNumber - 1) * limitNumber;
        const query = { authority: 0 };
        if (searchParam) {
            query.$or = [
                { lastName: { $regex: searchParam, $options: "i" } },
                { firstName: { $regex: searchParam, $options: "i" } },
                { middleName: { $regex: searchParam, $options: "i" } },
                { email: { $regex: searchParam, $options: "i" } },
                { schoolId: { $regex: searchParam, $options: "i" } },
            ];
        }
        const students = yield user_model_1.default.find(query)
            .skip(skip)
            .limit(limitNumber)
            .sort({ createdAt: -1 })
            .select("-password")
            .exec();
        const studentCount = yield user_model_1.default.countDocuments(query);
        const pages = Math.ceil(studentCount / limitNumber);
        return res.json({
            message: "Student list",
            data: students,
            page: pageNumber,
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
exports.allStudents = allStudents;
const allStaff = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = "1", limit = "20", search = "" } = req.query;
        const pageNumber = parseInt(page.toString());
        const limitNumber = parseInt(limit.toString());
        const searchParam = search.toString().trim();
        const skip = (pageNumber - 1) * limitNumber;
        const query = { authority: { $gt: 0 } };
        if (searchParam) {
            query.$or = [
                { lastName: { $regex: searchParam, $options: "i" } },
                { firstName: { $regex: searchParam, $options: "i" } },
                { middleName: { $regex: searchParam, $options: "i" } },
                { email: { $regex: searchParam, $options: "i" } },
                { schoolId: { $regex: searchParam, $options: "i" } },
            ];
        }
        const staff = yield user_model_1.default.find(query)
            .skip(skip)
            .limit(limitNumber)
            .sort({ createdAt: -1 })
            .select("-password")
            .exec();
        const staffCount = yield user_model_1.default.countDocuments(query);
        const pages = Math.ceil(staffCount / limitNumber);
        return res.json({
            message: "Staff list",
            data: staff,
            page: pageNumber,
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
exports.allStaff = allStaff;
