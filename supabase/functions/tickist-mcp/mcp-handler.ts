import {
  type JsonRpcRequest,
  type JsonRpcResponse,
  type McpToolResult,
  type ProtocolEra,
  ERROR_INVALID_PARAMS,
  ERROR_INVALID_REQUEST,
  ERROR_METHOD_NOT_FOUND,
  LEGACY_PROTOCOL_VERSION,
  PROTOCOL_VERSION,
  SERVER_INFO,
  SUPPORTED_PROTOCOL_VERSIONS,
  TOOL_DEFINITIONS,
  completeResult,
  errorResult,
  jsonRpcError,
  jsonRpcResult,
  validateToolArguments,
} from './mcp-protocol.ts';

export type ToolHandler = (
  userId: string,
  args: Record<string, unknown>
) => Promise<McpToolResult>;

export interface McpMethodResult {
  status: number;
  response?: JsonRpcResponse;
}

const TOOL_SCOPES: Readonly<Record<string, readonly string[]>> = {
  list_projects: ['projects:read'],
  get_project: ['projects:read'],
  create_project: ['projects:write'],
  update_project: ['projects:write'],
  list_tasks: ['tasks:read'],
  get_task: ['tasks:read'],
  create_task: ['tasks:write'],
  update_task: ['tasks:write'],
  complete_task: ['tasks:write'],
  delete_task: ['tasks:write'],
  list_tags: ['tags:read'],
  create_tag: ['tags:write'],
  add_tag_to_task: ['tasks:write', 'tags:write'],
};

const missingToolScopes = (
  toolName: string,
  grantedScopes: readonly string[] | null
): readonly string[] => {
  if (grantedScopes === null) {
    return [];
  }

  const granted = new Set(grantedScopes);
  return (TOOL_SCOPES[toolName] ?? []).filter((scope) => !granted.has(scope));
};

const response = (status: number, value: JsonRpcResponse): McpMethodResult => ({
  status,
  response: value,
});

export const handleMcpMethod = async (
  request: JsonRpcRequest,
  era: ProtocolEra,
  userId: string,
  toolHandlers: Record<string, ToolHandler>,
  grantedScopes: readonly string[] | null = null
): Promise<McpMethodResult> => {
  const id = request.id ?? null;

  if (
    request.id === undefined &&
    !(era === 'legacy' && request.method === 'notifications/initialized')
  ) {
    return response(
      400,
      jsonRpcError(
        null,
        ERROR_INVALID_REQUEST,
        'JSON-RPC requests require a string or number id'
      )
    );
  }

  switch (request.method) {
    case 'initialize': {
      if (era === 'modern') {
        return response(
          404,
          jsonRpcError(id, ERROR_METHOD_NOT_FOUND, 'Unknown method: initialize')
        );
      }

      return response(
        200,
        jsonRpcResult(id, {
          protocolVersion: LEGACY_PROTOCOL_VERSION,
          capabilities: {
            tools: { listChanged: false },
          },
          serverInfo: SERVER_INFO,
        })
      );
    }

    case 'notifications/initialized': {
      if (era === 'modern') {
        return response(
          404,
          jsonRpcError(
            id,
            ERROR_METHOD_NOT_FOUND,
            'Unknown method: notifications/initialized'
          )
        );
      }

      return request.id === undefined
        ? { status: 202 }
        : response(200, jsonRpcResult(id, {}));
    }

    case 'server/discover': {
      if (era !== 'modern') {
        return response(
          200,
          jsonRpcError(
            id,
            ERROR_METHOD_NOT_FOUND,
            'Unknown method: server/discover'
          )
        );
      }

      return response(
        200,
        jsonRpcResult(
          id,
          completeResult({
            supportedVersions: [...SUPPORTED_PROTOCOL_VERSIONS],
            capabilities: {
              tools: { listChanged: false },
            },
            instructions:
              "Manage the authenticated Tickist user's projects, tasks, and tags.",
            ttlMs: 300_000,
            cacheScope: 'public',
          })
        )
      );
    }

    case 'tools/list': {
      const result =
        era === 'modern'
          ? completeResult({
              tools: TOOL_DEFINITIONS,
              ttlMs: 300_000,
              cacheScope: 'public',
            })
          : { tools: TOOL_DEFINITIONS };
      return response(200, jsonRpcResult(id, result));
    }

    case 'tools/call': {
      const toolName = request.params?.name;
      const toolArgs = request.params?.arguments;

      if (typeof toolName !== 'string') {
        return response(
          200,
          jsonRpcError(id, ERROR_INVALID_PARAMS, 'Missing tool name')
        );
      }

      if (
        toolArgs !== undefined &&
        (typeof toolArgs !== 'object' ||
          toolArgs === null ||
          Array.isArray(toolArgs))
      ) {
        return response(
          200,
          jsonRpcError(
            id,
            ERROR_INVALID_PARAMS,
            'Tool arguments must be an object'
          )
        );
      }

      if (!Object.prototype.hasOwnProperty.call(toolHandlers, toolName)) {
        return response(
          200,
          jsonRpcError(
            id,
            ERROR_INVALID_PARAMS,
            `Unknown tool: ${toolName}. Available: ${Object.keys(
              toolHandlers
            ).join(', ')}`
          )
        );
      }
      const handler = toolHandlers[toolName];

      const missingScopes = missingToolScopes(toolName, grantedScopes);
      if (missingScopes.length > 0) {
        const result = errorResult(
          `Insufficient API token scope. Required: ${missingScopes.join(', ')}`
        );
        return response(
          200,
          jsonRpcResult(
            id,
            era === 'modern' ? completeResult({ ...result }) : result
          )
        );
      }

      const argumentError = validateToolArguments(
        toolName,
        (toolArgs as Record<string, unknown> | undefined) ?? {}
      );
      if (argumentError) {
        return response(
          200,
          jsonRpcError(
            id,
            ERROR_INVALID_PARAMS,
            `Invalid arguments for ${toolName}: ${argumentError}`
          )
        );
      }

      try {
        const result = await handler(
          userId,
          (toolArgs as Record<string, unknown> | undefined) ?? {}
        );
        return response(
          200,
          jsonRpcResult(
            id,
            era === 'modern' ? completeResult({ ...result }) : result
          )
        );
      } catch (error) {
        console.error(`[tickist-mcp] Tool error: ${toolName}`, error);
        const result = errorResult('Tool execution failed');
        return response(
          200,
          jsonRpcResult(
            id,
            era === 'modern' ? completeResult({ ...result }) : result
          )
        );
      }
    }

    default:
      return response(
        era === 'modern' ? 404 : 200,
        jsonRpcError(
          id,
          ERROR_METHOD_NOT_FOUND,
          `Unknown method: ${request.method}`,
          era === 'modern'
            ? { supportedProtocolVersions: [PROTOCOL_VERSION] }
            : undefined
        )
      );
  }
};
