import {IUserDto, IUserLoginDTO } from "../../../dtos/user/IUserDto";
import { ISignup } from "../../../types/authTypes";

export interface IAuthService {
    login(identifier: string, password: string):Promise<IUserLoginDTO>
    signup(data: ISignup): Promise<void>
    verifyOtp(email: string, otp: string): Promise<void>
    resendOtp(email: string): Promise<void>
    googleAuth(googleToken: string): Promise<IUserLoginDTO>
    getUser(id:string):Promise<IUserDto>
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>
    updateProfile(userId: string, name?: string, phone?: string, centerName?: string, mediums?: string[], sessions?: string[], address?: string): Promise<void>
    forgotPassword(email: string): Promise<void>
    resetPassword(email: string, otp: string, newPassword: string): Promise<void>
}
