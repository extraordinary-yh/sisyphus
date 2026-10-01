import type { Result, StarEvent } from "./game";

export const INTRO_MS = 1600;
export const IMPACT_MS = 1450;
export const TRANSFORM_MS = 2350;
export type Playback = { index: number; elapsed: number };
type RankView = { index: number; filled: number; stars: number };

export function entryReplay(results: Result[], yesterday: string) {
  // A missing day is never replaced by older history or an invented settlement.
  return results.find((result) => result.date === yesterday) ?? null;
}
export function eventDuration(event: StarEvent) {
  return event.promotion || event.demotion ? 4700 : event.type === "streak" ? 3700 : 3100;
}
export function advancePlayback(cursor: Playback, delta: number, events: StarEvent[]): Playback {
  let { index, elapsed } = cursor;
  if (index >= events.length) return cursor;
  elapsed += Math.max(0, delta);
  while (index < events.length) {
    const duration = index < 0 ? INTRO_MS : eventDuration(events[index]);
    if (elapsed < duration) break;
    elapsed -= duration;
    index++;
  }
  return { index, elapsed: index === events.length ? 0 : elapsed };
}
export function socketFrame(event: StarEvent, before: RankView, after: RankView, elapsed: number) {
  const impacted = elapsed >= IMPACT_MS;
  const changing = event.promotion || event.demotion;
  const transformed = changing && elapsed >= TRANSFORM_MS;
  const rank = transformed ? after : before;
  const count = rank.index === 7 ? 1 : rank.stars;
  const target = before.index === 7 ? 0 : Math.max(0,
    Math.min(before.stars - 1, event.delta > 0 ? before.filled : before.filled - 1));
  const kingStars = rank.index === 7 ? Math.max(0, transformed ? after.filled : before.filled + (impacted ? event.delta : 0)) : null;
  const filled = transformed ? (after.index === 7 ? Number(after.filled > 0) : after.filled)
    : before.index === 7 ? Number((kingStars ?? 0) > 0)
      : Math.max(0, Math.min(count, before.filled + (impacted ? event.delta : 0)));
  return { count, target, filled, kingStars, impacted, transformed, changing,
    floor: event.delta < 0 && event.before === 0 && event.after === 0 };
}
