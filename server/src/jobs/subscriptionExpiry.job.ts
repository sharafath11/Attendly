import { CenterModel } from "../models/center.model";

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

export const startSubscriptionExpiryJob = () => {
  const run = async () => {
    const now = new Date();
    await CenterModel.updateMany(
      {
        subscriptionEndDate: { $lt: now },
        subscriptionStatus: { $ne: "blocked" },
      },
      {
        subscriptionStatus: "blocked",
        blocked: true,
        blockedReason: "Subscription expired",
        blockedAt: now,
      }
    );
  };

  run().catch((error) => {
    console.error("[SubscriptionExpiryJob] Initial run failed", error);
  });

  setInterval(() => {
    run().catch((error) => {
      console.error("[SubscriptionExpiryJob] Scheduled run failed", error);
    });
  }, TWELVE_HOURS_MS);
};
