import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@forge/ui/styles.css';
import './styles.css';
import { Shell } from '../components/Shell';

export const metadata: Metadata = {
  title: 'Forge, a prompt smithy',
  description:
    'Forge writes production-grade prompts for a catalogue of AI models, each in that model’s own grammar, with the exact settings to match.',
};

/**
 * The theme is read and applied before the first paint. Without this the page renders in the light
 * palette for one frame and then flips, which is worse than either theme.
 */
const THEME_SCRIPT = `try{var t=JSON.parse(localStorage.getItem('forge.theme')||'"system"');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
