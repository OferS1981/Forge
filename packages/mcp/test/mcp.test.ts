import { describe, expect, it } from 'vitest';
import { MODELS } from '@forge/catalog';
import { callTool, TOOLS } from '../src/tools';
import { handle, handleLine, PROTOCOL_VERSIONS, SERVER_INFO } from '../src/server';

/**
 * Forge as something another agent calls. The protocol is a pure function, so every method, every
 * tool and every malformed request is exercised here without a process, a stream or a socket.
 */

const call = (method: string, params?: unknown, id: string | number = 1): unknown =>
  handle({ jsonrpc: '2.0', id, method, params });

function body(name: string, args: unknown): unknown {
  const result = callTool(name, args);
  const first = result.content[0];
  if (first === undefined) throw new Error('the tool returned nothing');
  return result.isError === true ? first.text : JSON.parse(first.text);
}

describe('the handshake', () => {
  it('answers initialize with a version, a capability and a name', () => {
    const result = call('initialize', { protocolVersion: '2025-06-18' }) as {
      result: { protocolVersion: string; serverInfo: unknown; capabilities: unknown };
    };
    expect(result.result.protocolVersion).toBe('2025-06-18');
    expect(result.result.serverInfo).toEqual(SERVER_INFO);
    expect(result.result.capabilities).toEqual({ tools: { listChanged: false } });
  });

  it('speaks an older version when the client asks for one it knows', () => {
    const asked = PROTOCOL_VERSIONS[PROTOCOL_VERSIONS.length - 1];
    const result = call('initialize', { protocolVersion: asked }) as {
      result: { protocolVersion: string };
    };
    expect(result.result.protocolVersion).toBe(asked);
  });

  it('falls back to its newest rather than refusing a client newer than itself', () => {
    const result = call('initialize', { protocolVersion: '2099-01-01' }) as {
      result: { protocolVersion: string };
    };
    expect(result.result.protocolVersion).toBe(PROTOCOL_VERSIONS[0]);
  });

  it('says up front that nothing it offers touches a file or the network', () => {
    const result = call('initialize', {}) as { result: { instructions: string } };
    expect(result.result.instructions).toContain('no tool here reads a file');
  });

  it('says nothing at all to a notification, which is what the specification asks for', () => {
    expect(handle({ jsonrpc: '2.0', method: 'notifications/initialized' })).toBeNull();
    expect(handle({ jsonrpc: '2.0', method: 'notifications/cancelled', params: {} })).toBeNull();
    expect(handle({ jsonrpc: '2.0', method: 'something/unheard-of' })).toBeNull();
  });

  it('answers a ping, so a client can tell it is alive', () => {
    expect(call('ping')).toEqual({ jsonrpc: '2.0', id: 1, result: {} });
  });
});

describe('bad requests', () => {
  it('refuses something that is not an object', () => {
    const result = handle('hello') as { error: { code: number } };
    expect(result.error.code).toBe(-32600);
  });

  it('refuses a request with no method, when it is not a notification', () => {
    const result = handle({ jsonrpc: '2.0', id: 7 }) as { error: { code: number } };
    expect(result.error.code).toBe(-32600);
  });

  it('says method not found, with the name, for a method it does not have', () => {
    const result = call('sampling/createMessage') as { error: { code: number; message: string } };
    expect(result.error.code).toBe(-32601);
    expect(result.error.message).toContain('sampling/createMessage');
  });

  it('declares the lists it has none of, rather than leaving a client to time out', () => {
    expect(call('resources/list')).toMatchObject({ result: { resources: [] } });
    expect(call('prompts/list')).toMatchObject({ result: { prompts: [] } });
  });

  it('turns a line that is not JSON into a parse error rather than throwing', () => {
    const line = handleLine('{ not json');
    expect(JSON.parse(line ?? '{}')).toMatchObject({ error: { code: -32700 } });
  });

  it('ignores a blank line', () => {
    expect(handleLine('')).toBeNull();
    expect(handleLine('   \n')).toBeNull();
  });

  it('refuses a batch by name, because MCP removed them', () => {
    const line = handleLine('[{"jsonrpc":"2.0","id":1,"method":"ping"}]');
    expect(JSON.parse(line ?? '{}')).toMatchObject({ error: { code: -32600 } });
  });

  it('writes nothing back for a notification, down at the line level too', () => {
    expect(handleLine('{"jsonrpc":"2.0","method":"notifications/initialized"}')).toBeNull();
  });
});

describe('the tools it offers', () => {
  const listed = (call('tools/list') as { result: { tools: typeof TOOLS } }).result.tools;

  it('offers the five section 11 names, each with a schema', () => {
    expect(listed.map((t) => t.name)).toEqual([
      'forge_prompt',
      'diagnose_prompt',
      'match_models',
      'list_models',
      'explain_term',
    ]);
    for (const tool of listed) {
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.description.length).toBeGreaterThan(40);
    }
  });

  it('lists every model id in the schema, so an agent cannot guess one wrong', () => {
    const schema = listed[0]?.inputSchema as {
      properties: { model: { enum: string[] } };
    };
    expect(schema.properties.model.enum).toEqual(MODELS.map((m) => m.id));
  });

  it('says in the description that nothing is written and nothing is fetched', () => {
    const forgePrompt = listed.find((t) => t.name === 'forge_prompt');
    expect(forgePrompt?.description).toContain('Reads nothing and writes nothing');
  });
});

describe('calling a tool', () => {
  it('forges a prompt in the grammar of the model it was given', () => {
    const result = body('forge_prompt', {
      model: 'midjourney',
      brief: { subject: 'a dragon breathing fire' },
    }) as { prompt: string; settings: unknown[]; score: number };
    expect(result.prompt).toContain('dragon');
    expect(result.prompt).toContain('--ar');
    expect(result.settings.length).toBeGreaterThan(0);
    expect(result.score).toBeGreaterThan(0);
  });

  it('takes a list for a field that takes a list', () => {
    const result = body('forge_prompt', {
      model: 'midjourney',
      mode: 'advanced',
      brief: { subject: 'a dragon', light: ['softbox key camera-left'] },
    }) as { prompt: string };
    expect(result.prompt).toContain('Softbox key camera-left');
  });

  it('refuses a field the model does not read, and says where to look', () => {
    const said = body('forge_prompt', {
      model: 'midjourney',
      brief: { subject: 'a dragon', mGenre: 'shoegaze' },
    });
    expect(said).toContain('does not read a field called mGenre');
    expect(said).toContain('list_models');
  });

  it('refuses a model that does not exist, and says how to find one', () => {
    const said = body('forge_prompt', { model: 'dall-e-2', brief: { subject: 'x' } });
    expect(said).toContain('There is no model called dall-e-2');
    expect(said).toContain('list_models');
  });

  it('marks a refusal as a tool error, not a protocol error', () => {
    const result = callTool('forge_prompt', { model: 'nope', brief: {} });
    expect(result.isError).toBe(true);
    // The conversation continues: this came back as a normal JSON-RPC result.
    const wrapped = call('tools/call', { name: 'forge_prompt', arguments: { model: 'nope' } }) as {
      result: { isError: boolean };
      error?: unknown;
    };
    expect(wrapped.error).toBeUndefined();
    expect(wrapped.result.isError).toBe(true);
  });

  it('diagnoses a prompt without a model call of its own', () => {
    const result = body('diagnose_prompt', {
      prompt: 'a cool picture of a robot, 8k, masterpiece',
    }) as { score: number; notDoingAnyWork: string[]; stripped: string[] };
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.notDoingAnyWork.length).toBeGreaterThan(0);
    expect(result.stripped.join(' ')).toContain('8k');
  });

  it('matches a job to groups of models', () => {
    const result = body('match_models', {
      job: 'a 30 second advert with a voiceover and a music bed',
    }) as { needsSeveralModels: boolean; groups: { models: unknown[] }[] };
    expect(result.needsSeveralModels).toBe(true);
    expect(result.groups.length).toBeGreaterThan(1);
  });

  it('lists the catalogue, and one model in full', () => {
    const all = body('list_models', {}) as unknown[];
    expect(all.length).toBe(MODELS.length);

    const one = body('list_models', { model: 'suno' }) as {
      fields: { core: { id: string }[] };
      sources: unknown[];
    };
    expect(one.fields.core.length).toBeGreaterThan(0);
    expect(one.sources.length).toBeGreaterThan(0);
  });

  it('narrows to a category, and refuses one that does not exist', () => {
    const image = body('list_models', { category: 'image' }) as { id: string }[];
    expect(image.every((m) => typeof m.id === 'string')).toBe(true);
    expect(body('list_models', { category: 'sculpture' })).toContain(
      'no category called sculpture',
    );
  });

  it('explains a term by name and by id, and says when it has none', () => {
    const explained = body('explain_term', { term: 'aperture' }) as { label: string };
    expect(explained.label.length).toBeGreaterThan(0);
    expect(body('explain_term', { term: 'nonsense-term' })).toContain(
      'nothing called nonsense-term',
    );
  });

  it('names its own tools when asked for one it does not have', () => {
    const said = callTool('delete_everything', {});
    expect(said.isError).toBe(true);
    expect(said.content[0]?.text).toContain('forge_prompt');
  });

  it('survives arguments that are not an object at all', () => {
    for (const args of [null, 'a string', 42, []]) {
      expect(() => callTool('forge_prompt', args)).not.toThrow();
    }
  });
});

describe('the wording an agent reads', () => {
  it('never apologises and never uses an em dash', () => {
    const said = [
      ...TOOLS.map((t) => t.description),
      callTool('forge_prompt', { model: 'nope' }).content[0]?.text ?? '',
      callTool('explain_term', {}).content[0]?.text ?? '',
    ];
    for (const text of said) {
      expect(text).not.toMatch(/sorry|apolog/i);
      expect(text).not.toContain('—');
    }
  });
});
