import type { CallToolResult } from '@modelcontextprotocol/server';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function toolResult(result: unknown): CallToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    ...(isRecord(result) ? { structuredContent: result } : {}),
  };
}

export function toolError(error: unknown): CallToolResult {
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text:
          error instanceof Error
            ? error.message
            : 'Unexpected Tickist MCP error.',
      },
    ],
  };
}
