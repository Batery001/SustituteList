/** Transbank Webpay Plus REST (Chile). */

export type TransbankEnvironment = "integration" | "production";

export interface TransbankCredentials {
  commerceCode: string;
  apiKey: string;
  environment: TransbankEnvironment;
}

const HOSTS: Record<TransbankEnvironment, string> = {
  integration: "https://webpay3gint.transbank.cl",
  production: "https://webpay3g.transbank.cl",
};

export function getTransbankCredentials(store?: {
  transbankCommerceCode?: string | null;
  transbankApiKey?: string | null;
  transbankEnvironment?: string | null;
} | null): TransbankCredentials | null {
  const commerceCode =
    store?.transbankCommerceCode?.trim() ||
    process.env.TRANSBANK_COMMERCE_CODE?.trim();
  const apiKey =
    store?.transbankApiKey?.trim() || process.env.TRANSBANK_API_KEY?.trim();

  if (!commerceCode || !apiKey) return null;

  const envRaw =
    store?.transbankEnvironment?.trim() ||
    process.env.TRANSBANK_ENVIRONMENT?.trim() ||
    "integration";

  const environment: TransbankEnvironment =
    envRaw === "production" ? "production" : "integration";

  return { commerceCode, apiKey, environment };
}

export function isTransbankConfigured(
  store?: Parameters<typeof getTransbankCredentials>[0]
): boolean {
  return getTransbankCredentials(store) !== null;
}

function apiBase(environment: TransbankEnvironment): string {
  return `${HOSTS[environment]}/rswebpaytransaction/api/webpay/v1.2`;
}

async function transbankFetch<T>(
  creds: TransbankCredentials,
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${apiBase(creds.environment)}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Tbk-Api-Key-Id": creds.commerceCode,
      "Tbk-Api-Key-Secret": creds.apiKey,
      ...init?.headers,
    },
  });

  const data = (await res.json()) as T & {
    error_message?: string;
    message?: string;
  };

  if (!res.ok) {
    const msg =
      (data as { error_message?: string }).error_message ??
      (data as { message?: string }).message ??
      `Transbank error ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

export function buildBuyOrder(registrationId: string): string {
  const id = registrationId.replace(/[^a-zA-Z0-9]/g, "").slice(-22);
  return `SL${id}`.slice(0, 26);
}

export async function createWebpayTransaction(
  creds: TransbankCredentials,
  input: {
    buyOrder: string;
    sessionId: string;
    amount: number;
    returnUrl: string;
  }
): Promise<{ token: string; url: string }> {
  const data = await transbankFetch<{ token: string; url: string }>(
    creds,
    "/transactions",
    {
      method: "POST",
      body: JSON.stringify({
        buy_order: input.buyOrder,
        session_id: input.sessionId.slice(0, 61),
        amount: Math.round(input.amount),
        return_url: input.returnUrl.slice(0, 256),
      }),
    }
  );

  if (!data.token || !data.url) {
    throw new Error("Respuesta inválida de Transbank");
  }

  return data;
}

export async function commitWebpayTransaction(
  creds: TransbankCredentials,
  token: string
): Promise<{
  status: string;
  buy_order: string;
  authorization_code?: string;
  amount?: number;
}> {
  return transbankFetch(creds, `/transactions/${token}`, { method: "PUT" });
}
