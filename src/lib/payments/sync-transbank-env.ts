import type { IStore } from "@/models/Store";

/** Copia credenciales de Vercel a la tienda si la BD aún no las tiene. */
export function applyTransbankEnvToStore(store: {
  transbankCommerceCode?: string | null;
  transbankApiKey?: string | null;
  transbankEnvironment?: string | null;
  isModified?: () => boolean;
}): void {
  const envCode = process.env.TRANSBANK_COMMERCE_CODE?.trim();
  const envKey = process.env.TRANSBANK_API_KEY?.trim();
  const envEnv = process.env.TRANSBANK_ENVIRONMENT?.trim();

  if (envCode && !store.transbankCommerceCode?.trim()) {
    store.transbankCommerceCode = envCode;
  }
  if (envKey && !store.transbankApiKey?.trim()) {
    store.transbankApiKey = envKey;
  }
  if (
    envEnv &&
    (envEnv === "production" || envEnv === "integration") &&
    !store.transbankEnvironment
  ) {
    store.transbankEnvironment = envEnv;
  }
}

export function transbankEnvStatus(): {
  commerceCode: boolean;
  apiKey: boolean;
  ready: boolean;
} {
  const commerceCode = Boolean(process.env.TRANSBANK_COMMERCE_CODE?.trim());
  const apiKey = Boolean(process.env.TRANSBANK_API_KEY?.trim());
  return { commerceCode, apiKey, ready: commerceCode && apiKey };
}
