/** Integración Mercado Pago Checkout Pro (REST, sin SDK). */

export function isMercadoPagoConfigured(token?: string | null): boolean {
  const t = token?.trim() || process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  return Boolean(t);
}

export function getMercadoPagoToken(storeToken?: string | null): string | null {
  const t = storeToken?.trim() || process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  return t || null;
}

interface PreferenceItem {
  title: string;
  quantity: number;
  unit_price: number;
  currency_id: string;
}

interface CreatePreferenceInput {
  accessToken: string;
  items: PreferenceItem[];
  externalReference: string;
  notificationUrl: string;
  backUrls: { success: string; failure: string; pending: string };
  payerEmail?: string;
}

export async function createMercadoPagoPreference(
  input: CreatePreferenceInput
): Promise<{ id: string; initPoint: string; sandboxInitPoint?: string }> {
  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: input.items,
      external_reference: input.externalReference,
      notification_url: input.notificationUrl,
      back_urls: input.backUrls,
      auto_return: "approved",
      payer: input.payerEmail ? { email: input.payerEmail } : undefined,
    }),
  });

  const data = (await res.json()) as {
    id?: string;
    init_point?: string;
    sandbox_init_point?: string;
    message?: string;
    cause?: unknown[];
  };

  if (!res.ok || !data.id || !data.init_point) {
    console.error("Mercado Pago preference error:", data);
    throw new Error(data.message ?? "No se pudo crear el pago en Mercado Pago");
  }

  return {
    id: data.id,
    initPoint: data.init_point,
    sandboxInitPoint: data.sandbox_init_point,
  };
}

export async function getMercadoPagoPayment(
  accessToken: string,
  paymentId: string
): Promise<{
  id: number;
  status: string;
  external_reference: string | null;
  transaction_amount: number;
}> {
  const res = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const data = (await res.json()) as {
    id?: number;
    status?: string;
    external_reference?: string | null;
    transaction_amount?: number;
    message?: string;
  };

  if (!res.ok || data.id == null) {
    throw new Error(data.message ?? "Pago no encontrado en Mercado Pago");
  }

  return {
    id: data.id,
    status: data.status ?? "unknown",
    external_reference: data.external_reference ?? null,
    transaction_amount: data.transaction_amount ?? 0,
  };
}

export function getPublicBaseUrl(request: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, "");

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return "http://localhost:3000";
}
