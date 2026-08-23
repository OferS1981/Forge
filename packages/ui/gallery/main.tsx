import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../src/styles/index.css';
import './gallery.css';
import { Gallery } from './Gallery';

const host = document.getElementById('root');
if (!host) throw new Error('The gallery needs a #root element to mount into.');
createRoot(host).render(
  <StrictMode>
    <Gallery />
  </StrictMode>,
);
