import "reflect-metadata";
import mongoose from "mongoose";
import { connectDB } from "../config/database";
import { generateNextCustomId } from "../services/counter.service";
import { StudentsRepository } from "../repository/students.repository";
import { StudentModel } from "../models/students.model";
import { UserModel } from "../models/user.Model";
import { CounterModel } from "../models/counter.model";

const studentsRepository = new StudentsRepository();

const runTests = async () => {
  console.log("=== Booting up Test Environment ===");
  await connectDB();

  const testCenterId = new mongoose.Types.ObjectId().toString();
  console.log(`Generated Test Center ID: ${testCenterId}`);

  try {
    // -------------------------------------------------------------
    // Test 1: Counter Service Concurrent Safety & Uniqueness
    // -------------------------------------------------------------
    console.log("\n--- Running Test 1: Counter Service Concurrent Safety & Uniqueness ---");
    const numRequests = 20;
    const promises: Promise<string>[] = [];

    for (let i = 0; i < numRequests; i++) {
      promises.push(generateNextCustomId(testCenterId, "student"));
    }

    const customIds = await Promise.all(promises);
    console.log("Generated Custom IDs in Parallel:");
    console.log(customIds);

    const uniqueIds = new Set(customIds);
    if (uniqueIds.size !== numRequests) {
      throw new Error(`Duplicate IDs detected! Total generated: ${numRequests}, Unique: ${uniqueIds.size}`);
    }
    console.log(`✅ Success: Generated ${numRequests} unique custom IDs in parallel.`);

    // Verify format (STU-YYYY-XXXX)
    const currentYear = new Date().getFullYear();
    const regex = new RegExp(`^STU-${currentYear}-\\d{4}$`);
    for (const id of customIds) {
      if (!regex.test(id)) {
        throw new Error(`ID format mismatch: "${id}" does not match pattern "STU-${currentYear}-XXXX"`);
      }
    }
    console.log(`✅ Success: All generated IDs match the format STU-${currentYear}-XXXX.`);

    // -------------------------------------------------------------
    // Test 2: Cursor Pagination Edge Cases - Empty Results
    // -------------------------------------------------------------
    console.log("\n--- Running Test 2: Cursor Pagination Edge Cases - Empty Results ---");
    const emptyStudents = await studentsRepository.findManyCursor(
      { centerId: new mongoose.Types.ObjectId(testCenterId) },
      {
        limit: 5,
        sortBy: "createdAt",
        sortOrder: "desc",
      }
    );

    const emptyHasNextPage = emptyStudents.length > 5;
    const emptyData = emptyHasNextPage ? emptyStudents.slice(0, 5) : emptyStudents;

    console.log("Empty Results Output:", { count: emptyData.length, hasNextPage: emptyHasNextPage });
    if (emptyData.length !== 0) {
      throw new Error(`Expected 0 students, got ${emptyData.length}`);
    }
    if (emptyHasNextPage !== false) {
      throw new Error(`Expected hasNextPage to be false, got ${emptyHasNextPage}`);
    }
    console.log("✅ Success: Empty results cursor query returned correct state.");

    // -------------------------------------------------------------
    // Test 3: Cursor Pagination Edge Cases - Single Item
    // -------------------------------------------------------------
    console.log("\n--- Running Test 3: Cursor Pagination Edge Cases - Single Item ---");
    const singleStudent = await StudentModel.create({
      name: "Single Student",
      phone: "1234567890",
      parentPhone: "0987654321",
      batchId: new mongoose.Types.ObjectId(),
      monthlyFee: 1500,
      joinDate: new Date(),
      userId: new mongoose.Types.ObjectId(),
      centerId: new mongoose.Types.ObjectId(testCenterId),
      customId: customIds[0],
    });

    const singleStudents = await studentsRepository.findManyCursor(
      { centerId: new mongoose.Types.ObjectId(testCenterId) },
      {
        limit: 5,
        sortBy: "createdAt",
        sortOrder: "desc",
      }
    );

    const singleHasNextPage = singleStudents.length > 5;
    const singleData = singleHasNextPage ? singleStudents.slice(0, 5) : singleStudents;

    console.log("Single Result Output:", {
      count: singleData.length,
      hasNextPage: singleHasNextPage,
    });

    if (singleData.length !== 1) {
      throw new Error(`Expected 1 student, got ${singleData.length}`);
    }
    if (singleHasNextPage !== false) {
      throw new Error(`Expected hasNextPage to be false, got ${singleHasNextPage}`);
    }
    console.log("✅ Success: Single item cursor query returned correct state.");

    // -------------------------------------------------------------
    // Test 4: Cursor Pagination Edge Cases - Exact Boundary Limit
    // -------------------------------------------------------------
    console.log("\n--- Running Test 4: Cursor Pagination Edge Cases - Exact Boundary Limit ---");
    // Add 4 more students (total 5)
    for (let i = 1; i <= 4; i++) {
      await StudentModel.create({
        name: `Student ${i + 1}`,
        phone: `123456789${i}`,
        parentPhone: `098765432${i}`,
        batchId: new mongoose.Types.ObjectId(),
        monthlyFee: 1500 + i * 100,
        joinDate: new Date(),
        userId: new mongoose.Types.ObjectId(),
        centerId: new mongoose.Types.ObjectId(testCenterId),
        customId: customIds[i],
      });
    }

    const boundaryStudents = await studentsRepository.findManyCursor(
      { centerId: new mongoose.Types.ObjectId(testCenterId) },
      {
        limit: 5,
        sortBy: "createdAt",
        sortOrder: "desc",
      }
    );

    const boundaryHasNextPage = boundaryStudents.length > 5;
    const boundaryData = boundaryHasNextPage ? boundaryStudents.slice(0, 5) : boundaryStudents;

    console.log("Boundary Result Output:", {
      count: boundaryData.length,
      hasNextPage: boundaryHasNextPage,
    });

    if (boundaryData.length !== 5) {
      throw new Error(`Expected 5 students, got ${boundaryData.length}`);
    }
    if (boundaryHasNextPage !== false) {
      throw new Error(`Expected hasNextPage to be false, got ${boundaryHasNextPage}`);
    }
    console.log("✅ Success: Exact boundary limit cursor query returned correct state (hasNextPage: false).");

    // -------------------------------------------------------------
    // Test 5: Cursor Pagination Edge Cases - Next Page Indicator
    // -------------------------------------------------------------
    console.log("\n--- Running Test 5: Cursor Pagination Edge Cases - Next Page Indicator ---");
    // Add 1 more student (total 6)
    const sixthStudent = await StudentModel.create({
      name: "Student 6",
      phone: "1234567895",
      parentPhone: "0987654325",
      batchId: new mongoose.Types.ObjectId(),
      monthlyFee: 2000,
      joinDate: new Date(),
      userId: new mongoose.Types.ObjectId(),
      centerId: new mongoose.Types.ObjectId(testCenterId),
      customId: customIds[5],
    });

    const page1Students = await studentsRepository.findManyCursor(
      { centerId: new mongoose.Types.ObjectId(testCenterId) },
      {
        limit: 5,
        sortBy: "createdAt",
        sortOrder: "desc",
      }
    );

    const page1HasNextPage = page1Students.length > 5;
    const page1Data = page1HasNextPage ? page1Students.slice(0, 5) : page1Students;

    let page1NextCursor: string | null = null;
    if (page1HasNextPage && page1Data.length > 0) {
      const lastItem = page1Data[page1Data.length - 1];
      page1NextCursor = lastItem.createdAt.toISOString();
    }

    console.log("Page 1 Result Output:", {
      count: page1Data.length,
      hasNextPage: page1HasNextPage,
      nextCursor: page1NextCursor,
    });

    if (page1Data.length !== 5) {
      throw new Error(`Expected 5 students on Page 1, got ${page1Data.length}`);
    }
    if (page1HasNextPage !== true) {
      throw new Error(`Expected hasNextPage to be true, got ${page1HasNextPage}`);
    }
    if (!page1NextCursor) {
      throw new Error("Expected nextCursor to be defined");
    }
    console.log("✅ Success: Next page indicator and next cursor returned correctly.");

    // Query Page 2 using nextCursor
    console.log("\n--- Running Test 6: Fetching Next Page using Cursor ---");
    const page2Students = await studentsRepository.findManyCursor(
      { centerId: new mongoose.Types.ObjectId(testCenterId) },
      {
        limit: 5,
        cursor: page1NextCursor,
        sortBy: "createdAt",
        sortOrder: "desc",
      }
    );

    const page2HasNextPage = page2Students.length > 5;
    const page2Data = page2HasNextPage ? page2Students.slice(0, 5) : page2Students;

    console.log("Page 2 Result Output:", {
      count: page2Data.length,
      hasNextPage: page2HasNextPage,
    });

    if (page2Data.length !== 1) {
      throw new Error(`Expected 1 student on Page 2, got ${page2Data.length}`);
    }
    if (page2HasNextPage !== false) {
      throw new Error(`Expected hasNextPage to be false on Page 2, got ${page2HasNextPage}`);
    }
    console.log("✅ Success: Page 2 fetched correctly using cursor.");

    console.log("\n🎉 ALL TESTS COMPLETED SUCCESSFULLY! 🎉");
  } finally {
    console.log("\n=== Cleaning Up Test Data ===");
    const delStudents = await StudentModel.deleteMany({ centerId: new mongoose.Types.ObjectId(testCenterId) });
    console.log(`Deleted ${delStudents.deletedCount} test students.`);
    
    const delCounters = await CounterModel.deleteMany({ centerId: new mongoose.Types.ObjectId(testCenterId) });
    console.log(`Deleted ${delCounters.deletedCount} test counters.`);

    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
  }
};

runTests().catch((err) => {
  console.error("❌ Test script failed with error:", err);
  mongoose.connection.close().finally(() => process.exit(1));
});
