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
exports.uploadDocument = void 0;
const user_1 = require("../utils/user");
const course_model_1 = __importDefault(require("../models/course.model"));
const task_model_1 = __importDefault(require("../models/task.model"));
const cloudinary_1 = require("cloudinary");
const fs_1 = __importDefault(require("fs"));
const log_1 = __importDefault(require("../utils/log"));
function uploadDocument(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { type, id } = req.query;
            if (!type || !id) {
                return res.status(400).json({
                    message: "Bad request",
                    error: "Type and id are required",
                });
            }
            const currentUser = yield (0, user_1.authUser)(req);
            if (!currentUser) {
                return res.status(401).json({
                    message: "Unauthorized",
                    error: "No session",
                });
            }
            const host = type === "task" ? yield course_model_1.default.findById(id) : yield task_model_1.default.findById(id);
            if (!host) {
                return res.status(404).json({
                    message: "Not Found",
                    error: "Resource not found",
                });
            }
            const { document } = req.files;
            if (!document) {
                return res.status(400).json({
                    message: "Bad request",
                    error: "Document is required",
                });
            }
            const fileName = type === "task"
                ? `${host.name}_${Date.parse(new Date().toString())}`
                : `${host.name}_${currentUser.id}`;
            const uploadDox = yield cloudinary_1.v2.uploader.upload(document.tempFilePath, {
                folder: "moniepaddy",
                public_id: `${fileName}`,
                format: "pdf",
                overwrite: true,
                invalidate: true,
            });
            fs_1.default.unlink(document.tempFilePath, (err) => {
                if (err) {
                    console.error("Error deleting temporary file:", err);
                }
                else {
                    log_1.default.log("Temporary file deleted successfully");
                }
            });
            const data = { url: uploadDox.url };
            return res.json({
                message: "Document uploaded",
                data,
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
}
exports.uploadDocument = uploadDocument;
