import { format } from "date-fns";
import { fr } from "date-fns/locale";

export interface BookingEmailData {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  durationMinutes: number;
  staffName: string;
  providerName: string;
  providerAddress: string | null;
  providerCity: string;
  providerPhone: string;
  startDatetime: Date;
  amountCents: number;
  bookingId: string;
}

function formatDateFr(date: Date): string {
  return format(date, "EEEE d MMMM yyyy 'à' HH'h'mm", { locale: fr });
}

function formatDateAr(date: Date): string {
  return date.toLocaleDateString("ar-MA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(cents: number): string {
  return `${(cents / 100).toFixed(0)} MAD`;
}

const baseStyle = `
  body { margin: 0; padding: 0; background: #FBFBFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #0E0E12; }
  .wrapper { max-width: 560px; margin: 40px auto; background: #FFFFFF; border: 1px solid rgba(10,10,15,0.08); border-radius: 12px; overflow: hidden; }
  .header { background: #0E0E12; padding: 28px 32px; }
  .header-brand { color: #FFFFFF; font-size: 18px; font-weight: 600; letter-spacing: -0.01em; text-decoration: none; }
  .body { padding: 32px; }
  .title { font-size: 22px; font-weight: 600; letter-spacing: -0.015em; color: #0E0E12; margin: 0 0 8px; }
  .subtitle { font-size: 15px; color: #53565C; margin: 0 0 28px; line-height: 1.55; }
  .card { background: #F4F5F7; border-radius: 8px; padding: 20px 24px; margin-bottom: 24px; }
  .card-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid rgba(10,10,15,0.06); }
  .card-row:last-child { border-bottom: none; padding-bottom: 0; }
  .card-row:first-child { padding-top: 0; }
  .card-label { font-size: 13px; color: #8A8D93; font-weight: 500; }
  .card-value { font-size: 14px; color: #0E0E12; font-weight: 500; text-align: right; max-width: 60%; }
  .badge { display: inline-block; background: #FBEEF1; color: #D4466E; font-size: 12px; font-weight: 600; letter-spacing: 0.01em; padding: 4px 10px; border-radius: 100px; }
  .cta { display: block; background: #D4466E; color: #FFFFFF; text-align: center; padding: 14px 24px; border-radius: 8px; font-size: 15px; font-weight: 600; text-decoration: none; letter-spacing: -0.01em; margin-bottom: 24px; }
  .divider { border: none; border-top: 1px solid rgba(10,10,15,0.08); margin: 24px 0; }
  .arabic { direction: rtl; text-align: right; font-family: 'Geeza Pro', 'Arabic UI Text', Tahoma, sans-serif; }
  .ar-section { background: #F4F5F7; border-radius: 8px; padding: 20px 24px; margin-bottom: 24px; direction: rtl; text-align: right; font-family: 'Geeza Pro', 'Arabic UI Text', Tahoma, sans-serif; }
  .ar-title { font-size: 18px; font-weight: 600; color: #0E0E12; margin: 0 0 8px; }
  .ar-text { font-size: 14px; color: #53565C; line-height: 1.7; margin: 0; }
  .footer { padding: 20px 32px; background: #F4F5F7; }
  .footer-text { font-size: 12px; color: #8A8D93; margin: 0; line-height: 1.5; }
  .reminder-banner { background: #FBEEF1; border-left: 3px solid #D4466E; padding: 14px 20px; border-radius: 0 8px 8px 0; margin-bottom: 24px; }
  .reminder-banner-text { font-size: 14px; color: #D4466E; font-weight: 600; margin: 0; }
`.trim();

export function buildConfirmationEmail(data: BookingEmailData): { subject: string; html: string } {
  const dateFr = formatDateFr(data.startDatetime);
  const dateAr = formatDateAr(data.startDatetime);
  const price = formatPrice(data.amountCents);
  const address = data.providerAddress ? `${data.providerAddress}, ${data.providerCity}` : data.providerCity;

  const subject = `Confirmation de rendez-vous — ${data.serviceName} chez ${data.providerName}`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${subject}</title>
<style>${baseStyle}</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <span class="header-brand">ANUBIS</span>
  </div>
  <div class="body">
    <p class="title">Votre rendez-vous est confirmé ✓</p>
    <p class="subtitle">Bonjour ${data.clientName}, votre réservation a bien été enregistrée. Voici le récapitulatif :</p>

    <div class="card">
      <div class="card-row">
        <span class="card-label">Prestation</span>
        <span class="card-value">${data.serviceName}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Durée</span>
        <span class="card-value">${data.durationMinutes} min</span>
      </div>
      <div class="card-row">
        <span class="card-label">Professionnel·le</span>
        <span class="card-value">${data.staffName}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Salon / Institut</span>
        <span class="card-value">${data.providerName}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Adresse</span>
        <span class="card-value">${address}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Date &amp; heure</span>
        <span class="card-value">${dateFr}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Montant</span>
        <span class="card-value">${price}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Statut</span>
        <span class="card-value"><span class="badge">Confirmé</span></span>
      </div>
    </div>

    <hr class="divider">

    <div class="ar-section">
      <p class="ar-title">تأكيد الموعد</p>
      <p class="ar-text">مرحباً ${data.clientName}،<br>تم تأكيد حجزك بنجاح.</p>
      <p class="ar-text" style="margin-top:12px;">
        <strong>الخدمة:</strong> ${data.serviceName}<br>
        <strong>المكان:</strong> ${data.providerName} — ${data.providerCity}<br>
        <strong>التاريخ والوقت:</strong> ${dateAr}<br>
        <strong>المبلغ:</strong> ${price}
      </p>
    </div>

    <p style="font-size:14px;color:#53565C;margin:0 0 8px;">Besoin d'annuler ? Vous pouvez le faire jusqu'à <strong>2 heures avant</strong> votre rendez-vous depuis votre espace client.</p>
    <p style="font-size:14px;color:#53565C;margin:0;">Téléphone du salon : <strong>${data.providerPhone}</strong></p>
  </div>
  <div class="footer">
    <p class="footer-text">Cet email a été envoyé par ANUBIS · Plateforme de réservation beauté au Maroc.<br>Référence de réservation : ${data.bookingId.split("-")[0].toUpperCase()}</p>
  </div>
</div>
</body>
</html>`;

  return { subject, html };
}

export function buildReminderEmail(data: BookingEmailData): { subject: string; html: string } {
  const dateFr = formatDateFr(data.startDatetime);
  const dateAr = formatDateAr(data.startDatetime);
  const price = formatPrice(data.amountCents);
  const address = data.providerAddress ? `${data.providerAddress}, ${data.providerCity}` : data.providerCity;

  const subject = `Rappel — Votre rendez-vous demain chez ${data.providerName}`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${subject}</title>
<style>${baseStyle}</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <span class="header-brand">ANUBIS</span>
  </div>
  <div class="body">
    <div class="reminder-banner">
      <p class="reminder-banner-text">Rappel — Votre rendez-vous est demain</p>
    </div>

    <p class="title">On se voit demain !</p>
    <p class="subtitle">Bonjour ${data.clientName}, c'est pour vous rappeler votre rendez-vous prévu <strong>${dateFr}</strong>.</p>

    <div class="card">
      <div class="card-row">
        <span class="card-label">Prestation</span>
        <span class="card-value">${data.serviceName} · ${data.durationMinutes} min</span>
      </div>
      <div class="card-row">
        <span class="card-label">Professionnel·le</span>
        <span class="card-value">${data.staffName}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Adresse</span>
        <span class="card-value">${address}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Téléphone</span>
        <span class="card-value">${data.providerPhone}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Montant</span>
        <span class="card-value">${price}</span>
      </div>
    </div>

    <hr class="divider">

    <div class="ar-section">
      <p class="ar-title">تذكير بالموعد</p>
      <p class="ar-text">مرحباً ${data.clientName}،<br>نذكّركم بموعدكم المقرر <strong>${dateAr}</strong>.</p>
      <p class="ar-text" style="margin-top:12px;">
        <strong>الخدمة:</strong> ${data.serviceName}<br>
        <strong>المكان:</strong> ${data.providerName}<br>
        <strong>العنوان:</strong> ${address}<br>
        <strong>الهاتف:</strong> ${data.providerPhone}
      </p>
    </div>

    <p style="font-size:13px;color:#8A8D93;margin:0;">Annulation possible jusqu'à 2h avant le rendez-vous · Référence : ${data.bookingId.split("-")[0].toUpperCase()}</p>
  </div>
  <div class="footer">
    <p class="footer-text">Cet email a été envoyé par ANUBIS · Plateforme de réservation beauté au Maroc.</p>
  </div>
</div>
</body>
</html>`;

  return { subject, html };
}
