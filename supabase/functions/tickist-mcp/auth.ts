// Dual-mode authentication: Supabase JWT (OAuth) or API token (Codex/CLI)

import { createClient } from "npm:@supabase/supabase-js@2";

export interface AuthResult {
    userId: string;
}

/**
 * Authenticate a request using either:
 * 1. Supabase JWT (from OAuth flow / ChatGPT)
 * 2. Personal API token (from Codex / CLI)
 */
export const authenticateRequest = async (
    req: Request,
    supabaseUrl: string,
    supabaseServiceKey: string,
): Promise<AuthResult> => {
    const authorization = req.headers.get("Authorization")?.trim() ?? "";
    if (!authorization) {
        throw new AuthError("Missing Authorization header");
    }

    const [scheme, token] = authorization.split(/\s+/, 2);
    if (scheme?.toLowerCase() !== "bearer" || !token) {
        throw new AuthError("Invalid Authorization header format. Expected: Bearer <token>");
    }

    // Strategy 1: Try Supabase JWT
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: jwtError } = await supabase.auth.getUser(token);

    if (!jwtError && user) {
        return { userId: user.id };
    }

    // Strategy 2: Try API token lookup
    const tokenHash = await sha256Hex(token);
    const { data: apiToken, error: tokenError } = await supabase
        .from("api_tokens")
        .select("owner_id, expires_at")
        .eq("token_hash", tokenHash)
        .maybeSingle();

    if (tokenError || !apiToken) {
        throw new AuthError("Invalid or expired token");
    }

    // Check expiration
    if (apiToken.expires_at && new Date(apiToken.expires_at) < new Date()) {
        throw new AuthError("API token has expired");
    }

    // Update last_used_at (fire-and-forget)
    supabase
        .from("api_tokens")
        .update({ last_used_at: new Date().toISOString() })
        .eq("token_hash", tokenHash)
        .then(() => { });

    return { userId: apiToken.owner_id };
};

export class AuthError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "AuthError";
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const sha256Hex = async (value: string): Promise<string> => {
    const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(value),
    );
    return [...new Uint8Array(digest)]
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
};
