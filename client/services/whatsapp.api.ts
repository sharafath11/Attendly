import { getRequest } from "./api";

export type WhatsappStatusResponse = {
  ok: boolean;
  msg: string;
  data?: {
    status: string;
    hasQr?: boolean;
    qr?: string;
  };
};

export const whatsappApi = {
  getStatus: () => getRequest<WhatsappStatusResponse>("/whatsapp/status"),
  getQr: () => getRequest<WhatsappStatusResponse>("/whatsapp/qr"),
};
