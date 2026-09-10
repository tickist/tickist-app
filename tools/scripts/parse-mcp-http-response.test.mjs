import assert from 'node:assert/strict';
import test from 'node:test';
import { parseMcpHttpResponse } from './parse-mcp-http-response.mjs';

test('parses a JSON MCP response', () => {
  assert.deepEqual(
    parseMcpHttpResponse('{"jsonrpc":"2.0","id":1,"result":{"tools":[]}}'),
    { jsonrpc: '2.0', id: 1, result: { tools: [] } }
  );
});

test('parses an SSE MCP response', () => {
  assert.deepEqual(
    parseMcpHttpResponse(
      'event: message\ndata: {"jsonrpc":"2.0","id":2,"result":{"protocolVersion":"2025-06-18","name":"Zażółć"}}\n\n'
    ),
    {
      jsonrpc: '2.0',
      id: 2,
      result: { protocolVersion: '2025-06-18', name: 'Zażółć' },
    }
  );
});

test('returns the final JSON message from an SSE response', () => {
  assert.deepEqual(
    parseMcpHttpResponse(
      ': keepalive\n\nevent: message\ndata: {"jsonrpc":"2.0","method":"notifications/progress"}\n\nevent: message\ndata: {"jsonrpc":"2.0","id":3,"result":{"isError":false}}\n\n'
    ),
    { jsonrpc: '2.0', id: 3, result: { isError: false } }
  );
});

test('rejects a response without JSON or SSE data', () => {
  assert.throws(
    () => parseMcpHttpResponse('event: message\ndata: not-json\n\n'),
    /invalid JSON data/u
  );
});
