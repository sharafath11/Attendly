import mongoose from "mongoose";
import { connectDB } from "../config/database";
import { UserModel } from "../models/user.Model";

const run = async () => {
  await connectDB();

  const result = await UserModel.updateMany(
    { $or: [{ role: "owner" }, { role: { $exists: false } }, { role: null }] },
    { $set: { role: "center_owner" } }
  ).exec();

  console.log("[migrateOwnerRole] matched:", result.matchedCount);
  console.log("[migrateOwnerRole] modified:", result.modifiedCount);

  await mongoose.connection.close();
};

run().catch((error) => {
  console.error("[migrateOwnerRole] failed:", error);
  mongoose.connection.close().finally(() => process.exit(1));
});
