import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);
export const FROM = process.env.RESEND_FROM ?? "alertes@nosdeputes.fr";
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.nosdeputes.fr";
