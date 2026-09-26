import type { CallToolResult } from '@modelcontextprotocol/server';

import { JsonRecordSchema } from '@tickist/data-access-tickist';

export function toolResult<T>(result: T): CallToolResult {
  const response: CallToolResult = {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
  };

  const record = JsonRecordSchema.safeParse(result);

  if (record.success) response.structuredContent = record.data;

  return response;
}

export function toolError(cause: unknown): CallToolResult {
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text:
          cause instanceof Error
            ? cause.message
            : 'Unexpected Tickist MCP error.',
      },
    ],
  };
}
