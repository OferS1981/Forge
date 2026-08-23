import type { ModelId } from './types';

/**
 * Host to model map, used by the extension's content script to open the right anvil for the site
 * the user is on. It lives in the catalogue so it stays with the data.
 */
export const HOSTS: Record<string, ModelId> = {
  'midjourney.com': 'midjourney',
  'ideogram.ai': 'ideogram',
  'firefly.adobe.com': 'firefly',
  'recraft.ai': 'recraft',
  'leonardo.ai': 'leonardo',
  'app.leonardo.ai': 'leonardo',
  'dreamina.capcut.com': 'seedream',
  'tongyi.aliyun.com': 'qwenimage',
  'bfl.ai': 'flux',
  'playground.bfl.ai': 'flux',
  'clipdrop.co': 'sdxl',
  'labs.google': 'veo',
  'gemini.google.com': 'gemini',
  'aistudio.google.com': 'gemini',
  'notebooklm.google.com': 'notebooklm',
  'klingai.com': 'kling',
  'app.klingai.com': 'kling',
  'hailuoai.video': 'hailuo',
  'runwayml.com': 'runway',
  'app.runwayml.com': 'runway',
  'lumalabs.ai': 'luma',
  'dream-machine.lumalabs.ai': 'luma',
  'ltx.studio': 'ltx',
  'higgsfield.ai': 'higgsfield',
  'elevenlabs.io': 'el-tts',
  'suno.com': 'suno',
  'stableaudio.com': 'stableaudio',
  'play.cartesia.ai': 'cartesia',
  'platform.hume.ai': 'hume',
  'chatgpt.com': 'gpt',
  'claude.ai': 'claude',
  'grok.com': 'grok',
  'chat.deepseek.com': 'deepseek',
  'perplexity.ai': 'perplexity',
  'www.perplexity.ai': 'perplexity',
  'github.com': 'copilot',
  'cursor.com': 'cursor',
  'app.devin.ai': 'devin',
  'v0.app': 'v0',
  'lovable.dev': 'lovable',
  'bolt.new': 'bolt',
  'app.base44.com': 'base44',
};

/** The model for a hostname, matching the most specific host first. */
export function modelForHost(hostname: string): ModelId | undefined {
  const host = hostname.toLowerCase().replace(/^www\./, '');
  if (HOSTS[host]) return HOSTS[host];
  const parts = host.split('.');
  for (let i = 1; i < parts.length - 1; i++) {
    const suffix = parts.slice(i).join('.');
    const hit = HOSTS[suffix];
    if (hit) return hit;
  }
  return undefined;
}
