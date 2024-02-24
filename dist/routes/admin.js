"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const admin_control_1 = require("../controllers/admin.control");
const auth_1 = require("../auth/auth");
const router = express_1.default.Router();
/* on '/admin' route */
router.post("/register", admin_control_1.register);
router.get("/protected", auth_1.auth0, admin_control_1.sayHi);
router.post("/invite", auth_1.auth2, admin_control_1.invite);
exports.default = router;
