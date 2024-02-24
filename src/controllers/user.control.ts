import User from "../models/user.model";
import { Request, Response } from "express";
import sendMail from "../utils/mail";
import { verifyKey, limitedKey, verifyRegKey, generateKey } from "../utils/jwt";
import {
  loginSchema,
  registrationSchema,
  userUpdateSchema,
} from "../utils/validation";
import { authUser } from "../utils/user";
import dev from "../utils/log";
import { store } from "../app";

const clientUrl = process.env.CLIENT_URL || "";

export const register = async (req: Request, res: Response) => {
  try {
    const { key } = req.query;

    if (!key) {
      return res.status(401).json({
        message: "Unauthorized",
        error: "No key provided",
      });
    }

    const regKey = verifyRegKey(key as string);

    if (!regKey) {
      return res.status(401).json({
        message: "Unauthorized",
        error: "Invalid or expired key",
      });
    }

    const { error, value } = registrationSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        message: "Bad Request",
        error: error.message,
      });
    }

    const { lastName, firstName, middleName, email, password, schoolId } =
      value;

    const mail = email.trim().toLowerCase();
    if (mail !== regKey.email) {
      return res.status(401).json({
        message: "Unauthorized",
        error: "Invalid or expired key",
      });
    }

    const existingUser = await User.findOne({ email: mail });

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
      authority: regKey.authority,
      verified: true,
    });

    await user.save();

    req.user = undefined;

    const newSession = new Promise<void>((resolve) => {
      req.session.regenerate((err) => {
        if (err) {
          console.error("Error regenerating session:", err);
          return res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
          });
        }
        resolve();
      });
    });

    await newSession;

    const payload = {
      id: user._id.toString(),
      authority: user.authority,
    };

    req.user = req.session.id;
    req.session.user = payload;
    await new Promise<void>((resolve, reject) => {
      store.set(req.session.id, req.session, (err) => {
        if (err) {
          console.log("Error setting session data");
        }
        resolve();
      });
    });

    const token = generateKey(req.user);

    req.headers = { ...req.headers, Authorization: `Bearer ${token}` };
    res.header("Authorization", `Bearer ${token}`);

    return res.json({
      message: "Registration successful",
      data: user,
      token,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};
export const verifyMail = async (req: Request, res: Response) => {
  try {
    const { key } = req.query;
    if (!key) {
      return res.status(400).json({
        message: "Bad Request",
        error: "No key provided",
      });
    }

    const email = verifyKey(key as string);
    if (!email) {
      return res.status(400).json({
        message: "Bad Request",
        error: "Invalid key",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "Not Found",
        error: "User not found",
      });
    }

    if (user.verified) {
      return res.status(409).json({
        message: "Conflict",
        error: "User already verified",
      });
    }

    user.verified = true;
    await user.save();
    return res.render("verify", {
      title: "PTI | Verification",
      link: clientUrl,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: "Bad Request",
        error: error.message,
      });
    }

    const { email, password } = value;

    const mail = email.trim().toLowerCase();

    const user = await User.findOne({ email: mail });

    if (!user) {
      return res.status(401).json({
        message: "Invalid Credentials",
        error: "Unauthorised",
      });
    }

    if (!user.verified) {
      return res.status(409).json({
        message: "Invalid Credentials",
        error: "User not verified",
      });
    }

    const match = user.comparePassword(password);
    if (!match) {
      return res.status(401).json({
        message: "Invalid Credentials",
        error: "Unauthorised",
      });
    }

    req.user = undefined;

    const newSession = new Promise<void>((resolve) => {
      req.session.regenerate((err) => {
        if (err) {
          console.error("Error regenerating session:", err);
          return res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
          });
        }
        resolve();
      });
    });

    await newSession;
    const payload = {
      id: user._id.toString(),
      authority: user.authority,
    };
    req.user = req.session.id;
    req.session.user = payload;

    await new Promise<void>((resolve, reject) => {
      store.set(req.session.id, req.session, (err) => {
        if (err) {
          console.log("Error setting session data");
        }
        resolve();
      });
    });

    dev.log("cookies");
    dev.log(req.cookies);

    dev.log(req.user);
    const token = req.user ? generateKey(req.user) : null;
    if (token) {
      req.headers = { ...req.headers, Authorization: `Bearer ${token}` };
      res.header("Authorization", `Bearer ${token}`);
    }

    res.json({
      message: "Login successful",
      data: user,
      token,
    });
    // const cookies = res.getHeader("Cookie");
    // dev.log(cookies);
    // dev.log("response session");
    // dev.log(res.session);
    return;
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    if (req.user) {
      store.destroy(req.user, (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({
            message: "Internal Server Error",
            error: err.message,
          });
        } else {
          req.user = undefined;
        }
      });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(502).json({
          message: "Internal Server Error",
          error: err.message,
        });
      }
      res.clearCookie("sid");
      return res.json({
        message: "Logout successful",
      });
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const mail = email.trim().toLowerCase();

    const user = await User.findOne({ email: mail });

    if (!user) {
      return res.status(404).json({
        message: "Not Found",
        error: "User not found",
      });
    }

    const key = limitedKey(mail);

    const mailSent = sendMail({
      receipient: mail,
      subject: "PTI| PNGPD - Password Reset",
      html: true,
      content: `Click <a href="${clientUrl}/users/reset-password?key=${key}" target="_blank" >HERE</a> to reset your password.\n If you did not request this, please ignore this email.`,
    });

    return res.json({
      message: "Password reset link sent",
      data: mailSent,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { key } = req.query;
    const { password, confirmPassword } = req.body;

    if (!key) {
      return res.status(400).json({
        message: "Bad Request",
        error: "No key provided",
      });
    }

    const email = verifyKey(key as string);

    if (!email) {
      return res.status(400).json({
        message: "Bad Request",
        error: "Invalid or expired key",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "Not Found",
        error: "User not found",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Bad Request",
        error: "Password too short",
      });
    }

    if (password !== confirmPassword) {
      return res.status(409).json({
        message: "Bad Request",
        error: "Passwords do not match",
      });
    }

    user.password = password;
    await user.save();

    return res.json({
      message: "Password reset successful",
      data: user,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

export const base = async (req: Request, res: Response) => {
  const user = await authUser(req);
  // console.log(user);
  return res.json({
    message: "Active session",
    data: true,
  });
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.session.user!;
    const { error, value } = userUpdateSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        message: "Bad Request",
        error: error.message,
      });
    }

    const user = await User.findById(id);

    for (const key in value) {
      if (value[key] === "") {
        delete value[key];
      }
    }
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

export const allStudents = async (req: Request, res: Response) => {
  try {
    const { page = "1", limit = "20", search = "" } = req.query;
    const pageNumber = parseInt(page.toString());
    const limitNumber = parseInt(limit.toString());
    const searchParam = search.toString().trim();
    const skip = (pageNumber - 1) * limitNumber;

    const query: any = { authority: 0 };

    if (searchParam) {
      query.$or = [
        { lastName: { $regex: searchParam, $options: "i" } },
        { firstName: { $regex: searchParam, $options: "i" } },
        { middleName: { $regex: searchParam, $options: "i" } },
        { email: { $regex: searchParam, $options: "i" } },
        { schoolId: { $regex: searchParam, $options: "i" } },
      ];
    }

    const students = await User.find(query)
      .skip(skip)
      .limit(limitNumber)
      .sort({ createdAt: -1 })
      .select("-password")
      .exec();

    const studentCount = await User.countDocuments(query);

    const pages = Math.ceil(studentCount / limitNumber);

    return res.json({
      message: "Student list",
      data: students,
      page: pageNumber,
      pages,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

export const allStaff = async (req: Request, res: Response) => {
  try {
    const { page = "1", limit = "20", search = "" } = req.query;
    const pageNumber = parseInt(page.toString());
    const limitNumber = parseInt(limit.toString());
    const searchParam = search.toString().trim();
    const skip = (pageNumber - 1) * limitNumber;

    const query: any = { authority: { $gt: 0 } };

    if (searchParam) {
      query.$or = [
        { lastName: { $regex: searchParam, $options: "i" } },
        { firstName: { $regex: searchParam, $options: "i" } },
        { middleName: { $regex: searchParam, $options: "i" } },
        { email: { $regex: searchParam, $options: "i" } },
        { schoolId: { $regex: searchParam, $options: "i" } },
      ];
    }

    const staff = await User.find(query)
      .skip(skip)
      .limit(limitNumber)
      .sort({ createdAt: -1 })
      .select("-password")
      .exec();

    const staffCount = await User.countDocuments(query);

    const pages = Math.ceil(staffCount / limitNumber);

    return res.json({
      message: "Staff list",
      data: staff,
      page: pageNumber,
      pages,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};
