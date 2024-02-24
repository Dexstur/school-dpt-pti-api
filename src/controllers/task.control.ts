import { Request, Response } from "express";
import Task from "../models/task.model";
import User from "../models/user.model";
import Course from "../models/course.model";
import { taskCreation } from "../utils/validation";
import { authUser } from "../utils/user";
import sendMail from "../utils/mail";

export const createTask = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const currentUser = await authUser(req);
    const { error, value } = taskCreation.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        error: error.details[0].message,
      });
    }
    if (!currentUser) {
      return res.status(401).json({
        message: "Unauthorized",
        error: "No session",
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        message: "Not Found",
        error: "Course not found",
      });
    }
    if (!course.lecturer) {
      return res.status(403).json({
        message: "Forbidden",
        error: "Course has no lecturer",
      });
    }
    if (course.lecturer.toString() !== currentUser.id) {
      return res.status(403).json({
        message: "Forbidden",
        error: "You are not the lecturer of this course",
      });
    }

    const { name, description, document, deadline } = value;
    const endDate = new Date(deadline);
    endDate.setHours(13, 59, 59, 999);
    const task = await Task.create({
      name,
      description,
      document,
      deadline: endDate.toISOString(),
      lecturer: course.lecturer,
      course: courseId,
      students: course.students,
    });

    const students = await User.find({ _id: { $in: course.students } });
    const studentEmails = students.map((student) => student.email);
    const promises = studentEmails.map((email) => async () => {
      sendMail({
        receipient: email,
        subject: "New Assignment",
        content: `A new assignment has been created for ${course.name}. Please login to your account to view the details`,
      });
    });

    await Promise.all(promises);

    return res.json({
      message: "Task created",
      data: task,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

export const ongoingTasks = async (req: Request, res: Response) => {
  try {
    const currentUser = await authUser(req);
    if (!currentUser) {
      return res.status(401).json({
        message: "Unauthorized",
        error: "No session",
      });
    }

    const currentDate = new Date();
    const query = {
      $or: [
        { lecturer: currentUser.id },
        { students: { $in: [currentUser.id] } },
      ],
      deadline: { $gt: currentDate.toISOString() },
    };

    const tasks = await Task.find(query)
      .populate("course", "name")
      .populate("lecturer", "firstName lastName email")
      .exec();
    return res.json({
      message: "Ongoing tasks",
      data: tasks,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

export const allOngoingTasks = async (req: Request, res: Response) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const numLimit = Number(limit);
    const numPage = Number(page);
    const openTasks = await Task.find({
      deadline: { $gt: new Date().toISOString() },
    })
      .sort({ deadline: 1 })
      .limit(numLimit)
      .skip((numPage - 1) * numLimit)
      .populate("course", "name")
      .populate("lecturer", "firstName lastName email")
      .exec();

    const count = await Task.countDocuments({
      deadline: { $gt: new Date().toISOString() },
    });
    const pages = Math.ceil(count / numLimit);

    return res.json({
      message: "Ongoing tasks",
      data: openTasks,
      count,
      pages,
      page: numPage,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

export const viewTask = async (req: Request, res: Response) => {
  try {
    const currentUser = await authUser(req);
    if (!currentUser) {
      return res.status(401).json({
        message: "Unauthorized",
        error: "No session",
      });
    }
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({
        message: "Bad Request",
        error: "Task id is required",
      });
    }
    const task = await Task.findById(id)
      .populate("course", "name")
      .populate("lecturer", "firstName lastName email")
      .exec();
    if (!task) {
      return res.status(404).json({
        message: "Not Found",
        error: "Task not found",
      });
    }
    const rawTask = await Task.findById(id);
    const lecturer = currentUser.id === rawTask?.lecturer.toString();
    const student = task.students
      .map((s) => s.toString())
      .includes(currentUser.id);

    return res.json({
      message: "Task details",
      data: task,
      lecturer,
      student,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};
