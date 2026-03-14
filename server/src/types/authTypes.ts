export interface ISignup {
    name: string,
    password: string,
  email: string,
  isVerified:boolean
}
export interface TokenPayload {
  id: string;
  userId?: string;
  role: string;
  centerId?: string;
  exp?: number;
  iat?: number;
}
