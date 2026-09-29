// Drag feel numbers — how a locked die lifts, follows your finger, snaps back, and how the rolling
// area lights up. The values live in content/tuning/drag.json (Muzzy edits them there or in the Dev Kit).
// Everything that runs per frame reads this ONE object, so a live edit only has to replace its fields
// (e.g. Object.assign(drag, newValues)) — no reload.
import { useEffect, useState } from 'react';
import dragFile from '../../content/tuning/drag.json';
import { onTuning } from '../devkit/tuning/liveTuning';

export type DragTuning = typeof dragFile;

export const drag: DragTuning = { ...dragFile };

// Dev Kit Tuning tab: slider moves land here live (liveTuning has no Dev Kit code — safe in release builds)
onTuning<DragTuning>('drag', (data) => Object.assign(drag, data));

/**
 * For the few drag values used when a piece is BUILT (not every frame): the dimmed colour at the cap,
 * the ring under a die, the drop-zone highlight's size. Call it in the component and it re-renders when
 * the Dev Kit edits drag.json — only on an edit, never per frame. (The listener above runs first, so
 * `drag` already holds the new values when the component redraws.)
 */
export function useDragTuningEdits(): void {
  const [, setEdits] = useState(0);
  useEffect(() => onTuning('drag', () => setEdits((n) => n + 1)), []);
}
