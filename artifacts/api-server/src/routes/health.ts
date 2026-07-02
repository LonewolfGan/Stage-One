import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

// ── POST /api/twilio-check ─────────────────────────────────────────────────
// Diagnostic endpoint — tests Twilio config by sending a real SMS.
// Protected by TWILIO_TEST_SECRET header to prevent abuse.
router.post("/twilio-check", async (req, res) => {
  const { to, secret } = req.body as { to?: string; secret?: string };

  const expectedSecret = process.env.TWILIO_TEST_SECRET;
  if (!expectedSecret) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (secret !== expectedSecret) {
    res.status(403).json({ error: "Forbidden: bad secret" });
    return;
  }

  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_FROM_PHONE;

  if (!sid || !token || !from) {
    res.status(200).json({
      twilioConfigured: false,
      missing: [
        !sid   && "TWILIO_ACCOUNT_SID",
        !token && "TWILIO_AUTH_TOKEN",
        !from  && "TWILIO_FROM_PHONE",
      ].filter(Boolean),
    });
    return;
  }

  if (!to) {
    res.status(200).json({
      twilioConfigured: true,
      sid: sid.slice(0, 8) + "...",
      from,
      note: "Pass 'to' in body to actually send a test SMS",
    });
    return;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const credentials = Buffer.from(`${sid}:${token}`).toString("base64");
  const form = new URLSearchParams();
  form.set("To",   to);
  form.set("From", from);
  form.set("Body", "PSTAGEV1 test SMS — configuration OK");

  try {
    const twilioRes = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    const twilioBody = await twilioRes.json() as any;
    res.status(200).json({
      twilioConfigured: true,
      httpStatus: twilioRes.status,
      ok: twilioRes.ok,
      twilioResponse: twilioBody,
    });
  } catch (err: any) {
    res.status(200).json({
      twilioConfigured: true,
      networkError: err?.message ?? String(err),
    });
  }
});

export default router;
