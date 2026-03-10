import { describe, expect, it } from 'vitest';
import {
    jsonRpcError,
    jsonRpcResult,
    textResult,
    errorResult,
    jsonResult,
    TOOL_DEFINITIONS,
    SERVER_INFO,
    PROTOCOL_VERSION,
    ERROR_PARSE,
    ERROR_INVALID_REQUEST,
    ERROR_METHOD_NOT_FOUND,
    ERROR_INVALID_PARAMS,
    ERROR_INTERNAL,
} from './mcp-protocol';

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
        });

        it('exports server info and protocol version', () => {
            expect(SERVER_INFO.name).toBe('tickist-mcp');
            expect(SERVER_INFO.version).toBeTruthy();
            expect(PROTOCOL_VERSION).toBe('2025-06-18');
        });
    });
});
