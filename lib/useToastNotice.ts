'use client';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
type Tone = 'success' | 'error';
export function notify(tone: Tone, description: string) {
  if (!description?.trim()) return;
  toast[tone](tone === 'success' ? 'Success' : 'Action failed', {
    description, duration: tone === 'error' ? 10000 : 6000,
  });
}
// Emit at the event boundary, not from an effect or a React state updater.
// Clearing inline feedback is silent; repeated attempts still receive feedback.
export function useToastNotice(defaultTone: Tone) {
  const [message, setMessage] = useState('');
  const update = useCallback((text: string, tone: Tone = defaultTone) => {
    setMessage(text); notify(tone, text);
  }, [defaultTone]);
  return [message, update] as const;
}
export function useToastResult() {
  const [result, setResult] = useState<{tone: Tone; text: string} | null>(null);
  const update = useCallback((next: {tone: Tone; text: string} | null) => {
    setResult(next); if (next) notify(next.tone, next.text);
  }, []);
  return [result, update] as const;
}
