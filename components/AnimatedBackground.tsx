"use client";

import { useEffect, useState } from "react";

const gradients = [
  { className: "bg-gradient-to-br from-sky-500/40 to-violet-500/20", size: "h-[520px] w-[520px]", top: "-12%", left: "-18%" },
  { className: "bg-gradient-to-br from-cyan-400/30 to-sky-500/10", size: "h-[460px] w-[460px]", top: "12%", left: "62%" },
  { className: "bg-gradient-to-br from-indigo-500/40 to-purple-500/20", size: "h-[540px] w-[540px]", top: "48%", left: "-8%" },
];

export default function AnimatedBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(50,90,180,0.24),transparent_60%)]" />
      <div className="absolute inset-0 grid-outline opacity-40" />
      {gradients.map((item, index) => (
        <div
          key={index}
          className={`${item.className} absolute ${item.size} rounded-full blur-3xl transition duration-[2500ms] ${
            mounted ? "opacity-100" : "opacity-0"
          }`}
          style={{
            top: item.top,
            left: item.left,
            animation: `auraDrift ${24 + index * 3}s ease-in-out infinite`,
          }}
        />
      ))}
      <div className="absolute inset-x-0 bottom-0 h-[520px] bg-[radial-gradient(ellipse_at_bottom,rgba(56,189,248,0.24),transparent_70%)]" />
    </div>
  );
}
