import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../shared/middleware/role.middleware";
import { UserModel } from "../models/user.Model";
import { ParentLinkModel } from "../models/parentLink.model";
import { sendResponse } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import { enqueueWhatsAppMessage } from "../services/whatsappQueue.service";

export class OwnerParentController {
  /**
   * List all parents for the center with linked students.
   * Supports search (name, customId, phone) and pagination.
   */
  async listParents(req: Request, res: Response, next: NextFunction) {
    try {
      const { centerId } = req as AuthenticatedRequest;
      const { search = "", page = "1", limit = "10" } = req.query;

      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 10;
      const skip = (pageNum - 1) * limitNum;

      const filter: any = { centerId, role: "parent" };

      if (search) {
        const regex = new RegExp(search as string, "i");
        filter.$or = [
          { name: regex },
          { customId: regex },
          { phone: regex },
        ];
      }

      const [parents, total] = await Promise.all([
        UserModel.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean()
          .exec(),
        UserModel.countDocuments(filter),
      ]);

      const parentIds = parents.map((p) => p._id);
      
      const links = await ParentLinkModel.find({ parentUserId: { $in: parentIds } })
        .populate("studentId", "name")
        .lean()
        .exec();

      const parentsWithStudents = parents.map((parent) => {
        const studentLinks = links.filter(
          (l) => l.parentUserId.toString() === parent._id.toString()
        );
        return {
          id: parent._id,
          name: parent.name || parent.parentDisplayName || "Unknown Parent",
          customId: parent.customId || "N/A",
          phone: parent.phone || "N/A",
          status: parent.status || "active",
          students: studentLinks.map((l: any) => ({
            id: l.studentId?._id,
            name: l.studentId?.name || "Unknown Student",
          })).filter(s => s.id), // Ensure valid student
        };
      });
      console.log(`[OwnerParentController] Returning ${parentsWithStudents.length} parents for center ${centerId}`);

      return sendResponse(res, StatusCode.OK, "Parents fetched successfully", true, {
        parents: parentsWithStudents,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Toggle a parent's access to the portal (active/disabled)
   */
  async toggleAccess(req: Request, res: Response, next: NextFunction) {
    try {
      const { centerId } = req as AuthenticatedRequest;
      const { parentId } = req.params;
      const { status } = req.body; // "active" or "disabled"

      if (!["active", "disabled"].includes(status)) {
        return sendResponse(res, StatusCode.BAD_REQUEST, "Invalid status", false);
      }

      const parent = await UserModel.findOneAndUpdate(
        { _id: parentId, centerId, role: "parent" },
        { status },
        { new: true }
      ).lean().exec();

      if (!parent) {
        return sendResponse(res, StatusCode.NOT_FOUND, "Parent not found", false);
      }

      return sendResponse(res, StatusCode.OK, `Parent status updated to ${status}`, true, {
        id: parent._id,
        status: parent.status,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Bulk broadcast message to selected parents via WhatsApp queue
   */
  async bulkBroadcast(req: Request, res: Response, next: NextFunction) {
    try {
      const { centerId } = req as AuthenticatedRequest;
      const { parentIds, message } = req.body;

      if (!Array.isArray(parentIds) || parentIds.length === 0 || !message) {
        return sendResponse(res, StatusCode.BAD_REQUEST, "Missing parentIds or message", false);
      }

      const parents = await UserModel.find({
        _id: { $in: parentIds },
        centerId,
        role: "parent",
        phone: { $exists: true, $ne: null }
      }).lean().exec();

      if (parents.length === 0) {
        return sendResponse(res, StatusCode.NOT_FOUND, "No valid parents found for broadcast", false);
      }

      let enqueuedCount = 0;
      for (const parent of parents) {
        if (parent.phone) {
          // Fire and forget into the queue (handles 6-second delay internally if configured on the worker)
          await enqueueWhatsAppMessage({
            phone: parent.phone,
            message,
            centerId: centerId as string,
          }).catch(console.error);
          enqueuedCount++;
        }
      }

      return sendResponse(res, StatusCode.OK, `Broadcast queued for ${enqueuedCount} parents`, true);
    } catch (err) {
      next(err);
    }
  }
}
