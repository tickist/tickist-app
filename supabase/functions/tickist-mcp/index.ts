// Tickist MCP Server — Supabase Edge Function
// Implements dual-era MCP over Streamable HTTP: 2026-07-28 and 2025-06-18.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { requireEnv, requireSupabaseSecretKey } from '../_shared/common.ts';
import {
  type JsonRpcRequest,
  jsonRpcError,
  parseJsonRpcBody,
  validateJsonRpcRequest,
  requestEra,
  validateModernRequest,
  LEGACY_PROTOCOL_VERSION,
  ERROR_INTERNAL,
} from './mcp-protocol.ts';
import { handleMcpMethod, type ToolHandler } from './mcp-handler.ts';
import { authenticateRequest, AuthError } from './auth.ts';
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
} from './tools/projects.ts';
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  completeTask,
  deleteTask,
} from './tools/tasks.ts';
import { listTags, createTag, addTagToTask } from './tools/tags.ts';

const ALLOWED_ORIGINS = [
  'https://tickist.com',
  'https://www.tickist.com',
  'http://localhost:4200',
  'http://127.0.0.1:4200',
];

const resolveOrigin = (req: Request): string | null =>
  req.headers.get('Origin');

const isAllowedOrigin = (origin: string | null): boolean =>
  origin === null || ALLOWED_ORIGINS.includes(origin);

const buildCorsHeaders = (origin: string | null): Record<string, string> => ({
  'Access-Control-Allow-Origin': origin ?? ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers':
    'accept, authorization, content-type, mcp-protocol-version, mcp-method, mcp-name',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  Vary: 'Origin',
});

const MAX_BODY_BYTES = 64 * 1024; // 64 KB

const protocolErrorStatus = (headers: Headers): number => {
  const version = headers.get('MCP-Protocol-Version');
  return version && version !== LEGACY_PROTOCOL_VERSION ? 400 : 200;
};

const jsonResponse = (
  status: number,
  body: unknown,
  corsHeaders: Record<string, string>
): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

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

// ─── HTTP Handler ────────────────────────────────────────────────────────────

serve(async (req) => {
  const origin = resolveOrigin(req);
  const cors = buildCorsHeaders(origin);

  if (!isAllowedOrigin(origin)) {
    return jsonResponse(403, { error: 'Forbidden origin.' }, cors);
  }

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  // MCP uses POST for the Streamable HTTP transport
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed. Use POST.' }, cors);
  }

  const contentType = req.headers
    .get('Content-Type')
    ?.split(';', 1)[0]
    .trim()
    .toLowerCase();
  if (contentType !== 'application/json') {
    return jsonResponse(
      415,
      { error: 'Content-Type must be application/json.' },
      cors
    );
  }

  // Reject a declared oversized body before reading it. The measured-byte
  // check below remains authoritative because Content-Length is optional and
  // can be inaccurate.
  const contentLength = parseInt(req.headers.get('Content-Length') ?? '0', 10);
  if (contentLength > MAX_BODY_BYTES) {
    return jsonResponse(413, { error: 'Request body too large.' }, cors);
  }

  const requestBody = await req.arrayBuffer();
  if (requestBody.byteLength > MAX_BODY_BYTES) {
    return jsonResponse(413, { error: 'Request body too large.' }, cors);
  }

  // Authenticate
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const supabaseServiceKey = requireSupabaseSecretKey();

  let userId: string;
  let grantedScopes: readonly string[] | null;
  try {
    const auth = await authenticateRequest(
      req,
      supabaseUrl,
      supabaseServiceKey
    );
    userId = auth.userId;
    grantedScopes = auth.scopes;
  } catch (err) {
    if (err instanceof AuthError) {
      const response = jsonResponse(401, { error: err.message }, cors);
      response.headers.set('WWW-Authenticate', 'Bearer realm="Tickist MCP"');
      return response;
    }
    return jsonResponse(500, { error: 'Authentication failed' }, cors);
  }

  // Parse JSON-RPC request as strict UTF-8.
  const bodyParsing = parseJsonRpcBody(requestBody);
  if (!bodyParsing.valid) {
    return jsonResponse(
      protocolErrorStatus(req.headers),
      bodyParsing.response,
      cors
    );
  }
  const rpcMessage = bodyParsing.value;

  const requestValidation = validateJsonRpcRequest(rpcMessage);
  if (!requestValidation.valid) {
    return jsonResponse(
      protocolErrorStatus(req.headers),
      requestValidation.response,
      cors
    );
  }
  const rpcRequest: JsonRpcRequest = requestValidation.request;

  const era = requestEra(rpcRequest, req.headers);
  if (era === 'modern') {
    const validationError = validateModernRequest(rpcRequest, req.headers);
    if (validationError) {
      return jsonResponse(
        validationError.status,
        validationError.response,
        cors
      );
    }
  }

  // Route to handler
  try {
    const result = await handleMcpMethod(
      rpcRequest,
      era,
      userId,
      TOOL_HANDLERS,
      grantedScopes
    );
    return result.response
      ? jsonResponse(result.status, result.response, cors)
      : new Response(null, { status: result.status, headers: cors });
  } catch (err) {
    console.error('[tickist-mcp] Unhandled error', err);
    return jsonResponse(
      200,
      jsonRpcError(
        rpcRequest.id ?? null,
        ERROR_INTERNAL,
        'Internal server error'
      ),
      cors
    );
  }
});
