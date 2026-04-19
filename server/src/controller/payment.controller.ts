import { Request, Response } from "express";
import { injectable } from "tsyringe";
import { handleControllerError, sendResponse } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import { PaymentService } from "../services/payment.service";
import { AuthenticatedRequest } from "../shared/middleware/role.middleware";

@injectable()
export class PaymentController {
  constructor(private _payments: PaymentService) {}

  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const { centerId, authUserId } = req as AuthenticatedRequest;
      const scope = centerId ?? authUserId;
      if (!scope) {
        sendResponse(res, StatusCode.UNAUTHORIZED, "Unauthorized", false);
        return;
      }
      const { amountInr, studentId, parentUserId, receipt } = req.body ?? {};
      if (typeof amountInr !== "number") {
        sendResponse(res, StatusCode.BAD_REQUEST, "amountInr required", false);
        return;
      }
      const data = await this._payments.createOrder(scope, {
        amountInr,
        studentId: studentId ? String(studentId) : undefined,
        parentUserId: parentUserId ? String(parentUserId) : undefined,
        receipt: receipt ? String(receipt) : undefined,
      });
      sendResponse(res, StatusCode.OK, "Order created", true, data);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async verify(req: Request, res: Response): Promise<void> {
    try {
      const { centerId, authUserId } = req as AuthenticatedRequest;
      const scope = centerId ?? authUserId;
      if (!scope) {
        sendResponse(res, StatusCode.UNAUTHORIZED, "Unauthorized", false);
        return;
      }
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body ?? {};
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        sendResponse(res, StatusCode.BAD_REQUEST, "Missing fields", false);
        return;
      }
      const data = await this._payments.verifyPayment(scope, {
        razorpayOrderId: String(razorpayOrderId),
        razorpayPaymentId: String(razorpayPaymentId),
        razorpaySignature: String(razorpaySignature),
      });
      sendResponse(res, StatusCode.OK, "Payment verified", true, data);
    } catch (error) {
      handleControllerError(res, error);
    }
  }

  async history(req: Request, res: Response): Promise<void> {
    try {
      const { centerId, authUserId } = req as AuthenticatedRequest;
      const scope = centerId ?? authUserId;
      if (!scope) {
        sendResponse(res, StatusCode.UNAUTHORIZED, "Unauthorized", false);
        return;
      }
      const data = await this._payments.listHistory(scope);
      sendResponse(res, StatusCode.OK, "OK", true, data);
    } catch (error) {
      handleControllerError(res, error);
    }
  }
}
