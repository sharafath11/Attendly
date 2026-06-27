import mongoose from "mongoose";
import dotenv from "dotenv";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { StudentModel } from "../models/students.model";
import { UserModel } from "../models/user.Model";
import { ParentLinkModel } from "../models/parentLink.model";

dotenv.config({ path: "../../.env" });
dotenv.config({ path: "../../.env.local" });

async function sync() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/attendly");
  console.log("Connected to DB");

  const students = await StudentModel.find({ isDeleted: false, parentPhone: { $exists: true, $ne: "" } });
  console.log(`Found ${students.length} active students with parent phones`);

  for (const student of students) {
    const centerId = student.centerId;
    let parentUser = await UserModel.findOne({
      centerId,
      phone: student.parentPhone,
      role: "parent"
    });

    if (!parentUser) {
      const passwordHash = await bcryptjs.hash(crypto.randomBytes(24).toString("hex"), 10);
      parentUser = await UserModel.create({
        username: `parent_${student.parentPhone}_${centerId.toString().slice(-5)}`,
        email: `parent.${centerId}.${student.parentPhone}@parents.attendly.app`,
        password: passwordHash,
        role: "parent",
        centerId: centerId,
        phone: student.parentPhone,
        isVerified: true,
        status: "active",
        name: student.parentName || "Parent",
      });
      console.log(`Created parent user for ${student.parentPhone}`);
    }

    await ParentLinkModel.updateOne(
      { parentUserId: parentUser._id, studentId: student._id },
      {
        $set: {
          centerId: centerId,
          parentUserId: parentUser._id,
          studentId: student._id,
          relation: "parent",
        },
      },
      { upsert: true }
    );
    console.log(`Linked parent ${student.parentPhone} to student ${student.name}`);
  }

  console.log("Sync complete!");
  process.exit(0);
}

sync().catch(console.error);
