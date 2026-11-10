import { useEffect, useState } from 'react';

/**
 * Types several text segments one after another.
 *
 * `segments`: [{ key, text, speed?, pause? }] — must be a stable reference.
 * When `enabled` is false everything is shown at once (reduced motion).
 * Changing `restartKey` types everything again from the start.
 *
 * Returns { typed: { [key]: string }, activeKey, done }.
 */
export default function useTypeSequence(segments, enabled = true, restartKey = 0) {
  const [pos, setPos] = useState({ i: 0, n: 0 });

  useEffect(() => {
    setPos({ i: 0, n: 0 });
  }, [restartKey]);

  useEffect(() => {
    if (!enabled || pos.i >= segments.length) return undefined;
    const seg = segments[pos.i];
    const finished = pos.n >= seg.text.length;
    const delay = finished ? (seg.pause ?? 350) : (seg.speed ?? 40);
    const t = setTimeout(() => {
      setPos((p) => (finished ? { i: p.i + 1, n: 0 } : { i: p.i, n: p.n + 1 }));
    }, delay);
    return () => clearTimeout(t);
  }, [enabled, pos, segments]);

  const done = !enabled || pos.i >= segments.length;
  const typed = {};
  segments.forEach((seg, idx) => {
    if (done || idx < pos.i) typed[seg.key] = seg.text;
    else if (idx === pos.i) typed[seg.key] = seg.text.slice(0, pos.n);
    else typed[seg.key] = '';
  });

  return { typed, activeKey: done ? null : segments[pos.i].key, done };
}
