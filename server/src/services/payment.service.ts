import crypto from "crypto";
import { injectable } from "tsyringe";
import mongoose from "mongoose";
import Razorpay from "razorpay";
import { PaymentTransactionModel } from "../models/paymentTransaction.model";
import { NotificationOrchestratorService } from "./notificationOrchestrator.service";
import { throwError } from "../utils/response";
import { StatusCode } from "../enums/statusCode";

function getRazorpay(): Razorpay {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throwError("Razorpay is not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)", StatusCode.SERVICE_UNAVAILABLE);
  }
  return new Razorpay({ key_id, key_secret });
}

@injectable()
export class PaymentService {
  constructor(private _notifications: NotificationOrchestratorService) {}

  async createOrder(
    centerId: string,
    payload: { amountInr: number; studentId?: string; parentUserId?: string; receipt?: string }
  ) {
    const amountPaise = Math.round(payload.amountInr * 100);
    if (amountPaise < 100) {
      throwError("Minimum amount is ₹1", StatusCode.BAD_REQUEST);
    }

    const rzp = getRazorpay();
    const receipt = payload.receipt ?? `rcpt_${centerId.slice(-6)}_${Date.now()}`;

    const order = await rzp.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt,
      notes: {
        centerId,
        studentId: payload.studentId ?? "",
        parentUserId: payload.parentUserId ?? "",
      },
    });

    await PaymentTransactionModel.create({
      centerId: new mongoose.Types.ObjectId(centerId),
      studentId: payload.studentId ? new mongoose.Types.ObjectId(payload.studentId) : undefined,
      parentUserId: payload.parentUserId ? new mongoose.Types.ObjectId(payload.parentUserId) : undefined,
      amountPaise,
      currency: "INR",
      status: "created",
      razorpayOrderId: order.id,
      receipt,
      notes: order.notes as Record<string, string>,
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    };
  }

  async verifyPayment(
    centerId: string,
    payload: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    }
  ) {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throwError("Razorpay not configured", StatusCode.SERVICE_UNAVAILABLE);
    }

    const body = `${payload.razorpayOrderId}|${payload.razorpayPaymentId}`;
    const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
    if (expected !== payload.razorpaySignature) {
      throwError("Invalid payment signature", StatusCode.BAD_REQUEST);
    }

    const doc = await PaymentTransactionModel.findOneAndUpdate(
      {
        centerId: new mongoose.Types.ObjectId(centerId),
        razorpayOrderId: payload.razorpayOrderId,
      },
      {
        status: "paid",
        razorpayPaymentId: payload.razorpayPaymentId,
      },
      { new: true }
    ).exec();

    if (!doc) {
      throwError("Order not found for this center", StatusCode.NOT_FOUND);
    }

    if (doc.studentId) {
      const amountInr = doc.amountPaise / 100;
      void this._notifications.sendPaymentConfirmation(centerId, doc.studentId.toString(), amountInr);
    }

    return { ok: true as const, paymentId: payload.razorpayPaymentId };
  }

  async listHistory(centerId: string, limit = 50) {
    const rows = await PaymentTransactionModel.find({
      centerId: new mongoose.Types.ObjectId(centerId),
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    return rows.map((r) => ({
      id: r._id.toString(),
      amountInr: r.amountPaise / 100,
      status: r.status,
      razorpayOrderId: r.razorpayOrderId,
      razorpayPaymentId: r.razorpayPaymentId,
      method: r.method,
      createdAt: r.createdAt,
    }));
  }
}
