"use client";

import React from "react";

const stars = [
  // three diagonal falling stars
  { left: "6%", top: "78%", size: 2.2, anim: "fall", delay: "0.5s", dur: "3.8s" },
  { left: "22%", top: "6%", size: 2.4, anim: "fall", delay: "0s", dur: "3.6s" },
  { left: "72%", top: "10%", size: 2.0, anim: "fall", delay: "1.8s", dur: "4.2s" },

  // several static/background stars (twinkle/drift)
  { left: "8%", top: "12%", size: 1.6, anim: "twinkle", delay: "0.2s", dur: "2.6s" },
  { left: "18%", top: "24%", size: 1.2, anim: "twinkle", delay: "0.8s", dur: "3.2s" },
  { left: "35%", top: "8%", size: 1.2, anim: "drift", delay: "0.6s", dur: "5.8s" },
  { left: "42%", top: "22%", size: 1.1, anim: "twinkle", delay: "1.1s", dur: "2.2s" },
  { left: "50%", top: "18%", size: 1.8, anim: "twinkle", delay: "0.3s", dur: "2.8s" },
  { left: "60%", top: "30%", size: 1.0, anim: "drift", delay: "0.4s", dur: "6.0s" },
  { left: "70%", top: "20%", size: 1.3, anim: "twinkle", delay: "0.9s", dur: "2.2s" },
  { left: "85%", top: "14%", size: 1.4, anim: "twinkle", delay: "0.9s", dur: "2.2s" },
  { left: "12%", top: "70%", size: 1.3, anim: "drift", delay: "0.2s", dur: "5.6s" },
  { left: "28%", top: "60%", size: 1.1, anim: "twinkle", delay: "0.5s", dur: "2.4s" },
  { left: "44%", top: "62%", size: 1.4, anim: "twinkle", delay: "1s", dur: "2.4s" },
  { left: "58%", top: "72%", size: 1.0, anim: "drift", delay: "0.7s", dur: "5.2s" },
  { left: "68%", top: "56%", size: 1.1, anim: "drift", delay: "0.4s", dur: "6.0s" },
  { left: "92%", top: "72%", size: 1.2, anim: "twinkle", delay: "1.1s", dur: "2.6s" },
];

export default function StarField() {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const rafRef = React.useRef<number | null>(null);
  const targetRef = React.useRef({ mx: 0, my: 0 });

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let current = { mx: 0, my: 0 };

    function updateLoop() {
      // simple lerp
      current.mx += (targetRef.current.mx - current.mx) * 0.15;
      current.my += (targetRef.current.my - current.my) * 0.15;
      el.style.setProperty('--mx', String(current.mx));
      el.style.setProperty('--my', String(current.my));
      rafRef.current = requestAnimationFrame(updateLoop);
    }

    rafRef.current = requestAnimationFrame(updateLoop);

    function onMove(e: MouseEvent) {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const nx = (x / rect.width - 0.5) * 2; // -1 .. 1
      const ny = (y / rect.height - 0.5) * 2; // -1 .. 1
      // we want stars to move opposite to mouse direction
      targetRef.current.mx = -nx;
      targetRef.current.my = -ny;
    }

    function onLeave() {
      targetRef.current.mx = 0;
      targetRef.current.my = 0;
    }

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);

    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      ref={containerRef}
      className="pointer-events-auto absolute inset-0 z-0 overflow-hidden"
      // expose variables
      style={{
        // --mx and --my are unitless normalized (-1..1); per-star depth will multiply
        ['--mx' as any]: 0,
        ['--my' as any]: 0,
      }}
    >
      {stars.map((s, i) => {
        const animName = s.anim === 'twinkle' ? 'star-twinkle' : s.anim === 'drift' ? 'star-drift' : 'star-fall';
        const animTiming = s.anim === 'twinkle' ? 'ease-in-out' : 'linear';
        const animationValue = `${animName} ${s.dur} ${animTiming} ${s.delay} infinite`;

        const baseDelay = parseFloat(String(s.delay || '0')) || 0;
        const baseDur = parseFloat(String(s.dur || '4')) || 4;

        const depth = Math.max(6, Math.round((4 - (s.size || 1)) * 6));

        if (s.anim === 'fall') {
          const dotsCount = 12;
          const step = baseDur / (dotsCount + 2);
          const dots = new Array(dotsCount).fill(0).map((_, j) => {
            const dotDelay = baseDelay + (j + 1) * step;
            const dotAnim = `${animName} ${s.dur} linear ${dotDelay}s infinite`;
            const dotSize = Math.max(1, Math.round(s.size / 2));
            return (
              <div
                key={`dot-${i}-${j}`}
                className="star-dot"
                style={{
                  width: `${dotSize}px`,
                  height: `${dotSize}px`,
                  opacity: Math.max(0.04, 0.9 - j * 0.07),
                  animation: dotAnim,
                }}
              />
            );
          });

          return (
            <div
              key={i}
              className="star-wrap"
              style={{ left: s.left, top: s.top, ['--depth' as any]: `${depth}px` }}
            >
              <div
                className={`star star-${s.anim}`}
                style={{
                  width: `${s.size}px`,
                  height: `${s.size}px`,
                  ['--delay' as any]: s.delay,
                  ['--dur' as any]: s.dur,
                  animation: animationValue,
                }}
              />
              {dots}
            </div>
          );
        }

        return (
          <div key={i} className="star-wrap" style={{ left: s.left, top: s.top, ['--depth' as any]: `${depth}px` }}>
            <div
              className={`star star-${s.anim}`}
              style={{
                width: `${s.size}px`,
                height: `${s.size}px`,
                ['--delay' as any]: s.delay,
                ['--dur' as any]: s.dur,
                animation: animationValue,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
