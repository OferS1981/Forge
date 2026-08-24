import type { Model, ModelSpec } from '../types';
import { COMPLIANCE } from './compliance';
import { midjourney } from './image/midjourney';
import { gptimage } from './image/gptimage';
import { nanobanana } from './image/nanobanana';
import { flux } from './image/flux';
import { sdxl } from './image/sdxl';
import { ideogram } from './image/ideogram';
import { firefly } from './image/firefly';
import { recraft } from './image/recraft';
import { seedream } from './image/seedream';
import { qwenimage } from './image/qwenimage';
import { leonardo } from './image/leonardo';
import { genericImage } from './image/generic-image';
import { veo } from './video/veo';
import { kling } from './video/kling';
import { seedance } from './video/seedance';
import { runway } from './video/runway';
import { hailuo } from './video/hailuo';
import { luma } from './video/luma';
import { ltx } from './video/ltx';
import { higgsfield } from './video/higgsfield';
import { wan } from './video/wan';
import { mjvideo } from './video/mjvideo';
import { genericVideo } from './video/generic-video';
import { elTts } from './voice/el-tts';
import { elVoicedesign } from './voice/el-voicedesign';
import { elDubbing } from './voice/el-dubbing';
import { cartesia } from './voice/cartesia';
import { hume } from './voice/hume';
import { genericVoice } from './voice/generic-voice';
import { elSfx } from './sfx/el-sfx';
import { genericSfx } from './sfx/generic-sfx';
import { elMusic } from './music/el-music';
import { suno } from './music/suno';
import { lyria } from './music/lyria';
import { stableaudio } from './music/stableaudio';
import { genericMusic } from './music/generic-music';
import { claude } from './text/claude';
import { gpt } from './text/gpt';
import { gemini } from './text/gemini';
import { grok } from './text/grok';
import { deepseek } from './text/deepseek';
import { genericText } from './text/generic-text';
import { claudecode } from './code/claudecode';
import { cursor } from './code/cursor';
import { copilot } from './code/copilot';
import { codex } from './code/codex';
import { devin } from './code/devin';
import { genericCode } from './code/generic-code';
import { v0 } from './app/v0';
import { lovable } from './app/lovable';
import { bolt } from './app/bolt';
import { base44 } from './app/base44';
import { genericApp } from './app/generic-app';
import { perplexity } from './research/perplexity';
import { notebooklm } from './research/notebooklm';
import { deepresearch } from './research/deepresearch';
import { genericResearch } from './research/generic-research';

/** Every model spec, in rail order: category by category, wildcard last. */
const SPECS: readonly ModelSpec[] = [
  midjourney,
  gptimage,
  nanobanana,
  flux,
  sdxl,
  ideogram,
  firefly,
  recraft,
  seedream,
  qwenimage,
  leonardo,
  genericImage,
  veo,
  kling,
  seedance,
  runway,
  hailuo,
  luma,
  ltx,
  higgsfield,
  wan,
  mjvideo,
  genericVideo,
  elTts,
  elVoicedesign,
  elDubbing,
  cartesia,
  hume,
  genericVoice,
  elSfx,
  genericSfx,
  elMusic,
  suno,
  lyria,
  stableaudio,
  genericMusic,
  claude,
  gpt,
  gemini,
  grok,
  deepseek,
  genericText,
  claudecode,
  cursor,
  copilot,
  codex,
  devin,
  genericCode,
  v0,
  lovable,
  bolt,
  base44,
  genericApp,
  perplexity,
  notebooklm,
  deepresearch,
  genericResearch,
];

/**
 * The finished models: each spec plus its four vendor-fact blocks from models/compliance. The
 * record is typed complete, so a model without a sheet cannot compile.
 */
export const MODELS: readonly Model[] = SPECS.map((spec) => ({ ...spec, ...COMPLIANCE[spec.id] }));
