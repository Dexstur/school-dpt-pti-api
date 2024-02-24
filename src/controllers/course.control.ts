import { Request, Response } from "express";
import { authUser } from "../utils/user";
import Course from "../models/course.model";
import Task from "../models/task.model";
import { courseCreation } from "../utils/validation";
import User from "../models/user.model";
import sendMail from "../utils/mail";
import dev from "../utils/log";

export const createCourse = async (req: Request, res: Response) => {
  try {
    const { error, value } = courseCreation.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: "Validation error",
        error: error.details[0].message,
      });
    }

    const { name, code, lecturer } = value;

    const validLecturer = lecturer
      ? await User.findOne({ _id: lecturer, authority: { $gte: 1 } })
      : null;

    const newCourse = validLecturer
      ? new Course({ name, code, lecturer: validLecturer._id })
      : new Course({ name, code });
    await newCourse.save();

    return res.status(201).json({
      message: "Course created successfully",
      data: newCourse,
      lecturer: validLecturer ? true : false,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

export const viewCourse = async (req: Request, res: Response) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({
        message: "Validation error",
        error: "Course id is required",
      });
    }

    const currentUser = await authUser(req);
    if (!currentUser) {
      return res.status(401).json({
        message: "Unauthorized",
        error: "No session",
      });
    }

    const course = await Course.findOne({ _id: id })
      .populate("lecturer", "email lastName firstName")
      .populate("students", "email lastName firstName middleName")
      .populate("assistants", "email lastName firstName")
      .exec();

    if (!course) {
      return res.status(404).json({
        message: "Not Found",
        error: "Course not found",
      });
    }

    const rawCourse = await Course.findById(id)!;
    const lecturer = rawCourse?.lecturer
      ? rawCourse.lecturer.toString() === currentUser.id
      : false;

    return res.json({
      message: "Course details",
      data: course,
      lecturer,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

export const assignLecturer = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const { lecturerId } = req.body;

    if (!lecturerId) {
      return res.status(400).json({
        message: "Validation error",
        error: "Lecturer id is required",
      });
    }

    const course = await Course.findOne({ _id: courseId });
    const lecturer = await User.findOne({
      _id: lecturerId,
      authority: { $gte: 1 },
    });

    if (!course || !lecturer) {
      return res.status(404).json({
        message: "Not Found",
        error: "Course or lecturer not found",
      });
    }

    if (course.lecturer) {
      if (course.lecturer === lecturer._id) {
        return res.status(409).json({
          message: "Conflict",
          error: "Lecturer already assigned to course",
        });
      } else {
        const prevLecturer = await User.findOne({ _id: course.lecturer });
        if (prevLecturer) {
          prevLecturer.courses = prevLecturer.courses.filter(
            (c) => c.toString() !== course._id.toString()
          );
          await prevLecturer.save();
        }
      }
    }

    course.lecturer = lecturer._id;
    lecturer.courses.push(course._id);
    await course.save();
    await lecturer.save();

    const openTasks = await Task.find({ _id: courseId, completed: false });

    const promises = openTasks.map((task) => async () => {
      task.lecturer = lecturer._id;
      await task.save();
    });

    await Promise.all(promises);

    return res.json({
      message: "Lecturer assigned",
      data: course,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

export const addStudent = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({
        message: "Validation error",
        error: "Student id is required",
      });
    }

    const course = await Course.findById(courseId);
    const student = await User.findById(studentId);

    if (!course || !student) {
      return res.status(404).json({
        message: "Not Found",
        error: "Course or student not found",
      });
    }

    const currentUser = await authUser(req);

    if (!currentUser) {
      return res.status(401).json({
        message: "Unauthorized",
        error: "No session",
      });
    }

    if (course.lecturer?.toString() !== currentUser.id) {
      return res.status(403).json({
        message: "Forbidden",
        error: "You are not the lecturer of this course",
      });
    }

    if (course.students.includes(student._id)) {
      return res.status(409).json({
        message: "Conflict",
        error: "Student already in course",
      });
    }

    course.students.push(student._id);
    student.courses.push(course._id);
    await course.save();
    await student.save();

    return res.json({
      message: "Student added to course",
      data: course,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

export const countCourses = async (req: Request, res: Response) => {
  try {
    const courseCount = await Course.countDocuments();

    return res.json({
      message: "Course count",
      data: courseCount,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

export const viewCourses = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const numPage = parseInt(page as string);
    const numLimit = parseInt(limit as string);

    if (isNaN(numPage) || isNaN(numLimit)) {
      return res.status(400).json({
        message: "Bad request",
        error: "Invalid page or limit",
      });
    }
    const courses = await Course.find()
      .skip((numPage - 1) * numLimit)
      .limit(numLimit)
      .populate("lecturer", "email lastName firstName")
      .exec();

    const courseCount = await Course.countDocuments();
    const pages = Math.ceil(courseCount / numLimit);

    return res.json({
      message: "Courses",
      data: courses,
      page: numPage,
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

export const myCourses = async (req: Request, res: Response) => {
  try {
    const currentUser = await authUser(req);
    const { page = 1, limit = 10 } = req.query;
    const numPage = parseInt(page as string);
    const numLimit = parseInt(limit as string);
    if (!currentUser) {
      return res.status(401).json({
        message: "Unauthorized",
        error: "No session",
      });
    }

    const { id, authority } = currentUser;
    const query: any =
      authority > 0
        ? {
            $or: [{ lecturer: id }, { assistants: { $in: [id] } }],
          }
        : {
            students: { $in: [id] },
          };
    const courses = await Course.find(query)
      .skip((numPage - 1) * numLimit)
      .limit(numLimit)
      .populate("lecturer", "email lastName firstName")
      .exec();
    const total = await Course.countDocuments(query);
    const pages = Math.ceil(total / numLimit);

    return res.json({
      message: "Your courses",
      data: courses,
      page: numPage,
      pages,
      total,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};
