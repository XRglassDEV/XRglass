// app/providers.tsx
"use client";

export function Providers({ children }: { children: React.ReactNode }) {
  // No theme libs anymore — just render children
  return <>{children}</>;
}
