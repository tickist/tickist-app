import { describe, expect, it, vi } from 'vitest';
import {
  jsonRpcError,
  jsonRpcResult,
  textResult,
  errorResult,
  jsonResult,
  TOOL_DEFINITIONS,
  SERVER_INFO,
  PROTOCOL_VERSION,
  LEGACY_PROTOCOL_VERSION,
  SUPPORTED_PROTOCOL_VERSIONS,
  ERROR_HEADER_MISMATCH,
  ERROR_UNSUPPORTED_PROTOCOL_VERSION,
  ERROR_PARSE,
  ERROR_INVALID_REQUEST,
  ERROR_METHOD_NOT_FOUND,
  ERROR_INVALID_PARAMS,
  ERROR_INTERNAL,
  parseJsonRpcBody,
  requestEra,
  validateJsonRpcRequest,
  validateModernRequest,
  validateToolArguments,
} from './mcp-protocol';
import { handleMcpMethod, type ToolHandler } from './mcp-handler';

const TEST_UUID = '123e4567-e89b-42d3-a456-426614174000';

const modernRequest = (overrides: Record<string, unknown> = {}) => ({
  jsonrpc: '2.0' as const,
  id: 1,
  method: 'tools/list',
  params: {
    _meta: {
      'io.modelcontextprotocol/protocolVersion': PROTOCOL_VERSION,
      'io.modelcontextprotocol/clientCapabilities': {},
    },
  },
  ...overrides,
});

const modernHeaders = (overrides: Record<string, string> = {}) =>
  new Headers({
    'MCP-Protocol-Version': PROTOCOL_VERSION,
    'Mcp-Method': 'tools/list',
    ...overrides,
  });

describe('MCP Protocol helpers', () => {
  describe('jsonRpcError', () => {
    it('builds a valid JSON-RPC 2.0 error response', () => {
      const result = jsonRpcError(1, ERROR_PARSE, 'Parse error');
      expect(result).toEqual({
        jsonrpc: '2.0',
        id: 1,
        error: { code: -32700, message: 'Parse error' },
      });
    });

    it('includes data when provided', () => {
      const result = jsonRpcError(2, ERROR_INTERNAL, 'Oops', { detail: 'x' });
      expect(result.error?.data).toEqual({ detail: 'x' });
    });

    it('handles null id for notifications', () => {
      const result = jsonRpcError(null, ERROR_INVALID_REQUEST, 'Bad');
      expect(result.id).toBeNull();
    });
  });

  describe('jsonRpcResult', () => {
    it('builds a valid JSON-RPC 2.0 result response', () => {
      const result = jsonRpcResult(42, { hello: 'world' });
      expect(result).toEqual({
        jsonrpc: '2.0',
        id: 42,
        result: { hello: 'world' },
      });
    });
  });

  describe('textResult', () => {
    it('wraps a string in an MCP text content block', () => {
      const result = textResult('Hello');
      expect(result).toEqual({
        content: [{ type: 'text', text: 'Hello' }],
      });
    });
  });

  describe('errorResult', () => {
    it('returns an MCP error result with isError flag', () => {
      const result = errorResult('Something failed');
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe('Something failed');
    });
  });

  describe('jsonResult', () => {
    it('serializes data to indented JSON', () => {
      const result = jsonResult({ id: '123', name: 'Test' });
      expect(result.content[0].type).toBe('text');
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toEqual({ id: '123', name: 'Test' });
      expect(result.structuredContent).toEqual({ id: '123', name: 'Test' });
    });

    it('omits structuredContent when JSON data is not an object', () => {
      const result = jsonResult([{ id: 'task-1' }]);

      expect(JSON.parse(result.content[0].text)).toEqual([{ id: 'task-1' }]);
      expect(result.structuredContent).toBeUndefined();
    });
  });

  describe('JSON-RPC request validation', () => {
    it.each([null, 42, 'request', [], { jsonrpc: '2.0', method: 3 }])(
      'rejects malformed envelopes: %j',
      (value) => {
        const validation = validateJsonRpcRequest(value);

        expect(validation.valid).toBe(false);
        if (!validation.valid) {
          expect(validation.response.error?.code).toBe(ERROR_INVALID_REQUEST);
        }
      }
    );

    it('rejects null and object request ids', () => {
      for (const id of [null, { value: 1 }]) {
        const validation = validateJsonRpcRequest({
          jsonrpc: '2.0',
          id,
          method: 'tools/list',
        });

        expect(validation.valid).toBe(false);
      }
    });

    it('rejects a fractional numeric request id', () => {
      const validation = validateJsonRpcRequest({
        jsonrpc: '2.0',
        id: 1.5,
        method: 'tools/list',
      });

      expect(validation.valid).toBe(false);
      if (!validation.valid) {
        expect(validation.response.id).toBeNull();
        expect(validation.response.error?.code).toBe(ERROR_INVALID_REQUEST);
      }
    });

    it('returns a parse error for invalid UTF-8 bytes', () => {
      const invalidUtf8Json = Uint8Array.from([
        0x7b, 0x22, 0x78, 0x22, 0x3a, 0x22, 0xff, 0x22, 0x7d,
      ]).buffer;
      const parsing = parseJsonRpcBody(invalidUtf8Json);

      expect(parsing.valid).toBe(false);
      if (!parsing.valid) {
        expect(parsing.response.id).toBeNull();
        expect(parsing.response.error?.code).toBe(ERROR_PARSE);
      }
    });

    it('accepts an id-less envelope for later notification routing', () => {
      const validation = validateJsonRpcRequest({
        jsonrpc: '2.0',
        method: 'notifications/initialized',
      });

      expect(validation.valid).toBe(true);
    });
  });

  describe('TOOL_DEFINITIONS', () => {
    it('defines 13 tools', () => {
      expect(TOOL_DEFINITIONS).toHaveLength(13);
    });

    it('every tool has name, description, and inputSchema', () => {
      for (const tool of TOOL_DEFINITIONS) {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
      }
    });

    it('includes all expected tool names', () => {
      const names = TOOL_DEFINITIONS.map((t) => t.name);
      expect(names).toContain('list_projects');
      expect(names).toContain('get_project');
      expect(names).toContain('create_project');
      expect(names).toContain('update_project');
      expect(names).toContain('list_tasks');
      expect(names).toContain('get_task');
      expect(names).toContain('create_task');
      expect(names).toContain('update_task');
      expect(names).toContain('complete_task');
      expect(names).toContain('delete_task');
      expect(names).toContain('list_tags');
      expect(names).toContain('create_tag');
      expect(names).toContain('add_tag_to_task');
    });

    it('tools with required fields have them listed', () => {
      const createTask = TOOL_DEFINITIONS.find((t) => t.name === 'create_task');
      expect(
        (createTask?.inputSchema as Record<string, unknown>).required
      ).toContain('name');

      const getProject = TOOL_DEFINITIONS.find((t) => t.name === 'get_project');
      expect(
        (getProject?.inputSchema as Record<string, unknown>).required
      ).toContain('project_id');
    });
  });

  describe('Constants', () => {
    it('exports correct error codes', () => {
      expect(ERROR_PARSE).toBe(-32700);
      expect(ERROR_INVALID_REQUEST).toBe(-32600);
      expect(ERROR_METHOD_NOT_FOUND).toBe(-32601);
      expect(ERROR_INVALID_PARAMS).toBe(-32602);
      expect(ERROR_INTERNAL).toBe(-32603);
      expect(ERROR_HEADER_MISMATCH).toBe(-32020);
      expect(ERROR_UNSUPPORTED_PROTOCOL_VERSION).toBe(-32022);
    });

    it('exports server info and separates modern discovery from legacy initialization', () => {
      expect(SERVER_INFO.name).toBe('tickist-mcp');
      expect(SERVER_INFO.version).toBeTruthy();
      expect(PROTOCOL_VERSION).toBe('2026-07-28');
      expect(LEGACY_PROTOCOL_VERSION).toBe('2025-06-18');
      expect(SUPPORTED_PROTOCOL_VERSIONS).toEqual([PROTOCOL_VERSION]);
    });
  });

  describe('modern request validation', () => {
    it('recognizes modern metadata and accepts matching transport headers', () => {
      const request = modernRequest();
      const headers = modernHeaders();

      expect(requestEra(request, headers)).toBe('modern');
      expect(validateModernRequest(request, headers)).toBeNull();
    });

    it('keeps initialization-based clients on the legacy era', () => {
      const request = {
        jsonrpc: '2.0' as const,
        id: 1,
        method: 'initialize',
        params: { protocolVersion: LEGACY_PROTOCOL_VERSION },
      };

      expect(requestEra(request, new Headers())).toBe('legacy');
    });

    it.each(['initialize', 'notifications/initialized'])(
      'treats %s with modern metadata and headers as modern',
      (method) => {
        const request = modernRequest({ method });
        const headers = modernHeaders({ 'Mcp-Method': method });

        expect(requestEra(request, headers)).toBe('modern');
      }
    );

    it('does not mistake legacy progress metadata for a modern envelope', () => {
      const request = {
        jsonrpc: '2.0' as const,
        id: 2,
        method: 'tools/list',
        params: { _meta: { progressToken: 'legacy-progress' } },
      };

      expect(
        requestEra(
          request,
          new Headers({
            'MCP-Protocol-Version': LEGACY_PROTOCOL_VERSION,
          })
        )
      ).toBe('legacy');
    });

    it('rejects missing and mismatched standard headers', () => {
      const missing = validateModernRequest(modernRequest(), new Headers());
      expect(missing?.status).toBe(400);
      expect(missing?.response.error?.code).toBe(ERROR_HEADER_MISMATCH);

      const mismatched = validateModernRequest(
        modernRequest(),
        modernHeaders({ 'Mcp-Method': 'tools/call' })
      );
      expect(mismatched?.response.error?.code).toBe(ERROR_HEADER_MISMATCH);
    });

    it.each([
      ['string value', 'client'],
      ['missing version', { name: 'client' }],
      ['missing name', { version: '1.0.0' }],
      [
        'invalid optional title',
        { name: 'client', version: '1.0.0', title: 1 },
      ],
      [
        'invalid icon',
        { name: 'client', version: '1.0.0', icons: [{ src: 1 }] },
      ],
    ])('rejects malformed optional clientInfo: %s', (_label, clientInfo) => {
      const request = modernRequest({
        params: {
          _meta: {
            'io.modelcontextprotocol/protocolVersion': PROTOCOL_VERSION,
            'io.modelcontextprotocol/clientCapabilities': {},
            'io.modelcontextprotocol/clientInfo': clientInfo,
          },
        },
      });
      const validation = validateModernRequest(request, modernHeaders());

      expect(validation?.status).toBe(400);
      expect(validation?.response.error?.code).toBe(ERROR_INVALID_PARAMS);
    });

    it('rejects unsupported protocol versions with the supported list', () => {
      const request = modernRequest({
        params: {
          _meta: {
            'io.modelcontextprotocol/protocolVersion': '2099-01-01',
            'io.modelcontextprotocol/clientCapabilities': {},
          },
        },
      });
      const validation = validateModernRequest(
        request,
        modernHeaders({ 'MCP-Protocol-Version': '2099-01-01' })
      );

      expect(validation?.response.error?.code).toBe(
        ERROR_UNSUPPORTED_PROTOCOL_VERSION
      );
      expect(validation?.response.error?.data).toEqual({
        supported: [PROTOCOL_VERSION],
        requested: '2099-01-01',
      });
    });

    it('validates Mcp-Name for tool calls, including base64 sentinel values', () => {
      const request = modernRequest({
        method: 'tools/call',
        params: {
          name: 'list_tasks',
          arguments: {},
          _meta: {
            'io.modelcontextprotocol/protocolVersion': PROTOCOL_VERSION,
            'io.modelcontextprotocol/clientCapabilities': {},
          },
        },
      });
      const headers = modernHeaders({
        'Mcp-Method': 'tools/call',
        'Mcp-Name': '=?base64?bGlzdF90YXNrcw==?=',
      });

      expect(validateModernRequest(request, headers)).toBeNull();
    });

    it.each([
      ['non-ASCII raw value', 'list_tâsks'],
      ['malformed base64 sentinel', '=?base64?%%%?='],
      ['invalid UTF-8 sentinel', '=?base64?/w==?='],
    ])('rejects an unsafe Mcp-Name: %s', (_label, nameHeader) => {
      const request = modernRequest({
        method: 'tools/call',
        params: {
          name: 'list_tasks',
          arguments: {},
          _meta: {
            'io.modelcontextprotocol/protocolVersion': PROTOCOL_VERSION,
            'io.modelcontextprotocol/clientCapabilities': {},
          },
        },
      });
      const validation = validateModernRequest(
        request,
        modernHeaders({
          'Mcp-Method': 'tools/call',
          'Mcp-Name': nameHeader,
        })
      );

      expect(validation?.status).toBe(400);
      expect(validation?.response.error?.code).toBe(ERROR_HEADER_MISMATCH);
    });
  });

  describe('MCP method handler', () => {
    const toolHandlers: Record<string, ToolHandler> = {
      list_tasks: async () => jsonResult([{ id: 'task-1' }]),
    };

    it('returns modern discovery metadata, capabilities, and cache hints', async () => {
      const result = await handleMcpMethod(
        modernRequest({ method: 'server/discover' }),
        'modern',
        'user-1',
        toolHandlers
      );
      const body = result.response?.result as Record<string, unknown>;

      expect(result.status).toBe(200);
      expect(body.resultType).toBe('complete');
      expect(body.supportedVersions).toEqual([PROTOCOL_VERSION]);
      expect(body.ttlMs).toBe(300_000);
      expect(body.cacheScope).toBe('public');
    });

    it('adds modern resultType while preserving legacy result shapes', async () => {
      const request = modernRequest({
        method: 'tools/call',
        params: { name: 'list_tasks', arguments: {} },
      });
      const modern = await handleMcpMethod(
        request,
        'modern',
        'user-1',
        toolHandlers
      );
      const legacy = await handleMcpMethod(
        request,
        'legacy',
        'user-1',
        toolHandlers
      );

      expect(
        (modern.response?.result as Record<string, unknown>).resultType
      ).toBe('complete');
      expect(
        (legacy.response?.result as Record<string, unknown>).resultType
      ).toBeUndefined();
      expect(
        (legacy.response?.result as Record<string, unknown>).structuredContent
      ).toBeUndefined();
    });

    it('rejects id-less tool calls in both eras before invoking a handler', async () => {
      for (const era of ['modern', 'legacy'] as const) {
        const handler = vi.fn(async () => jsonResult({ updated: true }));
        const result = await handleMcpMethod(
          {
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
              name: 'complete_task',
              arguments: { task_id: TEST_UUID },
            },
          },
          era,
          'user-1',
          { complete_task: handler }
        );

        expect(result.status).toBe(400);
        expect(result.response?.error?.code).toBe(ERROR_INVALID_REQUEST);
        expect(handler).not.toHaveBeenCalled();
      }
    });

    it('rejects removed initialization methods in the modern era', async () => {
      const initialize = await handleMcpMethod(
        modernRequest({ method: 'initialize' }),
        'modern',
        'user-1',
        toolHandlers
      );
      const initializedNotification = await handleMcpMethod(
        {
          jsonrpc: '2.0',
          method: 'notifications/initialized',
          params: modernRequest().params,
        },
        'modern',
        'user-1',
        toolHandlers
      );

      expect(initialize.status).toBe(404);
      expect(initialize.response?.error?.code).toBe(ERROR_METHOD_NOT_FOUND);
      expect(initializedNotification.status).toBe(400);
      expect(initializedNotification.response?.error?.code).toBe(
        ERROR_INVALID_REQUEST
      );
    });

    it('rejects schema-invalid arguments before invoking a handler', async () => {
      const handler = vi.fn(async () => jsonResult({ updated: true }));
      const result = await handleMcpMethod(
        {
          jsonrpc: '2.0',
          id: 3,
          method: 'tools/call',
          params: {
            name: 'complete_task',
            arguments: {
              task_id: TEST_UUID,
              is_done: 'false',
            },
          },
        },
        'modern',
        'user-1',
        { complete_task: handler }
      );

      expect(result.response?.error?.code).toBe(ERROR_INVALID_PARAMS);
      expect(result.response?.error?.message).toContain(
        'is_done must be boolean'
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it('enforces personal API token scopes before invoking a tool', async () => {
      const handler = vi.fn(async () => jsonResult({ created: true }));
      const result = await handleMcpMethod(
        {
          jsonrpc: '2.0',
          id: 31,
          method: 'tools/call',
          params: {
            name: 'create_task',
            arguments: { name: 'Private task' },
          },
        },
        'modern',
        'user-1',
        { create_task: handler },
        ['tasks:read']
      );

      expect(result.response?.result).toMatchObject({
        isError: true,
        resultType: 'complete',
      });
      expect(
        (result.response?.result as Record<string, unknown>).content
      ).toEqual([
        {
          type: 'text',
          text: 'Insufficient API token scope. Required: tasks:write',
        },
      ]);
      expect(handler).not.toHaveBeenCalled();
    });

    it('requires both task and tag write scopes for linking a tag', async () => {
      const handler = vi.fn(async () => jsonResult({ added: true }));
      const result = await handleMcpMethod(
        {
          jsonrpc: '2.0',
          id: 32,
          method: 'tools/call',
          params: {
            name: 'add_tag_to_task',
            arguments: { task_id: TEST_UUID, tag_id: TEST_UUID },
          },
        },
        'legacy',
        'user-1',
        { add_tag_to_task: handler },
        ['tasks:write']
      );

      expect(result.response?.result).toMatchObject({ isError: true });
      expect(handler).not.toHaveBeenCalled();
    });

    it('keeps Supabase user sessions unrestricted by token scopes', async () => {
      const handler = vi.fn(async () => jsonResult({ created: true }));
      await handleMcpMethod(
        {
          jsonrpc: '2.0',
          id: 33,
          method: 'tools/call',
          params: { name: 'create_task', arguments: { name: 'Task' } },
        },
        'legacy',
        'user-1',
        { create_task: handler },
        null
      );

      expect(handler).toHaveBeenCalledOnce();
    });

    it.each(['constructor', 'toString', '__proto__'])(
      'rejects inherited object member as unknown tool: %s',
      async (toolName) => {
        const result = await handleMcpMethod(
          {
            jsonrpc: '2.0',
            id: 4,
            method: 'tools/call',
            params: { name: toolName, arguments: {} },
          },
          'modern',
          'user-1',
          toolHandlers
        );

        expect(result.status).toBe(200);
        expect(result.response?.error?.code).toBe(ERROR_INVALID_PARAMS);
        expect(result.response?.error?.message).toContain(
          `Unknown tool: ${toolName}`
        );
      }
    );

    it('returns 404 for unknown modern methods and 202 for legacy notifications', async () => {
      const unknown = await handleMcpMethod(
        modernRequest({ method: 'unknown/method' }),
        'modern',
        'user-1',
        toolHandlers
      );
      const notification = await handleMcpMethod(
        {
          jsonrpc: '2.0',
          method: 'notifications/initialized',
        },
        'legacy',
        'user-1',
        toolHandlers
      );

      expect(unknown.status).toBe(404);
      expect(unknown.response?.error?.code).toBe(ERROR_METHOD_NOT_FOUND);
      expect(notification).toEqual({ status: 202 });
    });
  });

  describe('tool argument schema validation', () => {
    it('validates required fields, primitive types, enums, formats, and bounds', () => {
      expect(validateToolArguments('get_task', {})).toBe('task_id is required');
      expect(
        validateToolArguments('list_projects', { is_active: 'false' })
      ).toBe('is_active must be boolean');
      expect(
        validateToolArguments('list_tasks', { priority: 'critical' })
      ).toBe('priority must be one of: A, B, C, normal');
      expect(validateToolArguments('get_task', { task_id: 'not-a-uuid' })).toBe(
        'task_id must be a UUID'
      );
      expect(
        validateToolArguments('create_task', {
          name: 'Task',
          finish_date: '2026-02-30',
        })
      ).toBe('finish_date must be a valid YYYY-MM-DD date');
      expect(validateToolArguments('list_tasks', { limit: 501 })).toBe(
        'limit must be at most 500'
      );
    });

    it('accepts valid current tool arguments', () => {
      expect(
        validateToolArguments('complete_task', {
          task_id: TEST_UUID,
          is_done: false,
        })
      ).toBeNull();

      for (const priority of ['A', 'B', 'C', 'normal']) {
        expect(validateToolArguments('list_tasks', { priority })).toBeNull();
        expect(
          validateToolArguments('create_task', { name: 'Task', priority })
        ).toBeNull();
        expect(
          validateToolArguments('update_task', {
            task_id: TEST_UUID,
            priority,
          })
        ).toBeNull();
      }
    });
  });
});
