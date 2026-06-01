import { msg } from "@/lib/messages";

export function loginErrorResponse(err: unknown) {
  const text =
    err instanceof Error ? err.message : typeof err === "string" ? err : "";

  console.error("Login error:", err);

  if (text.includes("MONGODB_URI is not defined")) {
    return {
      status: 500,
      body: { error: msg.api.missingMongoUri, code: "MISSING_MONGODB_URI" },
    };
  }

  if (text.includes("SESSION_SECRET is not defined")) {
    return {
      status: 500,
      body: { error: msg.api.missingSessionSecret, code: "MISSING_SESSION_SECRET" },
    };
  }

  if (text.includes("ADMIN_EMAIL and ADMIN_PASSWORD")) {
    return {
      status: 500,
      body: { error: msg.api.missingAdminEnv, code: "MISSING_ADMIN_ENV" },
    };
  }

  const isDbError =
    text.includes("MongoServerSelectionError") ||
    text.includes("MongoNetworkError") ||
    text.includes("authentication failed") ||
    text.includes("bad auth") ||
    text.includes("ENOTFOUND") ||
    text.includes("ETIMEDOUT") ||
    text.includes("ECONNREFUSED");

  if (isDbError) {
    return {
      status: 500,
      body: { error: msg.api.dbConnectionFailed, code: "DB_CONNECTION" },
    };
  }

  return {
    status: 500,
    body: { error: msg.api.serverConfigError, code: "UNKNOWN" },
  };
}
