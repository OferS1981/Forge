// The adapters directly, not the package index: a content script runs on every matched
// page, so it must not drag the catalogue in behind the manifest builder.
import { pasteInto } from '@forge/extension/adapters';

/**
 * The content script. It does two things and nothing else: it says which site it is on, and it
 * writes a prompt into the page when the panel asks. It never reads the page, never sends anything
 * anywhere, and holds no state.
 */

interface PasteMessage {
  kind: 'forge:paste';
  text: string;
}

function isPaste(value: unknown): value is PasteMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { kind?: unknown }).kind === 'forge:paste' &&
    typeof (value as { text?: unknown }).text === 'string'
  );
}

chrome.runtime.sendMessage({ kind: 'forge:site', host: location.hostname }).catch(() => {
  // The panel is not open. There is nobody to tell, and that is fine.
});

chrome.runtime.onMessage.addListener((message: unknown, _sender, respond) => {
  if (!isPaste(message)) return false;
  respond(pasteInto(document, location.hostname, message.text));
  return true;
});
