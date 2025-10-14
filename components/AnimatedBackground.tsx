'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function AnimatedBackground() {
  const ripples = useRef<HTMLDivElement>(null);
  const particles = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ripples.current || !particles.current) return;

    // Layer A: watery ripples (soft radial highlights)
    const blobs = Array.from({ length: 4 }).map((_, i) => {
      const el = document.createElement('div');
      el.style.position = 'absolute';
      el.style.borderRadius = '9999px';
      el.style.width = `${600 + i*120}px`;
      el.style.height = `${600 + i*120}px`;
      el.style.left = `${(i%2?60:20)}%`;
      el.style.top = `${(i%2?25:55)}%`;
      el.style.transform = 'translate(-50%,-50%)';
      el.style.background = 'radial-gradient(closest-side, rgba(255,255,255,0.7), rgba(210,235,255,0.06), rgba(0,0,0,0))';
      el.style.filter = 'blur(30px)';
      el.style.opacity = '0.6';
      ripples.current!.appendChild(el);
      gsap.to(el, { duration: 12 + i*2, yoyo: true, repeat: -1, opacity: 0.35 + 0.25*Math.random(), x: (Math.random()*60-30), y: (Math.random()*40-20), ease: 'sine.inOut' });
      return el;
    });

    // Layer B: soft particle lines
    const lines = Array.from({ length: 20 }).map(() => {
      const el = document.createElement('div');
      el.style.position = 'absolute';
      el.style.height = '1px';
      el.style.width = `${120 + Math.random()*240}px`;
      el.style.background = 'linear-gradient(90deg, rgba(150,210,255,0), rgba(60,130,255,0.65), rgba(150,210,255,0))';
      el.style.top = `${Math.random()*100}%`;
      el.style.left = `${Math.random()*100}%`;
      el.style.opacity = `${0.2 + Math.random()*0.4}`;
      particles.current!.appendChild(el);
      gsap.to(el, { duration: 8 + Math.random()*6, x: 100*(Math.random() < 0.5 ? -1 : 1), repeat: -1, yoyo: true, ease: 'sine.inOut' });
      return el;
    });

    return () => {
      blobs.forEach(b => b.remove());
      lines.forEach(l => l.remove());
    };
  }, []);

  return (
    <>
      <div ref={ripples} className="pointer-events-none fixed inset-0 -z-10" />
      <div ref={particles} className="pointer-events-none fixed inset-0 -z-10" />
    </>
  );
}
