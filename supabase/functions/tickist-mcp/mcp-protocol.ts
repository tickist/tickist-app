// MCP protocol types and helpers (JSON-RPC 2.0 + dual-era MCP support)

// ─── JSON-RPC 2.0 ───────────────────────────────────────────────────────────

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: JsonRpcError;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

// Standard JSON-RPC error codes
export const ERROR_PARSE = -32700;
export const ERROR_INVALID_REQUEST = -32600;
export const ERROR_METHOD_NOT_FOUND = -32601;
export const ERROR_INVALID_PARAMS = -32602;
export const ERROR_INTERNAL = -32603;
export const ERROR_HEADER_MISMATCH = -32020;
export const ERROR_UNSUPPORTED_PROTOCOL_VERSION = -32022;

export const jsonRpcError = (
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown
): JsonRpcResponse => ({
  jsonrpc: '2.0',
  id,
  error: { code, message, ...(data !== undefined ? { data } : {}) },
});

export const jsonRpcResult = (
  id: string | number | null,
  result: unknown
): JsonRpcResponse => ({
  jsonrpc: '2.0',
  id,
  result,
});

// ─── MCP Types ───────────────────────────────────────────────────────────────

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface McpToolResult {
  content: McpContentBlock[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

export interface McpContentBlock {
  type: 'text';
  text: string;
}

export const textResult = (text: string): McpToolResult => ({
  content: [{ type: 'text', text }],
});

export const errorResult = (message: string): McpToolResult => ({
  content: [{ type: 'text', text: message }],
  isError: true,
});

export const jsonResult = (data: unknown): McpToolResult => ({
  content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  ...(isRecord(data) ? { structuredContent: data } : {}),
});

// ─── Server Info ─────────────────────────────────────────────────────────────

export const SERVER_INFO = {
  name: 'tickist-mcp',
  version: '2.0.0',
};

export const PROTOCOL_VERSION = '2026-07-28';
export const LEGACY_PROTOCOL_VERSION = '2025-06-18';
// Stateless negotiation advertises only stateless protocol revisions. Legacy
// support is selected separately through the initialize handshake.
export const SUPPORTED_PROTOCOL_VERSIONS = [PROTOCOL_VERSION] as const;

export type ProtocolEra = 'modern' | 'legacy';

export interface ModernRequestMetadata {
  'io.modelcontextprotocol/protocolVersion': string;
  'io.modelcontextprotocol/clientInfo'?: {
    icons?: Array<{
      src: string;
      mimeType?: string;
      sizes?: string[];
      theme?: 'light' | 'dark';
    }>;
    name: string;
    title?: string;
    version: string;
    description?: string;
    websiteUrl?: string;
  };
  'io.modelcontextprotocol/clientCapabilities': Record<string, unknown>;
  [key: string]: unknown;
}

export interface ProtocolValidationError {
  status: 400;
  response: JsonRpcResponse;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isOptionalString = (value: unknown): boolean =>
  value === undefined || typeof value === 'string';

const isImplementation = (value: unknown): boolean => {
  if (!isRecord(value)) return false;

  const icons = value.icons;
  const hasValidIcons =
    icons === undefined ||
    (Array.isArray(icons) &&
      icons.every(
        (icon) =>
          isRecord(icon) &&
          typeof icon.src === 'string' &&
          isOptionalString(icon.mimeType) &&
          (icon.sizes === undefined ||
            (Array.isArray(icon.sizes) &&
              icon.sizes.every((size) => typeof size === 'string'))) &&
          (icon.theme === undefined ||
            icon.theme === 'light' ||
            icon.theme === 'dark')
      ));

  return (
    typeof value.name === 'string' &&
    typeof value.version === 'string' &&
    isOptionalString(value.title) &&
    isOptionalString(value.description) &&
    isOptionalString(value.websiteUrl) &&
    hasValidIcons
  );
};

export type JsonRpcRequestValidation =
  | { valid: true; request: JsonRpcRequest }
  | { valid: false; response: JsonRpcResponse };

export const validateJsonRpcRequest = (
  value: unknown
): JsonRpcRequestValidation => {
  const candidate = isRecord(value) ? value : undefined;
  const candidateId = candidate?.id;
  const id =
    typeof candidateId === 'string' ||
    (typeof candidateId === 'number' && Number.isInteger(candidateId))
      ? candidateId
      : null;
  const hasId = candidate
    ? Object.prototype.hasOwnProperty.call(candidate, 'id')
    : false;

  if (
    !candidate ||
    candidate.jsonrpc !== '2.0' ||
    typeof candidate.method !== 'string' ||
    candidate.method.length === 0 ||
    (hasId && id === null) ||
    (candidate.params !== undefined && !isRecord(candidate.params))
  ) {
    return {
      valid: false,
      response: jsonRpcError(
        id,
        ERROR_INVALID_REQUEST,
        'Invalid JSON-RPC 2.0 request'
      ),
    };
  }

  return {
    valid: true,
    request: {
      jsonrpc: '2.0',
      ...(hasId ? { id: id as string | number } : {}),
      method: candidate.method,
      ...(candidate.params !== undefined
        ? { params: candidate.params as Record<string, unknown> }
        : {}),
    },
  };
};

export type JsonRpcBodyParsing =
  | { valid: true; value: unknown }
  | { valid: false; response: JsonRpcResponse };

export const parseJsonRpcBody = (body: ArrayBuffer): JsonRpcBodyParsing => {
  try {
    return {
      valid: true,
      value: JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(body)),
    };
  } catch {
    return {
      valid: false,
      response: jsonRpcError(null, ERROR_PARSE, 'Parse error: invalid JSON'),
    };
  }
};

export const requestMetadata = (
  request: JsonRpcRequest
): ModernRequestMetadata | undefined => {
  const metadata = request.params?._meta;
  return isRecord(metadata) ? (metadata as ModernRequestMetadata) : undefined;
};

export const requestEra = (
  request: JsonRpcRequest,
  headers: Headers
): ProtocolEra => {
  const metadata = requestMetadata(request);
  const headerVersion = headers.get('MCP-Protocol-Version');
  if (
    request.method === 'server/discover' ||
    typeof metadata?.['io.modelcontextprotocol/protocolVersion'] === 'string' ||
    (headerVersion !== null && headerVersion !== LEGACY_PROTOCOL_VERSION)
  ) {
    return 'modern';
  }

  return 'legacy';
};

const decodeMirroredHeader = (value: string): string | undefined => {
  const hasSentinel = value.startsWith('=?base64?') && value.endsWith('?=');
  if (!hasSentinel) {
    const isPlainHeaderSafe =
      value.length > 0 &&
      value.trim() === value &&
      /^[\t\x20-\x7e]+$/.test(value);
    return isPlainHeaderSafe ? value : undefined;
  }

  const match =
    /^=\?base64\?((?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?)\?=$/.exec(
      value
    );
  if (!match || match[1].length === 0) {
    return undefined;
  }

  try {
    const bytes = Uint8Array.from(atob(match[1]), (character) =>
      character.charCodeAt(0)
    );
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return undefined;
  }
};

const headerMismatch = (
  id: string | number | undefined,
  message: string
): ProtocolValidationError => ({
  status: 400,
  response: jsonRpcError(id ?? null, ERROR_HEADER_MISMATCH, message),
});

export const validateModernRequest = (
  request: JsonRpcRequest,
  headers: Headers
): ProtocolValidationError | null => {
  const metadata = requestMetadata(request);
  const headerVersion = headers.get('MCP-Protocol-Version');
  const bodyVersion = metadata?.['io.modelcontextprotocol/protocolVersion'];

  if (
    !headerVersion ||
    typeof bodyVersion !== 'string' ||
    headerVersion !== bodyVersion
  ) {
    return headerMismatch(
      request.id,
      'MCP-Protocol-Version header must match request metadata'
    );
  }

  if (
    !SUPPORTED_PROTOCOL_VERSIONS.includes(
      bodyVersion as (typeof SUPPORTED_PROTOCOL_VERSIONS)[number]
    ) ||
    bodyVersion !== PROTOCOL_VERSION
  ) {
    return {
      status: 400,
      response: jsonRpcError(
        request.id ?? null,
        ERROR_UNSUPPORTED_PROTOCOL_VERSION,
        'Unsupported protocol version',
        {
          supported: [...SUPPORTED_PROTOCOL_VERSIONS],
          requested: bodyVersion,
        }
      ),
    };
  }

  if (!isRecord(metadata?.['io.modelcontextprotocol/clientCapabilities'])) {
    return {
      status: 400,
      response: jsonRpcError(
        request.id ?? null,
        ERROR_INVALID_PARAMS,
        'Missing required client capabilities metadata'
      ),
    };
  }

  const clientInfo = metadata?.['io.modelcontextprotocol/clientInfo'];
  if (clientInfo !== undefined && !isImplementation(clientInfo)) {
    return {
      status: 400,
      response: jsonRpcError(
        request.id ?? null,
        ERROR_INVALID_PARAMS,
        'Client info must include string name and version fields'
      ),
    };
  }

  const methodHeader = headers.get('Mcp-Method');
  if (!methodHeader || methodHeader !== request.method) {
    return headerMismatch(
      request.id,
      'Mcp-Method header must match request method'
    );
  }

  const mirroredName =
    request.method === 'tools/call' || request.method === 'prompts/get'
      ? request.params?.name
      : request.method === 'resources/read'
      ? request.params?.uri
      : undefined;

  if (
    request.method === 'tools/call' ||
    request.method === 'prompts/get' ||
    request.method === 'resources/read'
  ) {
    const nameHeader = headers.get('Mcp-Name');
    const decodedName = nameHeader
      ? decodeMirroredHeader(nameHeader)
      : undefined;

    if (
      typeof mirroredName !== 'string' ||
      decodedName === undefined ||
      decodedName !== mirroredName
    ) {
      return headerMismatch(
        request.id,
        'Mcp-Name header must match the request name or URI'
      );
    }
  }

  return null;
};

export const completeResult = <T extends Record<string, unknown>>(
  result: T
): T & {
  resultType: 'complete';
  _meta: { 'io.modelcontextprotocol/serverInfo': typeof SERVER_INFO };
} => ({
  resultType: 'complete',
  ...result,
  _meta: {
    'io.modelcontextprotocol/serverInfo': SERVER_INFO,
  },
});

// ─── Tool Definitions ────────────────────────────────────────────────────────

export const TOOL_DEFINITIONS: McpToolDefinition[] = [
  // Projects
  {
    name: 'list_projects',
    description: 'List all projects for the authenticated user',
    inputSchema: {
      type: 'object',
      properties: {
        is_active: {
          type: 'boolean',
          description: 'Filter by active status. Defaults to true.',
        },
      },
    },
  },
  {
    name: 'get_project',
    description: 'Get a single project by its ID',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          format: 'uuid',
          description: 'Project UUID',
        },
      },
      required: ['project_id'],
    },
  },
  {
    name: 'create_project',
    description: 'Create a new project',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Project name' },
        description: { type: 'string', description: 'Project description' },
        color: { type: 'string', description: 'Hex color, e.g. #394264' },
        icon: { type: 'string', description: 'Icon identifier, e.g. tick' },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_project',
    description: 'Update an existing project',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          format: 'uuid',
          description: 'Project UUID',
        },
        name: { type: 'string', description: 'New project name' },
        description: { type: 'string', description: 'New description' },
        color: { type: 'string', description: 'New hex color' },
        icon: { type: 'string', description: 'New icon identifier' },
        is_active: { type: 'boolean', description: 'Set active status' },
      },
      required: ['project_id'],
    },
  },

  // Tasks
  {
    name: 'list_tasks',
    description:
      'List tasks. Filterable by project_id, is_done, is_active, priority. Returns up to 100 tasks by default.',
    inputSchema: {
      type: 'object',
      properties: {
        project_id: {
          type: 'string',
          format: 'uuid',
          description: 'Filter by project',
        },
        is_done: {
          type: 'boolean',
          description: 'Filter by completion status',
        },
        is_active: { type: 'boolean', description: 'Filter by active status' },
        priority: {
          type: 'string',
          enum: ['A', 'B', 'C', 'normal'],
          description: 'Filter by priority',
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 500,
          description: 'Max results (default 100, max 500)',
        },
      },
    },
  },
  {
    name: 'get_task',
    description: 'Get a single task by ID, including its steps and tags',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', format: 'uuid', description: 'Task UUID' },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'create_task',
    description: 'Create a new task',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Task name' },
        project_id: {
          type: 'string',
          format: 'uuid',
          description:
            'Project to add the task to. If omitted, uses the inbox project.',
        },
        description: { type: 'string', description: 'Task description' },
        priority: {
          type: 'string',
          enum: ['A', 'B', 'C', 'normal'],
          description: 'Priority level (default: normal)',
        },
        finish_date: {
          type: 'string',
          format: 'date',
          description: 'Due date in YYYY-MM-DD format',
        },
        pinned: { type: 'boolean', description: 'Pin the task' },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_task',
    description: 'Update fields on an existing task',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', format: 'uuid', description: 'Task UUID' },
        name: { type: 'string', description: 'New task name' },
        description: { type: 'string', description: 'New description' },
        project_id: {
          type: 'string',
          format: 'uuid',
          description: 'Move to project',
        },
        priority: {
          type: 'string',
          enum: ['A', 'B', 'C', 'normal'],
          description: 'New priority',
        },
        finish_date: {
          type: ['string', 'null'],
          format: 'date',
          description: 'New due date (YYYY-MM-DD) or null to clear',
        },
        pinned: { type: 'boolean', description: 'Pin/unpin' },
        on_hold: { type: 'boolean', description: 'Put on hold / resume' },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'complete_task',
    description: 'Mark a task as done (or reopen it)',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', format: 'uuid', description: 'Task UUID' },
        is_done: {
          type: 'boolean',
          description: 'true to complete, false to reopen. Default: true',
        },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'delete_task',
    description: 'Permanently delete a task',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', format: 'uuid', description: 'Task UUID' },
      },
      required: ['task_id'],
    },
  },

  // Tags
  {
    name: 'list_tags',
    description: 'List all tags for the authenticated user',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'create_tag',
    description: 'Create a new tag',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Tag name' },
      },
      required: ['name'],
    },
  },
  {
    name: 'add_tag_to_task',
    description: 'Associate a tag with a task',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', format: 'uuid', description: 'Task UUID' },
        tag_id: { type: 'string', format: 'uuid', description: 'Tag UUID' },
      },
      required: ['task_id', 'tag_id'],
    },
  },
];

const matchesJsonSchemaType = (value: unknown, type: string): boolean => {
  switch (type) {
    case 'null':
      return value === null;
    case 'string':
      return typeof value === 'string';
    case 'boolean':
      return typeof value === 'boolean';
    case 'integer':
      return typeof value === 'number' && Number.isSafeInteger(value);
    case 'object':
      return isRecord(value);
    default:
      return false;
  }
};

const isValidUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const isValidDate = (value: string): boolean => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

export const validateToolArguments = (
  toolName: string,
  args: Record<string, unknown>
): string | null => {
  const definition = TOOL_DEFINITIONS.find((tool) => tool.name === toolName);
  if (!definition) {
    return null;
  }

  const schema = definition.inputSchema;
  const required = Array.isArray(schema.required)
    ? schema.required.filter((key): key is string => typeof key === 'string')
    : [];

  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(args, key)) {
      return `${key} is required`;
    }
  }

  const properties = isRecord(schema.properties) ? schema.properties : {};
  for (const [key, value] of Object.entries(args)) {
    const propertySchema = properties[key];
    if (!isRecord(propertySchema) || value === undefined) {
      continue;
    }

    const declaredType = propertySchema.type;
    const allowedTypes = Array.isArray(declaredType)
      ? declaredType.filter((type): type is string => typeof type === 'string')
      : typeof declaredType === 'string'
      ? [declaredType]
      : [];
    if (
      allowedTypes.length > 0 &&
      !allowedTypes.some((type) => matchesJsonSchemaType(value, type))
    ) {
      return `${key} must be ${allowedTypes.join(' or ')}`;
    }

    if (
      Array.isArray(propertySchema.enum) &&
      !propertySchema.enum.includes(value)
    ) {
      return `${key} must be one of: ${propertySchema.enum.join(', ')}`;
    }

    if (
      propertySchema.format === 'uuid' &&
      typeof value === 'string' &&
      !isValidUuid(value)
    ) {
      return `${key} must be a UUID`;
    }

    if (
      propertySchema.format === 'date' &&
      typeof value === 'string' &&
      !isValidDate(value)
    ) {
      return `${key} must be a valid YYYY-MM-DD date`;
    }

    if (
      typeof value === 'number' &&
      typeof propertySchema.minimum === 'number' &&
      value < propertySchema.minimum
    ) {
      return `${key} must be at least ${propertySchema.minimum}`;
    }

    if (
      typeof value === 'number' &&
      typeof propertySchema.maximum === 'number' &&
      value > propertySchema.maximum
    ) {
      return `${key} must be at most ${propertySchema.maximum}`;
    }
  }

  return null;
};
