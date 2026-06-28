import { logger } from "./logger";

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

type Transporter = {
  sendMail: (opts: { from: string; to: string; subject: string; html: string }) => Promise<unknown>;
};

let transporter: Transporter | null = null;
let fromAddress = "noreply@pstagev1.ma";

async function initMailer() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !user || !pass) {
    logger.warn("SMTP_HOST / SMTP_USER / SMTP_PASS not set — email notifications are logged only (dev mode)");
    return;
  }

  if (from) fromAddress = from;

  const nodemailer = require("nodemailer") as typeof import("nodemailer");
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  try {
    await (transporter as any).verify();
    logger.info({ host, port }, "SMTP transporter verified");
  } catch (err) {
    logger.error({ err }, "SMTP verification failed — email will be logged only");
    transporter = null;
  }
}

initMailer();

export async function sendMail(opts: MailOptions): Promise<void> {
  if (!transporter) {
    logger.info({ to: opts.to, subject: opts.subject }, "[DEV] Email (not sent — no SMTP configured)");
    return;
  }
  try {
    await transporter.sendMail({ from: fromAddress, ...opts });
    logger.info({ to: opts.to, subject: opts.subject }, "Email sent");
  } catch (err) {
    logger.error({ err, to: opts.to, subject: opts.subject }, "Email send failed");
  }
}
