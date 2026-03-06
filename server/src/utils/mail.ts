import nodemailer from "nodemailer";
import { env } from "../config/env.js";

interface MailPayload {
  to: string;
  subject: string;
  text: string;
  html: string;
}

const smtpConfigured =
  Boolean(env.SMTP_HOST) &&
  Boolean(env.SMTP_PORT) &&
  Boolean(env.SMTP_USER) &&
  Boolean(env.SMTP_PASS) &&
  Boolean(env.SMTP_FROM);

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      }
    })
  : null;

export const sendEmail = async (payload: MailPayload): Promise<void> => {
  if (!transporter || !env.SMTP_FROM) {
    console.log("[mail:dev-fallback]", {
      to: payload.to,
      subject: payload.subject,
      text: payload.text
    });
    return;
  }

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html
  });
};
