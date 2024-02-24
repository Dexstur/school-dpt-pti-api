"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const log_1 = __importDefault(require("./log"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const user = process.env.GMAIL || "";
const pass = process.env.GMAIL_PASSWORD || "";
const host = process.env.GMAIL_HOST || "";
const port = Number(process.env.GMAIL_PORT) || "";
const transporter = nodemailer_1.default.createTransport({
    host: host,
    port: Number(port),
    secure: true,
    auth: {
        user,
        pass,
    },
});
function sendMail(options) {
    const mailOptions = {
        from: user,
        to: options.receipient,
        subject: options.subject,
        text: options.html ? "" : options.content,
        html: options.html ? options.content : "",
    };
    let result = false;
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error.message);
        }
        else {
            result = true;
            log_1.default.log("Email sent: " + info.response);
        }
    });
    return result;
}
exports.default = sendMail;
