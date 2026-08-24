import { execFileSync, spawn } from 'node:child_process';
import { expect, test } from '@playwright/test';

/**
 * The two binaries, run as binaries.
 *
 * Everything they decide is a pure function tested in `packages/cli` and `packages/mcp`. What is
 * left, and what these prove, is that the thing built from that source actually runs: the right
 * exit codes, the right streams, and an MCP conversation that a real client would recognise.
 */

const CLI = 'apps/cli/dist/main.js';
const MCP = 'apps/mcp/dist/main.js';

test.beforeAll(() => {
  // The test builds what it tests. A stale binary passing is the one failure this exists to stop.
  execFileSync('pnpm', ['--filter', '@forge/cli-app', 'run', 'build'], { stdio: 'pipe' });
  execFileSync('pnpm', ['--filter', '@forge/mcp-app', 'run', 'build'], { stdio: 'pipe' });
});

function forge(args: string[]): { code: number; out: string; err: string } {
  try {
    const out = execFileSync('node', [CLI, ...args], { encoding: 'utf8', stdio: 'pipe' });
    return { code: 0, out, err: '' };
  } catch (error) {
    const failure = error as { status?: number; stdout?: string; stderr?: string };
    return { code: failure.status ?? 1, out: failure.stdout ?? '', err: failure.stderr ?? '' };
  }
}

/** One MCP conversation: write every line, read every answer, then let it close. */
async function converse(lines: string[]): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [MCP], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    child.stdout.on('data', (chunk: Buffer) => (out += chunk.toString()));
    child.stderr.on('data', (chunk: Buffer) => (err += chunk.toString()));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`forge-mcp exited ${String(code)}: ${err}`));
        return;
      }
      resolve(
        out
          .split('\n')
          .filter((line) => line.trim().length > 0)
          .map((line) => JSON.parse(line) as unknown),
      );
    });
    for (const line of lines) child.stdin.write(`${line}\n`);
    child.stdin.end();
  });
}

test('forge writes a prompt to stdout and exits 0', () => {
  const result = forge(['build', 'midjourney', '--subject', 'a retired boxer taping his hands']);
  expect(result.code).toBe(0);
  expect(result.err).toBe('');
  expect(result.out).toContain('boxer');
  expect(result.out).toContain('--ar');
  expect(result.out).toMatch(/Score \d+/);
});

test('forge puts an error on stderr and exits 1, so a script can tell', () => {
  const result = forge(['build', 'midjurney', '--subject', 'x']);
  expect(result.code).toBe(1);
  expect(result.out).toBe('');
  expect(result.err).toContain('Did you mean midjourney');
});

test('forge --json is parseable, which is the point of it', () => {
  const result = forge(['build', 'veo', '--subject', 'a dragon', '--json']);
  expect(result.code).toBe(0);
  const parsed = JSON.parse(result.out) as { model: string; prompt: string };
  expect(parsed.model).toBe('veo');
  expect(parsed.prompt.length).toBeGreaterThan(0);
});

test('forge --help exits 0, because asking for help is not an error', () => {
  const result = forge(['--help']);
  expect(result.code).toBe(0);
  expect(result.out).toContain('forge build <model>');
});

test('the MCP server completes a handshake a real client would recognise', async () => {
  const answers = await converse([
    '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"1"}}}',
    '{"jsonrpc":"2.0","method":"notifications/initialized"}',
    '{"jsonrpc":"2.0","id":2,"method":"tools/list"}',
  ]);

  // Two answers, not three: a notification gets no reply, which is what the specification says.
  expect(answers).toHaveLength(2);
  const [initialize, tools] = answers as [
    { id: number; result: { protocolVersion: string; serverInfo: { name: string } } },
    { id: number; result: { tools: { name: string }[] } },
  ];
  expect(initialize.id).toBe(1);
  expect(initialize.result.protocolVersion).toBe('2025-06-18');
  expect(initialize.result.serverInfo.name).toBe('forge');
  expect(tools.result.tools.map((t) => t.name)).toContain('forge_prompt');
});

test('the MCP server forges a prompt for another agent', async () => {
  const answers = await converse([
    '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18"}}',
    '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"forge_prompt","arguments":{"model":"midjourney","brief":{"subject":"a dragon breathing fire"}}}}',
  ]);
  const call = answers[1] as { result: { content: { text: string }[] } };
  const body = JSON.parse(call.result.content[0]?.text ?? '{}') as { prompt: string };
  expect(body.prompt).toContain('dragon');
  expect(body.prompt).toContain('--ar');
});

test('the MCP server keeps talking after a bad line, rather than dying', async () => {
  const answers = await converse([
    '{ this is not json',
    '{"jsonrpc":"2.0","id":1,"method":"ping"}',
    '',
    '{"jsonrpc":"2.0","id":2,"method":"tools/list"}',
  ]);
  expect(answers).toHaveLength(3);
  expect(answers[0]).toMatchObject({ error: { code: -32700 } });
  expect(answers[1]).toMatchObject({ id: 1, result: {} });
  expect(answers[2]).toMatchObject({ id: 2 });
});

test('the MCP server writes nothing to stdout but responses', async () => {
  // Anything else on stdout is read by a client as a malformed message. This is the classic break.
  const answers = await converse([
    '{"jsonrpc":"2.0","method":"notifications/initialized"}',
    '{"jsonrpc":"2.0","method":"notifications/cancelled","params":{"requestId":1}}',
  ]);
  expect(answers).toEqual([]);
});
