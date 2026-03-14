import { IUser } from "../../types/userTypes";
import {IUserDto, IUserLoginDTO } from "./IUserDto";

export class UserResponseMapper {
    static toLoginUserResponse(user:IUser,tocken:string,refreshToken:string): IUserLoginDTO {
        return {
            userId:user._id.toString(), 
            name: user.name ?? user.username,
            email: user.email,
            tocken,
            refreshToken,
            role: user.role,
            centerId: user.centerId ? user.centerId.toString() : undefined,
            status: user.status
        }
    }
    static toUserResponse(user: IUser): IUserDto{
        return {
            isVerified:user.isVerified,
            name: user.name ?? user.username,
            email: user.email,
            userId:user._id.toString(),
            authProvider: user.authProvider,
            role: user.role,
            centerId: user.centerId ? user.centerId.toString() : undefined,
            status: user.status,
            phone: user.phone
        }
    }
} 
