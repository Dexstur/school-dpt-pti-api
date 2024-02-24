"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const nodeEnv = process.env.NODE_ENV || "";
const dev = {
    log: (msg) => {
        if (nodeEnv === "development") {
            console.log(msg);
        }
    },
    error: (msg) => {
        if (nodeEnv === "development") {
            console.error(msg);
        }
    },
};
exports.default = dev;
