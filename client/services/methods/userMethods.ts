import { GoogleAuthPayload, LoginPayload, RegisterPayload, ResendOtpPayload, VerifyOtpPayload } from "@/types/user/authTypes";
import { deleteRequest, getRequest, patchRequest, postRequest, putRequest } from "../api";

const get = getRequest;
const post = postRequest;
const patch = patchRequest;
const put = putRequest;
const del = deleteRequest;

export const userAuthMethods = {
  register: (payload: RegisterPayload) => post("/auth/signup", payload),
  verifyOtp: (payload: VerifyOtpPayload) => post("/auth/verify-otp", payload),
  resendOtp: (payload: ResendOtpPayload) => post("/auth/resend-otp", payload),
  login: (payload: LoginPayload) => post("/auth/login", payload, { showToast: false }),
  googleAuth: (payload: GoogleAuthPayload) => post("/auth/google", payload, { showToast: false }),
  me: () => get("/auth/me"),
  logout: () => post("/auth/logout", {}),
  changePassword: (payload: any) => post("/auth/change-password", payload),
  updateProfile: (payload: { name?: string; phone?: string; centerName?: string; mediums?: string[]; sessions?: string[] }) => patch("/auth/profile", payload),
  forgotPassword: (payload: { email: string }) => post("/auth/forgot-password", payload),
  resetPassword: (payload: { email: string; otp: string; newPassword: string }) => post("/auth/reset-password", payload),
}
