"use client";

import { useEffect, useRef } from "react";

export function GamingBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, rx: 0, ry: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const cursor = cursorRef.current;
    const ring = ringRef.current;
    if (!canvas || !cursor || !ring) return;

    const ctx = canvas.getContext("2d")!;
    let W = 0, H = 0, raf = 0;

    // ── Resize ──
    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // ── Cursor ──
    function onMouseMove(e: MouseEvent) {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      if (cursor) {
        cursor.style.left = e.clientX + "px";
        cursor.style.top = e.clientY + "px";
      }
    }
    window.addEventListener("mousemove", onMouseMove);

    function animRing() {
      const m = mouseRef.current;
      m.rx += (m.x - m.rx) * 0.12;
      m.ry += (m.y - m.ry) * 0.12;
      if (ring) {
        ring.style.left = m.rx + "px";
        ring.style.top = m.ry + "px";
      }
      requestAnimationFrame(animRing);
    }
    animRing();

    // ── Particles ──
    interface Particle {
      x: number; y: number;
      vx: number; vy: number;
      size: number;
      color: string;
      alpha: number;
      life: number; age: number;
      twinkle: number;
    }

    function mkParticle(): Particle {
      const t = Math.random();
      const color =
        t < 0.4 ? "rgba(0,255,224," :
        t < 0.7 ? "rgba(123,47,255," :
                  "rgba(255,0,128,";
      return {
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 1.8 + 0.4,
        color,
        alpha: Math.random() * 0.55 + 0.1,
        life: Math.random() * 200 + 100, age: 0,
        twinkle: Math.random() * Math.PI * 2,
      };
    }

    const particles: Particle[] = Array.from({ length: 150 }, mkParticle);

    // ── Grid lines ──
    interface GridLine { horiz: boolean; pos: number; speed: number; alpha: number; len: number; }
    function mkLine(horiz: boolean): GridLine {
      return {
        horiz,
        pos: Math.random() * (horiz ? H : W),
        speed: (Math.random() * 0.18 + 0.04) * (Math.random() < 0.5 ? 1 : -1),
        alpha: Math.random() * 0.035 + 0.008,
        len: Math.random() * 600 + 200,
      };
    }
    const gridLines: GridLine[] = [
      ...Array.from({ length: 6 }, () => mkLine(true)),
      ...Array.from({ length: 6 }, () => mkLine(false)),
    ];

    // ── Main loop ──
    function loop() {
      ctx.clearRect(0, 0, W, H);

      // Dark base
      ctx.fillStyle = "rgba(0,0,5,0.94)";
      ctx.fillRect(0, 0, W, H);

      // Grid lines
      for (const g of gridLines) {
        g.pos += g.speed;
        if (g.pos < 0) g.pos = g.horiz ? H : W;
        if (g.pos > (g.horiz ? H : W)) g.pos = 0;
        ctx.strokeStyle = `rgba(0,255,224,${g.alpha})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        if (g.horiz) {
          ctx.moveTo((W - g.len) / 2, g.pos);
          ctx.lineTo((W + g.len) / 2, g.pos);
        } else {
          ctx.moveTo(g.pos, (H - g.len) / 2);
          ctx.lineTo(g.pos, (H + g.len) / 2);
        }
        ctx.stroke();
      }

      // Mouse glow aura
      const mx = mouseRef.current.x, my = mouseRef.current.y;
      const gr = ctx.createRadialGradient(mx, my, 0, mx, my, 220);
      gr.addColorStop(0, "rgba(0,255,224,0.045)");
      gr.addColorStop(1, "transparent");
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, W, H);

      // Particles
      for (const p of particles) {
        // Repulsion from cursor
        const dx = p.x - mx, dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          const f = (130 - dist) / 130 * 0.75;
          p.vx += (dx / dist) * f * 0.3;
          p.vy += (dy / dist) * f * 0.3;
        }
        p.vx *= 0.98; p.vy *= 0.98;
        p.x += p.vx; p.y += p.vy;
        p.age++; p.twinkle += 0.03;

        if (p.age > p.life || p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          Object.assign(p, mkParticle());
          continue;
        }

        const a = p.alpha * (0.55 + 0.45 * Math.sin(p.twinkle));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + a + ")";
        ctx.fill();
      }

      // Connect nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 85) {
            ctx.strokeStyle = `rgba(0,255,224,${0.07 * (1 - d / 85)})`;
            ctx.lineWidth = 0.35;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <>
      {/* Cursor */}
      <div id="babi-cursor" ref={cursorRef} />
      <div id="babi-cursor-ring" ref={ringRef} />
      {/* Particle canvas */}
      <canvas id="babi-canvas" ref={canvasRef} />
    </>
  );
}