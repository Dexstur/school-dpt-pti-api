import { config } from "dotenv";
import createError, { HttpError } from "http-errors";
import express, { Request, Response, NextFunction } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import session, { MemoryStore } from "express-session";
import connectDB from "./config/db.config";
import * as connectMongo from "connect-mongodb-session";
import cors from "cors";
import { v4 as uuid } from "uuid";
import handleToken from "./middleware/token";
import fileupload from "express-fileupload";
import { v2 as cloudinary } from "cloudinary";
// import { MongoDBStore } from "connect-mongodb-session";

import indexRouter from "./routes/index";
import usersRouter from "./routes/users";
import adminRouter from "./routes/admin";
import courseRouter from "./routes/course";
import taskRouter from "./routes/task";
import submitRouter from "./routes/submit";

config();
const app = express();

const mongoUri = process.env.MONGO_URI || "";
const mongoPassword = process.env.MONGO_PASSWORD || "";
const secret = (process.env.SESSION_SECRET as string) || "";
const storeLink = mongoUri.replace("<password>", mongoPassword);
const nodeEnv = process.env.NODE_ENV || "development";
const clientUrl = process.env.CLIENT_URL || "";
const cloud_name = process.env.CLOUD_NAME || "";
const api_key = process.env.CLOUD_KEY || "";
const api_secret = process.env.CLOUD_SECRET || "";
const MongoDBStore = connectMongo.default(session);
cloudinary.config({
  cloud_name,
  api_key,
  api_secret,
});

connectDB();
export const store = new MongoDBStore({
  uri: storeLink,
  collection: "sessions",
  expires: 1000 * 60 * 60 * 24, // 1 day
});

app.use(
  cors({
    origin: [clientUrl, "http://127.0.0.1:7000"],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);
app.use(
  fileupload({
    useTempFiles: true,
  })
);
// view engine setup
app.set("views", path.join(__dirname, "..", "views"));
app.set("view engine", "ejs");
if (nodeEnv === "development") {
  app.use(logger("dev"));
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(handleToken);
app.use(cookieParser(secret));
app.set("trust proxy", 1);
app.use(
  session({
    genid: (req) => {
      const id = req.user ? req.user : uuid();
      req.user = id;
      return id;
    },
    secret,
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({}),
    name: "sid",
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      secure: false,
      sameSite: "none",
      httpOnly: false,
    },
  })
);
app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/admin", adminRouter);
app.use("/course", courseRouter);
app.use("/task", taskRouter);
app.use("/submit", submitRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (
  err: HttpError,
  req: Request,
  res: Response,
  next: NextFunction
) {
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

function sum(a: number, b: number) {
  return a + b;
}

export default app;
