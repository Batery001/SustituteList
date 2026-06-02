export function getPublicBaseUrl(request: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, "");

  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return "http://localhost:3000";
}
