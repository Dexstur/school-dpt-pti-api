"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const upload_1 = require("../uploads/upload");
const auth_1 = require("../auth/auth");
const router = express_1.default.Router();
/* GET home page. */
router.get("/", function (req, res, next) {
    res.json({
        message: "Welcome to the Department API",
        data: null,
    });
});
router.post("/upload", auth_1.auth0, upload_1.uploadDocument);
exports.default = router;
