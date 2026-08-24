'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker that makes "no network call" true of the shell as well as the
 * engine. Registration only: everything the worker does is in public/sw.js, and a browser
 * without service workers simply keeps the current behaviour.
 */
export function Offline(): null {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // The app is fully functional without it; a blocked registration is not an error state.
    });
  }, []);
  return null;
}
