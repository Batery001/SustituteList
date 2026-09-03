import nodemailer from "nodemailer";

type SendResult = { ok: boolean; skipped?: boolean; error?: string };

function smtpSettings() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) return null;
  const port = Number(process.env.SMTP_PORT?.trim() || "587");
  return {
    host,
    port: Number.isFinite(port) ? port : 587,
    user,
    pass,
    secure: port === 465,
  };
}

function fromAddress(): string {
  const configured = process.env.EMAIL_FROM?.trim();
  if (configured && !configured.includes("onboarding@resend.dev")) {
    return configured;
  }
  const smtpUser = smtpSettings()?.user;
  if (smtpUser) return `Substitute List <${smtpUser}>`;
  return configured || "Substitute List <onboarding@resend.dev>";
}

export function isEmailConfigured(): boolean {
  return Boolean(smtpSettings() || process.env.RESEND_API_KEY?.trim());
}

function friendlyResendError(status: number, body: string): string {
  let message = "";
  try {
    const parsed = JSON.parse(body) as { message?: string };
    message = parsed.message ?? "";
  } catch {
    message = body;
  }
  if (status === 403 && /verify a domain|own email address/i.test(message)) {
    return "Resend en prueba solo manda al correo de tu cuenta Resend. Sin dominio, configura SMTP de Gmail (SMTP_HOST, SMTP_USER y SMTP_PASS) en Vercel.";
  }
  return message.trim() || "No se pudo enviar el correo";
}

async function sendWithSmtp(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<SendResult> {
  const smtp = smtpSettings();
  if (!smtp) return { ok: false, skipped: true };

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: { user: smtp.user, pass: smtp.pass },
    });
    await transporter.sendMail({
      from: fromAddress(),
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return { ok: true };
  } catch (err) {
    console.error("SMTP send error:", err);
    return {
      ok: false,
      error:
        "No se pudo enviar por Gmail. Revisa SMTP_USER y la contraseña de aplicación en Vercel.",
    };
  }
}

async function sendWithResend(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, skipped: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("Resend error:", res.status, body);
      return { ok: false, error: friendlyResendError(res.status, body) };
    }
    return { ok: true };
  } catch (err) {
    console.error("Email send error:", err);
    return { ok: false, error: "No se pudo enviar el correo" };
  }
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<SendResult> {
  if (smtpSettings()) {
    return sendWithSmtp(input);
  }
  if (process.env.RESEND_API_KEY?.trim()) {
    return sendWithResend(input);
  }
  console.warn("Email omitido: falta SMTP o RESEND_API_KEY");
  return { ok: false, skipped: true };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function wrapHtml(title: string, body: string): string {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0b1220;color:#e2e8f0;padding:24px">
  <div style="max-width:520px;margin:auto;background:#111827;border:1px solid #1e3a5f;border-radius:12px;padding:24px">
    <p style="color:#7dd3fc;font-size:12px;letter-spacing:.08em;text-transform:uppercase">Substitute List</p>
    <h1 style="font-size:20px;color:#f8fafc">${title}</h1>
    ${body}
  </div></body></html>`;
}

function btn(href: string, label: string): string {
  const safeHref = escapeHtml(href);
  return `<p><a ses:no-track href="${safeHref}" style="display:inline-block;background:#0284c7;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px">${escapeHtml(label)}</a></p><p style="font-size:12px;color:#94a3b8;word-break:break-all">${safeHref}</p>`;
}

export async function sendEmailVerificationEmail(input: {
  to: string;
  name: string;
  verifyUrl: string;
}): Promise<SendResult> {
  const subject = "Confirma tu correo — Substitute List";
  const text = `Hola ${input.name},\n\nConfirma que este correo es tuyo (el enlace vale 7 días):\n${input.verifyUrl}\n\nPuedes seguir usando tu cuenta aunque aún no pulses el enlace.\n`;
  const html = wrapHtml(
    "Confirma tu correo",
    `<p>Hola ${input.name},</p><p>Pulsa el botón para verificar que este correo es tuyo. El enlace vale 7 días.</p>${btn(input.verifyUrl, "Verificar correo")}<p style="font-size:13px;color:#fbbf24">Mientras no lo confirmes verás un aviso en la web. Tu cuenta sigue funcionando con normalidad.</p><p style="font-size:13px;color:#94a3b8">Si no creaste esta cuenta, ignora este mensaje.</p>`
  );
  return sendEmail({ to: input.to, subject, text, html });
}

export async function sendPasswordResetEmail(input: {
  to: string;
  resetUrl: string;
}): Promise<SendResult> {
  const subject = "Restablecer contraseña — Substitute List";
  const text = `Para elegir una contraseña nueva abre este enlace (vence en 30 minutos):\n${input.resetUrl}\n`;
  const html = wrapHtml(
    "Restablecer contraseña",
    `<p>Pediste recuperar el acceso. El enlace vence en 30 minutos.</p>${btn(input.resetUrl, "Elegir contraseña nueva")}<p style="font-size:13px;color:#94a3b8">Si no fuiste tú, ignora este correo.</p>`
  );
  return sendEmail({ to: input.to, subject, text, html });
}

export async function sendRegistrationEmail(input: {
  to: string;
  playerName: string;
  eventName: string;
  storeName: string;
  manageUrl: string;
  hasAccount: boolean;
  loginUrl: string;
}): Promise<SendResult> {
  const subject = `Inscripción confirmada: ${input.eventName}`;
  const accountLine = input.hasAccount
    ? `Ya tienes cuenta. Entra aquí para ver tus torneos: ${input.loginUrl}`
    : `Si más adelante creas una cuenta con este correo, tus torneos quedan más fáciles de retomar.`;
  const text = `Hola ${input.playerName},\n\nQuedaste inscrito en ${input.eventName} (${input.storeName}).\nGestiona tu inscripción y lista:\n${input.manageUrl}\n\n${accountLine}\n`;
  const html = wrapHtml(
    "Inscripción confirmada",
    `<p>Hola ${input.playerName},</p><p>Quedaste inscrito en <strong>${input.eventName}</strong> · ${input.storeName}.</p>${btn(input.manageUrl, "Ver mi inscripción y enviar lista")}<p style="font-size:13px;color:#94a3b8">${input.hasAccount ? "Ya tienes cuenta: inicia sesión con este correo para no perder el enlace." : "Guarda este correo. Si creas una cuenta con la misma dirección, es más fácil volver a tu lista."}</p>`
  );
  return sendEmail({ to: input.to, subject, text, html });
}

export async function sendMissingListEmail(input: {
  to: string;
  playerName: string;
  eventName: string;
  deadlineLabel: string;
  manageUrl: string;
}): Promise<SendResult> {
  const subject = `Falta tu lista: ${input.eventName}`;
  const text = `Hola ${input.playerName},\n\nAún no tenemos tu lista de 60 cartas para ${input.eventName}. Plazo: ${input.deadlineLabel}\n${input.manageUrl}\n`;
  const html = wrapHtml(
    "Falta tu lista",
    `<p>Hola ${input.playerName},</p><p>Aún no tenemos tu mazo para <strong>${input.eventName}</strong>.</p><p>Plazo: ${input.deadlineLabel}</p>${btn(input.manageUrl, "Enviar mi lista")}`
  );
  return sendEmail({ to: input.to, subject, text, html });
}

export async function sendDeadlineReminderEmail(input: {
  to: string;
  playerName: string;
  eventName: string;
  deadlineLabel: string;
  manageUrl: string;
}): Promise<SendResult> {
  const subject = `Cierra el plazo de listas: ${input.eventName}`;
  const text = `Hola ${input.playerName},\n\nEl plazo de listas de ${input.eventName} cierra ${input.deadlineLabel}.\n${input.manageUrl}\n`;
  const html = wrapHtml(
    "El plazo se acaba",
    `<p>Hola ${input.playerName},</p><p>El plazo de listas de <strong>${input.eventName}</strong> cierra ${input.deadlineLabel}.</p>${btn(input.manageUrl, "Revisar mi inscripción")}`
  );
  return sendEmail({ to: input.to, subject, text, html });
}
