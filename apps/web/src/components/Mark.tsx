'use client';

import { useEffect, useRef } from 'react';

/**
 * The hammer and anvil, drawn on a canvas and ported from the prototype. The hammer swings, the
 * billet glows on impact, sparks run on a physics loop, and it strikes again whenever a prompt is
 * forged.
 *
 * With prefers-reduced-motion set, none of that happens: the mark is drawn once, still, with the
 * hammer at rest. Nothing is animated and no frame is ever requested.
 */

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
}

export interface MarkHandle {
  /** Called when a prompt is forged, so the mark strikes on the beat. */
  strike: () => void;
}

function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function Mark({ strikeSignal }: { strikeSignal: number }): React.ReactNode {
  const canvas = useRef<HTMLCanvasElement>(null);
  const glow = useRef(0);
  const sparks = useRef<Spark[]>([]);
  const struck = useRef(strikeSignal);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext('2d');
    if (!el || !ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let last = performance.now();
    let lastStrike = 0;

    const burst = (x: number, y: number): void => {
      if (reduced) return;
      for (let i = 0; i < 16; i++)
        sparks.current.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 5.2,
          vy: -Math.random() * 3.4 - 0.5,
          life: 16 + Math.random() * 22,
          max: 34,
        });
    };

    const frame = (now: number): void => {
      const dt = Math.min(48, now - last);
      last = now;
      const colours = {
        ink: token('--ink'),
        ember: token('--ember'),
        yellow: token('--yellow'),
        line: token('--line-strong'),
        dim: token('--ink-dim'),
        white: token('--white-heat'),
      };
      ctx.clearRect(0, 0, el.width, el.height);

      const cycle = reduced ? 0 : (now % 1500) / 1500;
      let ang = 0;
      if (!reduced) {
        if (cycle < 0.45) ang = -0.85 * (1 - cycle / 0.45);
        else if (cycle < 0.55) ang = 0.3 * ((cycle - 0.45) / 0.1);
        else ang = 0.3 * (1 - (cycle - 0.55) / 0.45) - 0.85 * ((cycle - 0.55) / 0.45);
        ang = Math.max(-0.95, ang);
        if (cycle >= 0.53 && cycle < 0.58 && now - lastStrike > 400) {
          lastStrike = now;
          burst(46, 58);
          glow.current = 1;
        }
      }
      glow.current = Math.max(0, glow.current - dt / 460);

      // The anvil: horn, face, waist, base.
      ctx.save();
      ctx.fillStyle = colours.ink;
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.moveTo(18, 52);
      ctx.lineTo(74, 52);
      ctx.lineTo(74, 63);
      ctx.lineTo(58, 63);
      ctx.lineTo(54, 74);
      ctx.lineTo(66, 74);
      ctx.lineTo(66, 81);
      ctx.lineTo(22, 81);
      ctx.lineTo(22, 74);
      ctx.lineTo(34, 74);
      ctx.lineTo(30, 63);
      ctx.lineTo(18, 63);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(19, 52.5);
      ctx.lineTo(3, 57.5);
      ctx.lineTo(19, 62.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // The hot billet resting on the face.
      if (glow.current > 0) {
        const g = ctx.createRadialGradient(46, 50, 1, 46, 50, 24);
        g.addColorStop(0, colours.yellow);
        g.addColorStop(0.4, colours.ember);
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.globalAlpha = glow.current * 0.85;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(46, 50, 24, 0, 7);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle =
        glow.current > 0.2 ? colours.white : glow.current > 0 ? colours.yellow : colours.ember;
      ctx.fillRect(32, 45, 28, 7);

      // The hammer: head perpendicular to the handle, pivoting up and away.
      ctx.save();
      ctx.translate(46, 41);
      ctx.rotate(ang);
      const head = -0.7;
      ctx.strokeStyle = colours.dim;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(Math.cos(head) * 6, Math.sin(head) * 6);
      ctx.lineTo(Math.cos(head) * 33, Math.sin(head) * 33);
      ctx.stroke();
      ctx.save();
      ctx.rotate(head);
      ctx.fillStyle = colours.ink;
      ctx.fillRect(-8, -13, 16, 26);
      ctx.fillStyle = colours.line;
      ctx.fillRect(-8, -13, 3.5, 26);
      ctx.restore();
      ctx.restore();

      // Sparks.
      for (let i = sparks.current.length - 1; i >= 0; i--) {
        const s = sparks.current[i];
        if (!s) continue;
        s.x += (s.vx * dt) / 16;
        s.y += (s.vy * dt) / 16;
        s.vy += (0.16 * dt) / 16;
        s.life -= dt / 16;
        if (s.life <= 0) {
          sparks.current.splice(i, 1);
          continue;
        }
        const a = Math.max(0, s.life / s.max);
        ctx.globalAlpha = a;
        ctx.fillStyle = a > 0.6 ? colours.white : a > 0.3 ? colours.yellow : colours.ember;
        ctx.fillRect(s.x, s.y, 1.8, 1.8);
      }
      ctx.globalAlpha = 1;

      if (!reduced) raf = requestAnimationFrame(frame);
    };

    frame(performance.now());
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (strikeSignal === struck.current) return;
    struck.current = strikeSignal;
    glow.current = 1;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      for (let i = 0; i < 16; i++)
        sparks.current.push({
          x: 46,
          y: 58,
          vx: (Math.random() - 0.5) * 5.2,
          vy: -Math.random() * 3.4 - 0.5,
          life: 16 + Math.random() * 22,
          max: 34,
        });
  }, [strikeSignal]);

  return (
    /*
     * A canvas is interactive to the browser and decorative here, so it is taken out of the
     * accessibility tree entirely rather than given an image role it does not earn. The wordmark
     * beside it already says Forge.
     */
    <canvas ref={canvas} className="mark" width={88} height={88} aria-hidden="true" />
  );
}
