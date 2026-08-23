/**
 * The service worker. Its whole job is opening the panel when the toolbar button is pressed, and
 * passing on which site a tab is showing. There is no background work, no polling and no network.
 */

chrome.runtime.onInstalled.addListener(() => {
  // Pressing the toolbar button opens the side panel, rather than needing a click handler here.
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
    // Firefox has no sidePanel.setPanelBehavior. The manifest's side_panel entry is enough there.
  });
});

/**
 * The content script sends its host, and the panel wants it. A message from a content script does
 * not reach an extension page on its own, so it is passed on here.
 */
chrome.runtime.onMessage.addListener((message: unknown, sender) => {
  const kind = (message as { kind?: unknown } | null)?.kind;
  if (kind !== 'forge:site' || sender.tab === undefined) return false;
  void chrome.runtime.sendMessage(message).catch(() => {
    // The panel is closed. Nothing to do.
  });
  return false;
});
