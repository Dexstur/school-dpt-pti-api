import { Request, Response } from "express";
import Submission from "../models/submit.model";
import Task from "../models/task.model";
import User from "../models/user.model";
import Course from "../models/course.model";
import { authUser } from "../utils/user";
import sendMail from "../utils/mail";

export const submitTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const currentUser = await authUser(req);
    if (!currentUser) {
      return res.status(401).json({
        message: "Unauthorized",
        error: "No session",
      });
    }

    if (currentUser.authority !== 0) {
      return res.status(403).json({
        message: "Forbidden",
        error: "You are not a student",
      });
    }

    const { document } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        message: "Not Found",
        error: "Task not found",
      });
    }

    if (!document) {
      return res.status(400).json({
        message: "Bad Request",
        error: "Document is required",
      });
    }

    const submission = await Submission.create({
      task: taskId,
      title: task.name,
      student: currentUser.id,
      document,
    });

    return res.status(201).json({
      message: "Submission successful",
      data: submission,
    });
  } catch (err: any) {
    console.log(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

export const viewSubmission = async (req: Request, res: Response) => {
  try {
    const { id } = req.query;
    const currentUser = await authUser(req);

    if (!currentUser) {
      return res.status(401).json({
        message: "Unauthorized",
        error: "No session",
      });
    }

    if (!id) {
      return res.status(400).json({
        message: "Bad Request",
        error: "Submission id is required",
      });
    }
    const submission = await Submission.findById(id);

    if (!submission) {
      return res.status(404).json({
        message: "Not Found",
        error: "Submission not found",
      });
    }

    const task = await Task.findById(submission.task);

    if (!task) {
      return res.status(404).json({
        message: "Not Found",
        error: "Task not found",
      });
    }

    const lecturer = task.lecturer.toString() === currentUser.id;
    const student = submission.student.toString() === currentUser.id;
    const admin = currentUser.authority === 2;

    if (!lecturer && !student && !admin) {
      return res.status(403).json({
        message: "Forbidden",
        error: "You are not allowed to view this submission",
      });
    }

    return res.json({
      message: "Submission details",
      data: submission,
    });
  } catch (err: any) {
    console.log(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

export const viewSubmissions = async (req: Request, res: Response) => {
  try {
    const { id } = req.query;

    const currentUser = await authUser(req);
    const task = await Task.findById(id);

    if (!currentUser) {
      return res.status(401).json({
        message: "Unauthorized",
        error: "No session",
      });
    }

    if (!task) {
      return res.status(404).json({
        message: "Not Found",
        error: "Task not found",
      });
    }

    const lecturer = task.lecturer.toString() === currentUser.id;
    const admin = currentUser.authority === 2;

    if (!lecturer && !admin) {
      return res.status(403).json({
        message: "Forbidden",
        error: "You are not allowed to view these submissions",
      });
    }

    const submissions = await Submission.find({ task: id })
      .populate("student", "firstName lastName email")
      .exec();

    return res.json({
      message: "Submissions",
      data: submissions,
    });
  } catch (err: any) {
    console.log(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

export const updateSubmission = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = await authUser(req);

    if (!currentUser) {
      return res.status(401).json({
        message: "Unauthorized",
        error: "No session",
      });
    }

    const submission = await Submission.findById(id);

    if (!submission) {
      return res.status(404).json({
        message: "Not Found",
        error: "Submission not found",
      });
    }

    const task = await Task.findById(submission.task);

    if (!task) {
      return res.status(404).json({
        message: "Not Found",
        error: "Task not found",
      });
    }

    const currentDate = Date.parse(new Date().toString());
    const deadline = Date.parse(task.deadline.toString());

    if (currentDate > deadline) {
      return res.status(400).json({
        message: "Bad Request",
        error: "Deadline has passed",
      });
    }

    const student = currentUser.id === submission.student.toString();

    if (!student) {
      return res.status(403).json({
        message: "Forbidden",
        error: "You are not allowed to update this submission",
      });
    }

    const { document } = req.body;

    if (!document) {
      return res.status(400).json({
        message: "Bad Request",
        error: "Document is required",
      });
    }

    submission.document = document;
    await submission.save();

    return res.json({
      message: "Submission updated",
      data: submission,
    });
  } catch (err: any) {
    console.log(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

export const mySubmission = async (req: Request, res: Response) => {
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

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        message: "Not Found",
        error: "Task not found",
      });
    }

    const submission = await Submission.findOne({
      task: id,
      student: currentUser.id,
    });

    if (!submission) {
      return res.status(404).json({
        message: "Not Found",
        error: "Submission not found",
      });
    }

    const currentDate = Date.parse(new Date().toString());
    const deadline = Date.parse(task.deadline.toString());

    const modify = currentDate < deadline;

    return res.json({
      message: "My submission",
      data: submission,
      modify,
    });
  } catch (err: any) {
    console.log(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};
