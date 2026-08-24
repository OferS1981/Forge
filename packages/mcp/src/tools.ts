import {
  CATEGORIES,
  FIELDS,
  MODELS,
  diagnose,
  explain,
  findModel,
  forge,
  match,
  modelLabel,
  TERM_LIST,
  type Brief,
  type FieldId,
} from '@forge/catalog';

/**
 * What Forge offers another agent.
 *
 * Five tools, each one an engine function that already exists and is already tested. None of them
 * writes anything, opens anything or reaches the network, which is worth saying in the descriptions
 * themselves: an agent deciding whether it may call something reads those, and so does the person
 * approving it.
 */

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ToolResult {
  content: { type: 'text'; text: string }[];
  isError?: true;
}

const text = (body: string): ToolResult => ({ content: [{ type: 'text', text: body }] });
const problem = (body: string): ToolResult => ({
  content: [{ type: 'text', text: body }],
  isError: true,
});

const MODEL_IDS = MODELS.map((m) => m.id);
const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

export const TOOLS: ToolDefinition[] = [
  {
    name: 'forge_prompt',
    description:
      "Write a production-grade prompt for one AI model, in that model's own grammar, with the settings to match. Reads nothing and writes nothing: the whole catalogue is local data and there is no network call. Give it a brief as field values; run list_models first if you do not know which fields a model reads.",
    inputSchema: {
      type: 'object',
      properties: {
        model: { type: 'string', enum: MODEL_IDS, description: 'Which model to write for.' },
        brief: {
          type: 'object',
          description:
            'Field values, keyed by field id. A field the model does not read is refused rather than ignored.',
          additionalProperties: { type: ['string', 'array'] },
        },
        mode: {
          type: 'string',
          enum: ['simple', 'advanced'],
          description:
            'simple lets Forge choose the craft layer and say what it chose. advanced fills in nothing you did not ask for. Defaults to simple.',
        },
      },
      required: ['model', 'brief'],
      additionalProperties: false,
    },
  },
  {
    name: 'diagnose_prompt',
    description:
      'Score a prompt out of 100 on eight axes and name what in it is doing no work. Uses a lexicon, not a model call, so it is deterministic and costs nothing.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'The prompt to look at.' },
        model: { type: 'string', enum: MODEL_IDS, description: 'The model it was written for.' },
      },
      required: ['prompt'],
      additionalProperties: false,
    },
  },
  {
    name: 'match_models',
    description:
      'Describe a job and get the models that are good at it, grouped by what each group is for. A job needing a video, a voice and a music bed comes back as three groups.',
    inputSchema: {
      type: 'object',
      properties: {
        job: { type: 'string', description: 'What is being made, in a sentence.' },
      },
      required: ['job'],
      additionalProperties: false,
    },
  },
  {
    name: 'list_models',
    description:
      'The catalogue: every model, its version, its grammar, and the fields it reads. Call this before forge_prompt when you do not already know a model id or its fields.',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: CATEGORY_IDS, description: 'Narrow to one category.' },
        model: {
          type: 'string',
          enum: MODEL_IDS,
          description: 'One model, in full, including every field it reads and their options.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'explain_term',
    description:
      'What a term of the craft means: what it is, what it changes, and when to use it. Covers every field, option and setting in the catalogue.',
    inputSchema: {
      type: 'object',
      properties: { term: { type: 'string', description: 'The term, by name or by id.' } },
      required: ['term'],
      additionalProperties: false,
    },
  },
];

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const str = (args: Record<string, unknown>, name: string): string | undefined => {
  const found = args[name];
  return typeof found === 'string' ? found : undefined;
};

function unknownModel(id: string): ToolResult {
  return problem(
    `There is no model called ${id}. Call list_models for the catalogue. The ids are ${MODEL_IDS.slice(0, 6).join(', ')} and ${String(MODEL_IDS.length - 6)} more.`,
  );
}

function briefFrom(modelId: string, raw: unknown): Brief | string {
  const model = findModel(modelId);
  if (model === undefined) return `There is no model called ${modelId}.`;
  if (!isRecord(raw)) return 'brief must be an object of field values.';
  const allowed = new Set<string>([...model.core, ...model.craft, ...model.tech]);
  let brief: Brief = {};
  for (const [id, value] of Object.entries(raw)) {
    if (!allowed.has(id)) {
      return `${modelLabel(model)} does not read a field called ${id}. Call list_models with model set to ${model.id} for the ones it does.`;
    }
    const field = FIELDS[id as FieldId];
    if (field.type === 'chips') {
      const list = Array.isArray(value) ? value : [value];
      if (!list.every((v): v is string => typeof v === 'string')) {
        return `${id} takes a list of strings.`;
      }
      brief = { ...brief, [id]: list };
    } else {
      if (typeof value !== 'string') return `${id} takes a string.`;
      brief = { ...brief, [id]: value };
    }
  }
  return brief;
}

export function callTool(name: string, args: unknown): ToolResult {
  const input = isRecord(args) ? args : {};

  switch (name) {
    case 'forge_prompt': {
      const id = str(input, 'model');
      if (id === undefined) return problem('forge_prompt needs a model.');
      const model = findModel(id);
      if (model === undefined) return unknownModel(id);

      const brief = briefFrom(id, input.brief);
      if (typeof brief === 'string') return problem(brief);

      const mode = str(input, 'mode') ?? 'simple';
      if (mode !== 'simple' && mode !== 'advanced') {
        return problem('mode is simple or advanced.');
      }

      const result = forge(brief, model, mode);
      return text(
        JSON.stringify(
          {
            model: model.id,
            modelName: modelLabel(model),
            prompt: result.flat,
            negative: result.negative,
            settings: result.settings.map((r) => ({ name: r.name, value: r.value, why: r.why })),
            score: result.score,
            chosenForYou: result.autoFilled,
            notes: result.notes,
            warnings: result.warnings,
          },
          null,
          2,
        ),
      );
    }

    case 'diagnose_prompt': {
      const prompt = str(input, 'prompt');
      if (prompt === undefined || prompt.trim().length === 0) {
        return problem('diagnose_prompt needs a prompt.');
      }
      const id = str(input, 'model') ?? 'midjourney';
      const model = findModel(id);
      if (model === undefined) return unknownModel(id);
      const diagnosis = diagnose(prompt, model);
      return text(
        JSON.stringify(
          {
            model: model.id,
            score: diagnosis.score,
            axes: diagnosis.axes,
            notDoingAnyWork: diagnosis.findings,
            doingWork: diagnosis.working,
            stripped: diagnosis.stripped,
            words: diagnosis.words,
          },
          null,
          2,
        ),
      );
    }

    case 'match_models': {
      const job = str(input, 'job');
      if (job === undefined || job.trim().length === 0) return problem('match_models needs a job.');
      const result = match(job);
      return text(
        JSON.stringify(
          {
            needsSeveralModels: result.multi,
            groups: result.groups.map((group) => ({
              job: group.job,
              category: group.category,
              models: group.models.map((entry) => ({
                id: entry.model.id,
                name: modelLabel(entry.model),
                bestAt: entry.model.best,
                worstAt: entry.model.worst,
              })),
            })),
          },
          null,
          2,
        ),
      );
    }

    case 'list_models': {
      const one = str(input, 'model');
      if (one !== undefined) {
        const model = findModel(one);
        if (model === undefined) return unknownModel(one);
        const describe = (id: FieldId): Record<string, unknown> => {
          const field = FIELDS[id];
          const described: Record<string, unknown> = { id, label: field.label, type: field.type };
          if (field.hint !== undefined) described.hint = field.hint;
          if (field.options !== undefined) {
            described.options = field.options.map((o) => o.value);
          }
          return described;
        };
        return text(
          JSON.stringify(
            {
              id: model.id,
              name: modelLabel(model),
              version: model.version,
              category: model.category,
              grammar: model.grammar,
              bestAt: model.best,
              worstAt: model.worst,
              unverified: model.unverified === true,
              fields: {
                core: model.core.map(describe),
                craft: model.craft.map(describe),
                tech: model.tech.map(describe),
              },
              notes: model.notes,
              warnings: model.warnings,
              sources: model.sources,
            },
            null,
            2,
          ),
        );
      }

      const category = str(input, 'category');
      if (
        category !== undefined &&
        !CATEGORY_IDS.includes(category as (typeof CATEGORY_IDS)[number])
      ) {
        return problem(
          `There is no category called ${category}. One of: ${CATEGORY_IDS.join(', ')}.`,
        );
      }
      const shown = MODELS.filter((m) => category === undefined || m.category === category);
      return text(
        JSON.stringify(
          shown.map((m) => ({
            id: m.id,
            name: modelLabel(m),
            version: m.version,
            category: m.category,
            grammar: m.grammar,
            bestAt: m.best,
          })),
          null,
          2,
        ),
      );
    }

    case 'explain_term': {
      const wanted = str(input, 'term');
      if (wanted === undefined || wanted.trim().length === 0) {
        return problem('explain_term needs a term.');
      }
      const found =
        TERM_LIST.find((t) => t.id === wanted) ??
        TERM_LIST.find((t) => t.label.toLowerCase() === wanted.toLowerCase()) ??
        TERM_LIST.find((t) => t.id.endsWith(`.${wanted}`));
      const full = found === undefined ? undefined : explain(found.id);
      if (full === undefined) {
        return problem(`The glossary has nothing called ${wanted}.`);
      }
      return text(JSON.stringify(full, null, 2));
    }

    default:
      return problem(
        `Forge has no tool called ${name}. It has ${TOOLS.map((t) => t.name).join(', ')}.`,
      );
  }
}
