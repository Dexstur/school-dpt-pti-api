"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const saltRounds = Number(process.env.SALT) || 2;
const UserSchema = new mongoose_1.Schema({
    lastName: { type: String, required: true },
    firstName: { type: String, required: true },
    middleName: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    authority: { type: Number, default: 0 },
    schoolId: { type: String, required: true, unique: true },
    verified: { type: Boolean, default: false },
    courses: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "Course" }],
    leave: { type: Boolean, default: false },
    status: { type: String, default: "active" },
}, { timestamps: true });
UserSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = this;
        if (!user.isModified("password"))
            return next();
        try {
            const salt = yield bcryptjs_1.default.genSalt(saltRounds);
            const hashedPassword = yield bcryptjs_1.default.hash(user.password, salt);
            // Set the hashed password
            user.password = hashedPassword;
            next();
        }
        catch (error) {
            console.error(error);
            return next(error);
        }
    });
});
UserSchema.methods.comparePassword = function (password) {
    try {
        return bcryptjs_1.default.compareSync(password, this.password);
    }
    catch (error) {
        throw error;
    }
};
const User = mongoose_1.default.model("User", UserSchema);
exports.default = User;
