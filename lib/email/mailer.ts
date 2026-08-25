import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;

if (!smtpHost) {
  throw new Error("SMTP_HOST is not configured.");
}

if (!smtpUser) {
  throw new Error("SMTP_USER is not configured.");
}

if (!smtpPassword) {
  throw new Error("SMTP_PASSWORD is not configured.");
}

export const mailer = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: smtpUser,
    pass: smtpPassword,
  },
});
