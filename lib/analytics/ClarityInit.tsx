'use client';

import { useEffect } from 'react';
import Clarity from '@microsoft/clarity';

export function ClarityInit() {
  // Starts on the visitor's first interaction rather than during page load,
  // so its script and cookies stay out of the way of the first paint.
  useEffect(() => {
    const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
    if (!projectId) return;

    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    const start = () => {
      stop();
      Clarity.init(projectId);
    };
    const stop = () =>
      events.forEach((event) => window.removeEventListener(event, start));
    events.forEach((event) =>
      window.addEventListener(event, start, { once: true, passive: true }),
    );
    return stop;
  }, []);

  return null;
}