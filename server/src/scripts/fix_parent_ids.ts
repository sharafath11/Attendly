import mongoose from "mongoose";
import dotenv from "dotenv";
import { UserModel } from "../models/user.Model";
import { generateNextCustomId } from "../services/counter.service";

dotenv.config({ path: "../../.env" });
dotenv.config({ path: "../../.env.local" });

async function fixParentIds() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/attendly");
  console.log("Connected to DB");

  const parents = await UserModel.find({ role: "parent", customId: { $exists: false } });
  console.log(`Found ${parents.length} parents without customId`);

  for (const parent of parents) {
    const customId = await generateNextCustomId(parent.centerId?.toString() || "", "parent");
    parent.customId = customId;
    await parent.save();
    console.log(`Assigned ${customId} to parent ${parent.name}`);
  }

  console.log("Finished updating parent custom IDs.");
  process.exit(0);
}

fixParentIds().catch(console.error);
