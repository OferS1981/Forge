import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

/**
 * One command from a fresh clone to a working Forge MCP server:
 *
 *   pnpm mcp
 *
 * Builds the self-contained server (one file, no runtime dependencies, the whole catalogue
 * inside) and prints the exact registration commands for Claude Code, Claude Desktop and Cursor,
 * with the absolute path already filled in.
 */
const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const bin = here('../apps/mcp/dist/main.js');
console.log('Building the Forge MCP server (one self-contained file)...');
execFileSync('pnpm', ['--filter', '@forge/mcp-app', 'run', 'build'], {
  stdio: 'inherit',
  cwd: here('..'),
});
if (!existsSync(bin)) {
  console.error('Build produced no file at ' + bin);
  process.exit(1);
}
console.log(`
Built: ${bin}

Claude Code — run this in any terminal:

  claude mcp add forge -- node "${bin}"

Claude Desktop — add to claude_desktop_config.json under "mcpServers":

  "forge": { "command": "node", "args": ["${bin}"] }

Cursor — add to .cursor/mcp.json the same way.

Five tools land in your AI: forge_prompt, diagnose_prompt, match_models, list_models,
explain_term. Everything runs locally; nothing is sent anywhere.
`);
