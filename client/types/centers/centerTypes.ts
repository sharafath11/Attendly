export type CenterRegistrationPayload = {
  centerName: string;
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  address: string;
  medium: "English" | "Malayalam";
  planType: "basic" | "pro";
};
