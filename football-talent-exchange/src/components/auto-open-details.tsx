"use client";
import { useEffect, useRef, type ReactNode } from "react";

/** Panneau repliable sur téléphone, ouvert d'office sur grand écran. */
export function AutoOpenDetails({ minWidth = 1024, className, summary, children }: { minWidth?: number; className?: string; summary: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (ref.current && window.matchMedia(`(min-width: ${minWidth}px)`).matches) ref.current.open = true;
  }, [minWidth]);
  return (
    <details ref={ref} className={className}>
      <summary>{summary}</summary>
      {children}
    </details>
  );
}
