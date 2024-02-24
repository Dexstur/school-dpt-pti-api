import { Request, Response } from "express";
import { authUser } from "../utils/user";
import Course from "../models/course.model";
import Task from "../models/task.model";
import { v2 as cloudinary } from "cloudinary";
import { File } from "formidable";
import fs from "fs";
import dev from "../utils/log";

interface CustomFile extends File {
  name: string;
  tempFilePath: string;
}

export async function uploadDocument(req: Request, res: Response) {
  try {
    const { type, id } = req.query;
    if (!type || !id) {
      return res.status(400).json({
        message: "Bad request",
        error: "Type and id are required",
      });
    }

    const currentUser = await authUser(req);
    if (!currentUser) {
      return res.status(401).json({
        message: "Unauthorized",
        error: "No session",
      });
    }
    const host =
      type === "task" ? await Course.findById(id) : await Task.findById(id);
    if (!host) {
      return res.status(404).json({
        message: "Not Found",
        error: "Resource not found",
      });
    }
    const { document } = req.files as { document?: CustomFile };
    if (!document) {
      return res.status(400).json({
        message: "Bad request",
        error: "Document is required",
      });
    }
    const fileName =
      type === "task"
        ? `${host.name}_${Date.parse(new Date().toString())}`
        : `${host.name}_${currentUser.id}`;
    const uploadDox = await cloudinary.uploader.upload(document.tempFilePath, {
      folder: "moniepaddy",
      public_id: `${fileName}`,
      format: "pdf",
      overwrite: true,
      invalidate: true,
    });

    fs.unlink(document.tempFilePath, (err) => {
      if (err) {
        console.error("Error deleting temporary file:", err);
      } else {
        dev.log("Temporary file deleted successfully");
      }
    });

    const data = { url: uploadDox.url };

    return res.json({
      message: "Document uploaded",
      data,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
}
