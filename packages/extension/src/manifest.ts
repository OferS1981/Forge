import { HOSTS } from '@forge/catalog';

/**
 * The manifest, built from the catalogue rather than typed out beside it.
 *
 * Section 14 says the host map lives in the catalogue so it stays with the data. If the manifest
 * repeated that list by hand, the two would drift the first time a model was added, and the failure
 * would be silent: the extension would simply do nothing on the new site. Deriving it means adding
 * a host to `hosts.ts` is the only thing anyone has to do.
 */

export interface Manifest {
  manifest_version: 3;
  name: string;
  version: string;
  description: string;
  permissions: string[];
  host_permissions: string[];
  background: { service_worker: string; type: 'module' };
  side_panel: { default_path: string };
  action: { default_title: string };
  content_scripts: { matches: string[]; js: string[]; run_at: 'document_idle' }[];
  browser_specific_settings?: { gecko: { id: string; strict_min_version: string } };
}

/** One match pattern per host in the catalogue, with subdomains, in a stable order. */
export function matchPatterns(): string[] {
  return Object.keys(HOSTS)
    .map((host) => `https://*.${host.replace(/^www\./, '')}/*`)
    .filter((pattern, i, all) => all.indexOf(pattern) === i)
    .sort();
}

export function manifest(version: string): Manifest {
  const matches = matchPatterns();
  return {
    manifest_version: 3,
    name: 'Forge, a prompt smithy',
    version,
    description:
      'Writes the prompt in the grammar the site you are on actually reads, with the settings to match.',
    /*
     * Three, and no more. `sidePanel` to open, `storage` for the library when nobody is signed in,
     * and `scripting` to put the prompt in the page. No tabs permission: the content script tells
     * the panel which site it is on, so the panel never has to ask the browser about your tabs.
     */
    permissions: ['sidePanel', 'storage', 'scripting'],
    host_permissions: matches,
    background: { service_worker: 'service-worker.js', type: 'module' },
    side_panel: { default_path: 'panel.html' },
    action: { default_title: 'Open Forge' },
    content_scripts: [{ matches, js: ['content.js'], run_at: 'document_idle' }],
    // Firefox needs an id and a floor. Section 14 asks for Chrome, Edge and Firefox.
    browser_specific_settings: {
      gecko: { id: 'forge@prompt-smithy', strict_min_version: '121.0' },
    },
  };
}
