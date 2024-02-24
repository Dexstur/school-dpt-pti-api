"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyKey = exports.verifyRegKey = exports.limitedKey = exports.generateKey = exports.generateRegKey = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const secretKey = process.env.SESSION_SECRET || "secret";
function generateRegKey(options) {
    const token = jsonwebtoken_1.default.sign(options, secretKey, { expiresIn: "24h" });
    const encoded = Buffer.from(token).toString("base64");
    return encoded;
}
exports.generateRegKey = generateRegKey;
function generateKey(key) {
    const token = jsonwebtoken_1.default.sign({ key }, secretKey, { expiresIn: "24h" });
    const encoded = Buffer.from(token).toString("base64");
    return encoded;
}
exports.generateKey = generateKey;
function limitedKey(key) {
    const token = jsonwebtoken_1.default.sign({ key }, secretKey, { expiresIn: "20m" });
    const encoded = Buffer.from(token).toString("base64");
    return encoded;
}
exports.limitedKey = limitedKey;
const verifyRegKey = (token) => {
    try {
        const decrypt = Buffer.from(token, "base64").toString();
        const decoded = jsonwebtoken_1.default.verify(decrypt, secretKey);
        return decoded;
    }
    catch (_a) {
        return null;
    }
};
exports.verifyRegKey = verifyRegKey;
const verifyKey = (token) => {
    try {
        const decrypt = Buffer.from(token, "base64").toString();
        const decoded = jsonwebtoken_1.default.verify(decrypt, secretKey);
        return decoded.key;
    }
    catch (_a) {
        return null;
    }
};
exports.verifyKey = verifyKey;
