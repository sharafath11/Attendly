import mongoose from "mongoose";
import dotenv from "dotenv";
import { CenterModel } from "./src/models/center.model";

dotenv.config();

async function updateSub() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/attendly");
    console.log("Connected to DB");

    const email = "abisharfath@gmail.com";
    const result = await CenterModel.updateOne(
      { email },
      { $set: { subscriptionStatus: "active", blocked: false } }
    );

    console.log(`Update result for ${email}:`, result);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

updateSub();
