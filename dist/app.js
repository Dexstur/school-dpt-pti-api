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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.store = void 0;
const dotenv_1 = require("dotenv");
const http_errors_1 = __importDefault(require("http-errors"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const express_session_1 = __importStar(require("express-session"));
const db_config_1 = __importDefault(require("./config/db.config"));
const connectMongo = __importStar(require("connect-mongodb-session"));
const cors_1 = __importDefault(require("cors"));
const uuid_1 = require("uuid");
const token_1 = __importDefault(require("./middleware/token"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const cloudinary_1 = require("cloudinary");
// import { MongoDBStore } from "connect-mongodb-session";
const index_1 = __importDefault(require("./routes/index"));
const users_1 = __importDefault(require("./routes/users"));
const admin_1 = __importDefault(require("./routes/admin"));
const course_1 = __importDefault(require("./routes/course"));
const task_1 = __importDefault(require("./routes/task"));
const submit_1 = __importDefault(require("./routes/submit"));
(0, dotenv_1.config)();
const app = (0, express_1.default)();
const mongoUri = process.env.MONGO_URI || "";
const mongoPassword = process.env.MONGO_PASSWORD || "";
const secret = process.env.SESSION_SECRET || "";
const storeLink = mongoUri.replace("<password>", mongoPassword);
const nodeEnv = process.env.NODE_ENV || "development";
const clientUrl = process.env.CLIENT_URL || "";
const cloud_name = process.env.CLOUD_NAME || "";
const api_key = process.env.CLOUD_KEY || "";
const api_secret = process.env.CLOUD_SECRET || "";
const MongoDBStore = connectMongo.default(express_session_1.default);
cloudinary_1.v2.config({
    cloud_name,
    api_key,
    api_secret,
});
(0, db_config_1.default)();
exports.store = new MongoDBStore({
    uri: storeLink,
    collection: "sessions",
    expires: 1000 * 60 * 60 * 24, // 1 day
});
app.use((0, cors_1.default)({
    origin: [clientUrl, "http://127.0.0.1:7000"],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
}));
app.use((0, express_fileupload_1.default)({
    useTempFiles: true,
}));
// view engine setup
app.set("views", path_1.default.join(__dirname, "..", "views"));
app.set("view engine", "ejs");
if (nodeEnv === "development") {
    app.use((0, morgan_1.default)("dev"));
}
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use(token_1.default);
app.use((0, cookie_parser_1.default)(secret));
app.set("trust proxy", 1);
app.use((0, express_session_1.default)({
    genid: (req) => {
        const id = req.user ? req.user : (0, uuid_1.v4)();
        req.user = id;
        return id;
    },
    secret,
    resave: false,
    saveUninitialized: false,
    store: new express_session_1.MemoryStore({}),
    name: "sid",
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        secure: false,
        sameSite: "none",
        httpOnly: false,
    },
}));
app.use(express_1.default.static(path_1.default.join(__dirname, "..", "public")));
app.use("/", index_1.default);
app.use("/users", users_1.default);
app.use("/admin", admin_1.default);
app.use("/course", course_1.default);
app.use("/task", task_1.default);
app.use("/submit", submit_1.default);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next((0, http_errors_1.default)(404));
});
// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};
    // render the error page
    res.status(err.status || 500);
    res.json({
        message: err.status === 404 ? "Not Found" : "Internal Server Error",
        error: err.message,
    });
});
function sum(a, b) {
    return a + b;
}
exports.default = app;
