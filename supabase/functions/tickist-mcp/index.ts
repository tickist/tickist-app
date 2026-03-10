// Tickist MCP Server — Supabase Edge Function
// Implements MCP 2025-06-18 over Streamable HTTP (POST-based JSON-RPC 2.0)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
    type JsonRpcRequest,
    type JsonRpcResponse,
    type McpToolResult,
    TOOL_DEFINITIONS,
    SERVER_INFO,
    PROTOCOL_VERSION,
    jsonRpcError,
    jsonRpcResult,
    errorResult,
    ERROR_PARSE,
    ERROR_INVALID_REQUEST,
    ERROR_METHOD_NOT_FOUND,
    ERROR_INVALID_PARAMS,
    ERROR_INTERNAL,
} from "./mcp-protocol.ts";
import { authenticateRequest, AuthError } from "./auth.ts";
import { listProjects, getProject, createProject, updateProject } from "./tools/projects.ts";
import { listTasks, getTask, createTask, updateTask, completeTask, deleteTask } from "./tools/tasks.ts";
import { listTags, createTag, addTagToTask } from "./tools/tags.ts";

const ALLOWED_ORIGINS = [
    "https://tickist.com",
    "https://www.tickist.com",
    "http://localhost:4200",
    "http://127.0.0.1:4200",
];

const resolveOrigin = (req: Request): string => {
    const origin = req.headers.get("Origin") ?? "";
    return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
};

const buildCorsHeaders = (origin: string): Record<string, string> => ({
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
});

const MAX_BODY_BYTES = 64 * 1024; // 64 KB

const jsonResponse = (status: number, body: unknown, corsHeaders: Record<string, string>): Response =>
    new Response(JSON.stringify(body), {
        status,
        headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
        },
    });

// ─── Tool Dispatcher ─────────────────────────────────────────────────────────

type ToolHandler = (userId: string, args: Record<string, unknown>) => Promise<McpToolResult>;

const TOOL_HANDLERS: Record<string, ToolHandler> = {
    list_projects: listProjects,
    get_project: getProject,
    create_project: createProject,
    update_project: updateProject,
    list_tasks: listTasks,
    get_task: getTask,
    create_task: createTask,
    update_task: updateTask,
    complete_task: completeTask,
    delete_task: deleteTask,
    list_tags: listTags,
    create_tag: createTag,
    add_tag_to_task: addTagToTask,
};

// ─── MCP Method Router ───────────────────────────────────────────────────────

const handleMcpMethod = async (
    method: string,
    params: Record<string, unknown> | undefined,
    userId: string,
    id: string | number | null,
): Promise<JsonRpcResponse> => {
    switch (method) {
        case "initialize": {
            return jsonRpcResult(id, {
                protocolVersion: PROTOCOL_VERSION,
                capabilities: {
                    tools: { listChanged: false },
                },
                serverInfo: SERVER_INFO,
            });
        }

        case "notifications/initialized": {
            // Client acknowledges initialization — no response needed for notifications
            // But since this came as a request with an id, just return empty result
            return jsonRpcResult(id, {});
        }

        case "tools/list": {
            return jsonRpcResult(id, {
                tools: TOOL_DEFINITIONS,
            });
        }

        case "tools/call": {
            const toolName = params?.name as string;
            const toolArgs = (params?.arguments as Record<string, unknown>) ?? {};

            if (!toolName) {
                return jsonRpcError(id, ERROR_INVALID_PARAMS, "Missing tool name");
            }

            const handler = TOOL_HANDLERS[toolName];
            if (!handler) {
                return jsonRpcError(
                    id,
                    ERROR_INVALID_PARAMS,
                    `Unknown tool: ${toolName}. Available: ${Object.keys(TOOL_HANDLERS).join(", ")}`,
                );
            }

            try {
                const result = await handler(userId, toolArgs);
                return jsonRpcResult(id, result);
            } catch (err) {
                const message = err instanceof Error ? err.message : "Unknown error";
                console.error(`[tickist-mcp] Tool error: ${toolName}`, err);
                return jsonRpcResult(id, errorResult(message));
            }
        }

        default:
            return jsonRpcError(id, ERROR_METHOD_NOT_FOUND, `Unknown method: ${method}`);
    }
};

// ─── HTTP Handler ────────────────────────────────────────────────────────────

serve(async (req) => {
    const origin = resolveOrigin(req);
    const cors = buildCorsHeaders(origin);

    // CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: cors });
    }

    // MCP uses POST for the Streamable HTTP transport
    if (req.method !== "POST") {
        return jsonResponse(405, { error: "Method not allowed. Use POST." }, cors);
    }

    // Enforce body size limit
    const contentLength = parseInt(req.headers.get("Content-Length") ?? "0", 10);
    if (contentLength > MAX_BODY_BYTES) {
        return jsonResponse(413, { error: "Request body too large." }, cors);
    }

    // Authenticate
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    let userId: string;
    try {
        const auth = await authenticateRequest(req, supabaseUrl, supabaseServiceKey);
        userId = auth.userId;
    } catch (err) {
        if (err instanceof AuthError) {
            return jsonResponse(401, { error: err.message }, cors);
        }
        return jsonResponse(500, { error: "Authentication failed" }, cors);
    }

    // Parse JSON-RPC request
    let rpcRequest: JsonRpcRequest;
    try {
        rpcRequest = (await req.json()) as JsonRpcRequest;
    } catch {
        return jsonResponse(200, jsonRpcError(null, ERROR_PARSE, "Parse error: invalid JSON"), cors);
    }

    if (rpcRequest.jsonrpc !== "2.0" || !rpcRequest.method) {
        return jsonResponse(
            200,
            jsonRpcError(
                rpcRequest?.id ?? null,
                ERROR_INVALID_REQUEST,
                "Invalid JSON-RPC 2.0 request",
            ),
            cors,
        );
    }

    // Route to handler
    try {
        const response = await handleMcpMethod(
            rpcRequest.method,
            rpcRequest.params as Record<string, unknown> | undefined,
            userId,
            rpcRequest.id,
        );
        return jsonResponse(200, response, cors);
    } catch (err) {
        console.error("[tickist-mcp] Unhandled error", err);
        return jsonResponse(
            200,
            jsonRpcError(rpcRequest.id, ERROR_INTERNAL, "Internal server error"),
            cors,
        );
    }
});
