import { serveStdio } from '@modelcontextprotocol/server/stdio';
import type { TickistConnection } from '@tickist/data-access-tickist';
import { pathToFileURL } from 'node:url';
import { createTickistMcpServer } from './server';

export function readStdioConnection(
  environment: NodeJS.ProcessEnv
): TickistConnection {
  const supabaseUrl = environment['SUPABASE_URL'];
  const publishableKey = environment['SUPABASE_PUBLISHABLE_KEY'];
  const accessToken = environment['TICKIST_ACCESS_TOKEN'];
  const userId = environment['TICKIST_USER_ID'];
  const scopes = environment['TICKIST_SCOPES']?.split(/\s+/u).filter(Boolean);
  if (
    !supabaseUrl ||
    !publishableKey ||
    !accessToken ||
    !userId ||
    !scopes?.length
  ) {
    throw new Error(
      'SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, TICKIST_ACCESS_TOKEN, TICKIST_USER_ID, and TICKIST_SCOPES are required.'
    );
  }
  return {
    supabaseUrl,
    publishableKey,
    accessToken,
    userId,
    clientId: environment['MCP_CLIENT_ID'] ?? 'stdio',
    scopes,
  };
}

export function startStdio(environment: NodeJS.ProcessEnv): void {
  const connection = readStdioConnection(environment);
  serveStdio(() => createTickistMcpServer(connection), {
    onerror: (error) => process.stderr.write(`${error.message}\n`),
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    startStdio(process.env);
  } catch (error) {
    process.stderr.write(
      `${
        error instanceof Error ? error.message : 'Invalid STDIO configuration.'
      }\n`
    );
    process.exitCode = 1;
  }
}
