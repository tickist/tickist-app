export const jsonHeaders = {
  "Content-Type": "application/json",
};

export const corsHeaders = {
  ...jsonHeaders,
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const jsonResponse = (
  status: number,
  body: unknown,
  withCors = false,
): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: withCors ? corsHeaders : jsonHeaders,
  });

export const requireEnv = (name: string): string => {
  const value = Deno.env.get(name)?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const requireFirstEnv = (...names: string[]): string => {
  for (const name of names) {
    const value = Deno.env.get(name)?.trim();
    if (value) {
      return value;
    }
  }
  throw new Error(
    `Missing required environment variable. Checked: ${names.join(", ")}`,
  );
};

export const getBearerToken = (req: Request): string | null => {
  const authorization = req.headers.get("Authorization")?.trim() ?? "";
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(/\s+/, 2);
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }
  return token;
};

export const getHeaderValue = (
  req: Request,
  headerName: string,
): string | null => {
  const value = req.headers.get(headerName)?.trim() ?? "";
  return value || null;
};

export const getInternalFunctionSecret = (req: Request): string | null =>
  getHeaderValue(req, "x-internal-function-secret") ??
  getHeaderValue(req, "x-internal-cron-secret") ??
  getBearerToken(req);

export const requireSupabaseSecretKey = (): string =>
  requireFirstEnv("SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY");

export const requireInternalFunctionSecret = (): string =>
  requireFirstEnv("INTERNAL_FUNCTION_SECRET", "ROUTINE_RUNNER_SECRET");

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const asOptionalString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const toSha256Hex = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

// Text written by one user and shown to another (notifications, email) loses
// control and bidirectional-override characters and is cut to a fixed length.
export const cleanDisplayText = (value: string, maxLength: number): string => {
  const cleaned = value
    .replace(/\p{Cc}/gu, " ")
    .replace(/[؜‎‏‪-‮⁦-⁩]/g, "")
    .trim();
  const characters = Array.from(cleaned);
  return characters.length > maxLength
    ? `${characters.slice(0, maxLength - 1).join("")}…`
    : cleaned;
};

// OAuth access tokens issued to connected apps (MCP clients) carry client_id.
// The token must already be verified, for example with auth.getUser().
export const isConnectedAppToken = (token: string): boolean => {
  const payload = token.split(".")[1];
  if (!payload) {
    return false;
  }
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const claims: unknown = JSON.parse(
      atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")),
    );
    return isRecord(claims) && typeof claims.client_id === "string" &&
      claims.client_id.length > 0;
  } catch {
    return false;
  }
};
