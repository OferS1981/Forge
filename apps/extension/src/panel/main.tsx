import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@forge/ui/styles.css';
import './panel.css';
import { Panel } from './Panel';

const host = document.getElementById('root');
if (host === null) throw new Error('The panel has no root element.');
createRoot(host).render(
  <StrictMode>
    <Panel />
  </StrictMode>,
);
