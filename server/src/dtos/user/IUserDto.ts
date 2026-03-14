export interface IUserDto {
    isVerified:boolean
    userId: string
    name: string
    email: string
    password?: string
    authProvider?: "local" | "google"
    role?: "center_owner" | "teacher" | "super_admin"
    centerId?: string
    status?: "active" | "pending" | "disabled"
    phone?: string
}
export interface IUserLoginDTO {
    userId: string
    name: string
    email: string
    tocken: string,
    refreshToken : string
    role?: "center_owner" | "teacher" | "super_admin"
    centerId?: string
    status?: "active" | "pending" | "disabled"
}
