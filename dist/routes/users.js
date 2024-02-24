"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_control_1 = require("../controllers/user.control");
const auth_1 = require("../auth/auth");
const router = express_1.default.Router();
/* GET users listing. */
router.get("/", function (req, res, next) {
    res.json({
        message: "This is the users endpoint",
        data: null,
    });
});
router.post("/register", user_control_1.register);
router.get("/verify", user_control_1.verifyMail);
router.post("/reset-password", user_control_1.forgotPassword);
router.post("/login", user_control_1.login);
router.post("/logout", user_control_1.logout);
router.put("/reset-password", user_control_1.resetPassword);
router.get("/base", auth_1.auth0, user_control_1.base);
router.get("/staff", auth_1.auth0, user_control_1.allStaff);
router.get("/students", auth_1.auth1, user_control_1.allStudents);
exports.default = router;
