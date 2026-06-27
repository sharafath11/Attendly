import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { InvitationModel } from "../models/invitation.model";
import { UserModel } from "../models/user.Model";
import { CenterModel } from "../models/center.model";
import { generateNextCustomId } from "../services/counter.service";
import { SocketService } from "../services/socket.service";
import { generateAccessToken, generateRefreshToken, setTokensInCookies } from "../lib/jwtToken";
import { sendTransactionalHtml } from "../utils/mail.util";
import { sendResponse, throwError } from "../utils/response";
import { StatusCode } from "../enums/statusCode";
import { logActivity } from "../utils/activityLog.util";

export class InvitationController {
  /**
   * Invite a teacher to a center (Owner-only)
   */
  async inviteTeacher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, name } = req.body ?? {};
      const centerId = (req as any).centerId;

      if (!email || !name) {
        sendResponse(res, StatusCode.BAD_REQUEST, "Email and name are required", false);
        return;
      }

      // Check if user already exists
      const existingUser = await UserModel.findOne({ email: email.toLowerCase().trim() }).lean().exec();
      if (existingUser) {
        sendResponse(res, StatusCode.CONFLICT, "A user with this email already exists", false);
        return;
      }

      // Generate a secure token
      const crypto = await import("crypto");
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry

      // Save invitation in database
      await InvitationModel.findOneAndUpdate(
        { email: email.toLowerCase().trim() },
        {
          name,
          email: email.toLowerCase().trim(),
          token,
          centerId: new mongoose.Types.ObjectId(centerId),
          expiresAt,
        },
        { upsert: true, new: true }
      );

      // Fetch center name
      const center = await CenterModel.findById(centerId).lean().exec();
      const centerName = center?.name ?? "Attendly Center";

      // Onboarding link
      const clientUrl = (
        process.env.CLIENT_URL ||
        process.env.FRONTEND_URL ||
        "http://localhost:3000"
      ).replace(/\/$/, "");
      const inviteLink = `${clientUrl}/accept-invitation?token=${token}`;

      // Email payload
      const subject = `${centerName} invites you to join their digital portal on Attendly`;
      const text = `Hi ${name},\n\nYou have been invited to join ${centerName} as a Teacher. Click the link below to set your password and complete onboarding:\n\n${inviteLink}\n\nThis invitation expires in 24 hours.`;
      const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eaeaea; border-radius: 8px;">
          <h2 style="color: #2563eb;">Welcome to Attendly</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>You have been invited to join <strong>${centerName}</strong> as a Teacher on the Attendly tuition management platform.</p>
          <p>To accept this invitation and complete your onboarding, click the button below to set up your password:</p>
          <p style="margin: 30px 0; text-align: center;">
            <a href="${inviteLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);">Accept Invitation & Onboard</a>
          </p>
          <p style="font-size: 14px; color: #555;">Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all;"><a href="${inviteLink}" style="color: #2563eb;">${inviteLink}</a></p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px; line-height: 1.5;">This secure invitation was generated via Attendly on behalf of ${centerName}.<br/>The invitation link is valid for 24 hours.</p>
        </div>
      `;

      await sendTransactionalHtml(email, subject, html, text, centerName);

      // Log activity
      await logActivity({
        centerId,
        actorUserId: (req as any).authUserId,
        action: "teacher_invited",
        entityType: "user",
        summary: `Invited teacher ${name} (${email}) to join the center`,
      });

      sendResponse(res, StatusCode.OK, "Invitation email sent successfully", true);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Validate invitation token
   */
  async validateInviteToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.query;

      if (!token || typeof token !== "string") {
        sendResponse(res, StatusCode.BAD_REQUEST, "Token is required", false);
        return;
      }

      const invitation = await InvitationModel.findOne({ token }).lean().exec();
      if (!invitation || invitation.expiresAt < new Date()) {
        sendResponse(res, StatusCode.BAD_REQUEST, "Invitation token is invalid or has expired", false);
        return;
      }

      sendResponse(res, StatusCode.OK, "Token is valid", true, {
        email: invitation.email,
        name: invitation.name,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Complete signup using the invitation token
   */
  async completeInviteSignup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body ?? {};

      if (!token || !password) {
        sendResponse(res, StatusCode.BAD_REQUEST, "Token and password are required", false);
        return;
      }

      if (password.length < 6) {
        sendResponse(res, StatusCode.BAD_REQUEST, "Password must be at least 6 characters", false);
        return;
      }

      const invitation = await InvitationModel.findOne({ token }).exec();
      if (!invitation || invitation.expiresAt < new Date()) {
        sendResponse(res, StatusCode.BAD_REQUEST, "Invitation token is invalid or has expired", false);
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const centerId = invitation.centerId.toString();

      // Check if user already exists
      let user = await UserModel.findOne({ email: invitation.email.toLowerCase().trim() });
      const customId = await generateNextCustomId(centerId, "teacher");

      if (user) {
        user.password = hashedPassword;
        user.status = "active";
        user.isVerified = true;
        user.role = "teacher";
        user.centerId = invitation.centerId;
        user.customId = customId;
        user.username = invitation.email.toLowerCase().trim();
        user.name = invitation.name;
        await user.save();
      } else {
        user = await UserModel.create({
          name: invitation.name,
          username: invitation.email.toLowerCase().trim(),
          email: invitation.email.toLowerCase().trim(),
          password: hashedPassword,
          isVerified: true,
          role: "teacher",
          centerId: invitation.centerId,
          customId,
          status: "active",
        });
      }

      // Delete/burn the invitation token
      await InvitationModel.deleteOne({ _id: invitation._id });

      // Notify the inviting Center Owner via Socket.io (persisted to database)
      const owner = await UserModel.findOne({ centerId: invitation.centerId, role: "center_owner" }).lean().exec();
      if (owner) {
        await SocketService.createAndSendNotification(
          centerId,
          owner._id.toString(),
          "Teacher Onboarded",
          `Teacher ${invitation.name} has successfully joined your center!`,
          "teacher_joined",
          { teacherName: invitation.name, teacherId: user._id.toString(), customId }
        );
      }

      // Log activity
      await logActivity({
        centerId,
        actorUserId: user._id.toString(),
        action: "teacher_onboarded",
        entityType: "user",
        entityId: user._id.toString(),
        summary: `Teacher ${invitation.name} completed invitation-based onboarding`,
      });

      // Generate access & refresh tokens for automatic login
      const accessToken = generateAccessToken(user._id.toString(), "teacher", centerId);
      const refreshToken = generateRefreshToken(user._id.toString(), "teacher", centerId);

      setTokensInCookies(res, accessToken, refreshToken);

      sendResponse(res, StatusCode.OK, "Signup completed and logged in successfully", true, {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          centerId,
          customId,
        },
        token: accessToken,
        refreshToken,
      });
    } catch (error) {
      next(error);
    }
  }
}
