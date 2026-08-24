import { callTool, TOOLS } from './tools';

/**
 * The protocol, as a pure function: one request object in, one response object or nothing out.
 *
 * Nothing here knows about a process, a stream or a socket. `apps/mcp` is the pump that reads lines
 * and writes them, which means every method, every tool and every malformed request is tested in
 * Node without spawning anything.
 */

export interface Request {
  jsonrpc?: unknown;
  id?: unknown;
  method?: unknown;
  params?: unknown;
}

export interface Response {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string };
}

/** The versions of the protocol this server knows how to speak. Newest first. */
export const PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'] as const;

export const SERVER_INFO = { name: 'forge', version: '1.0.0' } as const;

const PARSE_ERROR = -32700;
const INVALID_REQUEST = -32600;
const METHOD_NOT_FOUND = -32601;
const INVALID_PARAMS = -32602;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function idOf(request: Request): string | number | null {
  const { id } = request;
  return typeof id === 'string' || typeof id === 'number' ? id : null;
}

const reply = (id: string | number | null, result: unknown): Response => ({
  jsonrpc: '2.0',
  id,
  result,
});

const refuse = (id: string | number | null, code: number, message: string): Response => ({
  jsonrpc: '2.0',
  id,
  error: { code, message },
});

/**
 * A request with no id is a notification, and the specification says a notification gets no
 * response at all. Returning one anyway is the most common way to confuse a client.
 */
export function handle(request: unknown): Response | null {
  if (!isRecord(request)) {
    return refuse(null, INVALID_REQUEST, 'A request must be a JSON object.');
  }
  const message = request as Request;
  const id = idOf(message);
  const notification = message.id === undefined || message.id === null;

  if (typeof message.method !== 'string') {
    return notification ? null : refuse(id, INVALID_REQUEST, 'A request must name a method.');
  }
  const params = isRecord(message.params) ? message.params : {};

  switch (message.method) {
    case 'initialize': {
      /*
       * Speak the client's version when it is one we know, and our newest when it is not. Refusing
       * an unknown version outright would break against a client newer than this file.
       */
      const asked = params.protocolVersion;
      const known = PROTOCOL_VERSIONS.find((v) => v === asked);
      return reply(id, {
        protocolVersion: known ?? PROTOCOL_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions:
          "Forge writes prompts for a catalogue of 57 AI models, each in that model's own grammar, with the settings to match. Everything is local data: no tool here reads a file, writes one, or reaches the network. Call list_models before forge_prompt if you do not already know a model id and the fields it reads.",
      });
    }

    case 'notifications/initialized':
    case 'notifications/cancelled':
      return null;

    case 'ping':
      return reply(id, {});

    case 'tools/list':
      return reply(id, { tools: TOOLS });

    case 'tools/call': {
      const name = params.name;
      if (typeof name !== 'string') {
        return refuse(id, INVALID_PARAMS, 'tools/call needs the name of a tool.');
      }
      /*
       * A tool that refuses is a result with isError, not a JSON-RPC error. That distinction
       * matters: a protocol error is the client's fault and stops the conversation, while a tool
       * saying "there is no model called that" is an answer the agent can act on.
       */
      return reply(id, callTool(name, params.arguments));
    }

    // Declared unsupported rather than left to time out, which is what an empty capability means.
    case 'resources/list':
      return reply(id, { resources: [] });
    case 'prompts/list':
      return reply(id, { prompts: [] });

    default:
      return notification
        ? null
        : refuse(id, METHOD_NOT_FOUND, `Forge does not implement ${message.method}.`);
  }
}

/** One line of stdio in, at most one line out. The only place a parse failure is a protocol error. */
export function handleLine(line: string): string | null {
  const trimmed = line.trim();
  if (trimmed.length === 0) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return JSON.stringify(refuse(null, PARSE_ERROR, 'That was not JSON.'));
  }
  // A batch is a JSON-RPC feature the specification removed for MCP, so it is refused by name.
  if (Array.isArray(parsed)) {
    return JSON.stringify(refuse(null, INVALID_REQUEST, 'Forge does not take batched requests.'));
  }
  const response = handle(parsed);
  return response === null ? null : JSON.stringify(response);
}
