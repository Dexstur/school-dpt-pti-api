import mongoose from "mongoose";
import { config } from "dotenv";

config();

const URI = process.env.MONGO_URI || "";
const password = process.env.MONGO_PASSWORD || "";
let connectionString = URI.replace("<password>", password);

async function connectDB() {
  try {
    await mongoose.connect(connectionString);
    console.log(`Db connected`);
  } catch (err) {
    console.error("db connection failed");
    console.error(err);
  }
}

export default connectDB;
