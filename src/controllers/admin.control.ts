import User from "../models/user.model";
import { Request, Response } from "express";
import sendMail from "../utils/mail";
import { generateKey, generateRegKey } from "../utils/jwt";
import { registrationSchema } from "../utils/validation";
import { authUser } from "../utils/user";
import dev from "../utils/log";

const adminSecret = process.env.ADMIN_SECRET || "admin";
const apiUrl = process.env.API_URL || "";
export const register = async (req: Request, res: Response) => {
  try {
    const { error, value } = registrationSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        message: "Bad Request",
        error: error.message,
      });
    }
    const {
      lastName,
      firstName,
      middleName,
      email,
      password,
      schoolId,
      adminKey,
    } = value;

    const mail = email.trim().toLowerCase();
    if (adminKey !== adminSecret) {
      return res.status(403).json({
        message: "Invalid Credentials",
        error: "Invalid Admin Key",
      });
    }

    const existingUser = await User.findOne({
      email: mail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Invalid Credentials",
        error: "User already exists",
      });
    }

    const user = new User({
      lastName: lastName.toUpperCase(),
      firstName,
      middleName,
      email: mail,
      password,
      schoolId,
      authority: 2,
    });

    await user.save();

    const verifyKey = generateKey(mail);
    const link = `${apiUrl}/users/verify?key=${verifyKey}`;
    dev.log(verifyKey);

    const mailSent = sendMail({
      receipient: mail,
      subject: "PTI - Verify Account",
      html: true,
      content: `Click <a href="${link}" target="_blank" >HERE</a> to verify your account`,
    });

    return res.status(201).json({
      message: "User created successfully",
      data: user,
      mailSent,
    });
  } catch (err: any) {
    console.log(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

export const sayHi = async (req: Request, res: Response) => {
  try {
    const user = await authUser(req);
    console.log(user);
    res.json({
      message: "Welcome to the Department API",
      data: "Hi",
    });
  } catch (err: any) {
    console.log(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

export const invite = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const { type = "student" } = req.query;

    const authority = type.toString() === "staff" ? 1 : 0;
    const mail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: mail });

    if (existingUser) {
      return res.status(409).json({
        message: "Conflict",
        error: "User already exists",
      });
    }

    const key = generateRegKey({ email: mail, authority });

    dev.log(key);
    const mailSent = sendMail({
      receipient: mail,
      subject: "PTI | pngpd - Invitation",
      html: true,
      content: `Click <a href="${apiUrl}/users/register?key=${key}" target="_blank" >HERE</a> to register your account`,
    });

    return res.json({
      message: "Invitation sent",
      data: mailSent,
    });
  } catch (err: any) {
    console.log(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};
