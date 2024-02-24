import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  lastName: string;
  firstName: string;
  middleName?: string;
  email: string;
  password: string;
  authority: number;
  schoolId: string;
  verified: boolean;
  courses: string[];
  leave: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): boolean;
}

const saltRounds = Number(process.env.SALT) || 2;

const UserSchema: Schema = new Schema(
  {
    lastName: { type: String, required: true },
    firstName: { type: String, required: true },
    middleName: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    authority: { type: Number, default: 0 },
    schoolId: { type: String, required: true, unique: true },
    verified: { type: Boolean, default: false },
    courses: [{ type: Schema.Types.ObjectId, ref: "Course" }],
    leave: { type: Boolean, default: false },
    status: { type: String, default: "active" },
  },
  { timestamps: true }
);

UserSchema.pre<IUser>("save", async function (next) {
  const user = this;

  if (!user.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(saltRounds);

    const hashedPassword = await bcrypt.hash(user.password, salt);

    // Set the hashed password
    user.password = hashedPassword;

    next();
  } catch (error) {
    console.error(error);
    return next(error as Error);
  }
});

UserSchema.methods.comparePassword = function (password: string) {
  try {
    return bcrypt.compareSync(password, this.password);
  } catch (error) {
    throw error;
  }
};

const User = mongoose.model<IUser>("User", UserSchema);

export default User;
