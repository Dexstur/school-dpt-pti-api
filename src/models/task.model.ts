import mongoose, { Document, Schema } from "mongoose";

interface ITask extends Document {
  name: string;
  description?: string;
  document: string;
  lecturer: string;
  course: string;
  project: boolean;
  deadline: Date;
  students: string[];
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    document: { type: String, required: true },
    lecturer: { type: Schema.Types.ObjectId, ref: "User" },
    course: { type: Schema.Types.ObjectId, ref: "Course" },
    deadline: { type: Date },
    students: [{ type: Schema.Types.ObjectId, ref: "User" }],
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Task = mongoose.model<ITask>("Task", TaskSchema);

export default Task;
