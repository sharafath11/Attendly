import mongoose from "mongoose";
import dotenv from "dotenv";
import { UserModel } from "../models/user.Model";
import { ParentLinkModel } from "../models/parentLink.model";

dotenv.config({ path: "../../.env" });
dotenv.config({ path: "../../.env.local" });

async function check() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/attendly");
  const parents = await UserModel.find({ role: "parent" }).lean();
  console.log("Parents:");
  console.log(parents);
  
  const links = await ParentLinkModel.find().lean();
  console.log("Links:");
  console.log(links);

  process.exit(0);
}
check().catch(console.error);
