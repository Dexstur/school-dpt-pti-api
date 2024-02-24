import mongoose, { Document, Schema } from "mongoose";

interface ISubmission extends Document {
  task: string;
  title: string;
  student: string;
  document: string;
  score: number;
  graded: boolean;
}

const SubmissionSchema: Schema = new Schema(
  {
    task: { type: Schema.Types.ObjectId, ref: "Task", required: true },
    title: { type: String, required: true },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    document: { type: String, required: true },
    score: { type: Number, default: 0 },
    graded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Submission = mongoose.model<ISubmission>("Submission", SubmissionSchema);

export default Submission;
