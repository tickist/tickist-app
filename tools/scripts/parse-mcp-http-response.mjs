import { pathToFileURL } from 'node:url';

export function parseMcpHttpResponse(rawResponse) {
  const response = rawResponse.trim();
  if (!response) {
    throw new Error('MCP response is empty.');
  }

  try {
    return JSON.parse(response);
  } catch {
    const messages = response
      .split(/\r?\n\r?\n/u)
      .map((event) =>
        event
          .split(/\r?\n/u)
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.replace(/^data: ?/u, ''))
          .join('\n')
      )
      .filter(Boolean)
      .map((data) => {
        try {
          return JSON.parse(data);
        } catch {
          throw new Error('MCP SSE response contains invalid JSON data.');
        }
      });

    if (!messages.length) {
      throw new Error('MCP response is neither JSON nor SSE JSON data.');
    }

    return messages.at(-1);
  }
}

async function main() {
  const chunks = [];
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  process.stdout.write(JSON.stringify(parseMcpHttpResponse(chunks.join(''))));
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await main();
}
