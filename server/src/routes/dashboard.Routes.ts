import express from "express";
import { container } from "tsyringe";
import { TYPES } from "../core/types";
import { IDashboardController } from "../core/interfaces/controllers/IDashboardController";
import { requireRole } from "../shared/middleware/role.middleware";
import { checkCenterBlocked } from "../shared/middleware/center.middleware";

const router = express.Router();
const dashboardController = container.resolve<IDashboardController>(TYPES.IDashboardController);

router.get(
  "/",
  requireRole(["center_owner", "teacher"]),
  checkCenterBlocked,
  dashboardController.getDashboard.bind(dashboardController)
);

import { FeeModel } from "../models/fees.model";
import { TeacherPaymentModel } from "../models/teacherPayments.model";

router.get(
  "/company-analytics",
  requireRole(["center_owner"]),
  checkCenterBlocked,
  async (req, res) => {
    try {
      const centerId = (req as any).centerId;

      const [revenueAgg, paymentAgg, feeChartAgg, teacherChartAgg] = await Promise.all([
        FeeModel.aggregate([
          { $match: { centerId, status: "Paid" } },
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ]),
        TeacherPaymentModel.aggregate([
          { $match: { centerId } },
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ]),
        FeeModel.aggregate([
          { $match: { centerId, status: "Paid" } },
          {
            $group: {
              _id: { year: "$year", month: "$month" },
              total: { $sum: "$amount" }
            }
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]),
        TeacherPaymentModel.aggregate([
          { $match: { centerId } },
          {
            $group: {
              _id: { year: "$year", month: "$month" },
              total: { $sum: "$amount" }
            }
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } }
        ])
      ]);

      const totalRevenue = revenueAgg[0]?.total || 0;
      const totalTeacherPayments = paymentAgg[0]?.total || 0;
      const totalProfit = totalRevenue - totalTeacherPayments;

      const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const chartData: any[] = [];
      
      const currentYear = new Date().getFullYear();
      for (let i = 1; i <= 12; i++) {
        const rev = feeChartAgg.find((r) => r._id.month === i && r._id.year === currentYear)?.total || 0;
        const pay = teacherChartAgg.find((p) => p._id.month === i && p._id.year === currentYear)?.total || 0;
        chartData.push({
          month: labels[i - 1],
          revenue: rev,
          payments: pay,
          profit: rev - pay
        });
      }

      res.status(200).json({
        ok: true,
        data: {
          totalRevenue,
          totalTeacherPayments,
          totalProfit,
          chartData
        }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ ok: false, msg: "Failed to load company analytics" });
    }
  }
);

export default router;
