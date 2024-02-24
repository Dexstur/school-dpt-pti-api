import mongoose, { Document, Schema } from "mongoose";

interface ICourse extends Document {
  name: string;
  code: string;
  lecturer?: string;
  assistants: string[];
  students: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    lecturer: { type: Schema.Types.ObjectId, ref: "User" },
    assistants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    students: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const Course = mongoose.model<ICourse>("Course", CourseSchema);

export default Course;
