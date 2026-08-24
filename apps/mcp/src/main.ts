import { createInterface } from 'node:readline';
import { handleLine } from '@forge/mcp';

/**
 * The pump. MCP over stdio is newline-delimited JSON, one request a line, so this reads lines and
 * writes lines. Everything that decides anything is in `@forge/mcp`, which is a pure function.
 *
 * Nothing is written to stdout except a response: a stray log line here would be read by the client
 * as a malformed message, which is the classic way to break an MCP server. Anything worth saying
 * goes to stderr, where a client shows it as a log.
 */
const lines = createInterface({ input: process.stdin });

lines.on('line', (line) => {
  let response: string | null = null;
  try {
    response = handleLine(line);
  } catch (error) {
    // A thrown error must not take the server down mid-conversation.
    process.stderr.write(
      `forge-mcp: ${error instanceof Error ? error.message : 'something went wrong'}\n`,
    );
    return;
  }
  if (response !== null) process.stdout.write(`${response}\n`);
});

lines.on('close', () => {
  process.exitCode = 0;
});
