import type { Result } from './game';
export type WatchedSettlements = Record<string, string>;
export const WATCHED_KEY = 'sisyphus-watched-settlements-v1';
export function settlementFingerprint(result: Result) { return JSON.stringify(result); }
export function settlementPlaylist(results: Result[], start = '', end = '9999-12-31', watched?: WatchedSettlements) {
  return results.filter(r => r.date >= start && r.date <= end && (!watched || watched[r.date] !== settlementFingerprint(r)))
    .slice().sort((a, b) => a.date.localeCompare(b.date));
}
export function readWatched(raw: string | null): WatchedSettlements {
  try { const value = JSON.parse(raw ?? '{}');
    if (!value || Array.isArray(value) || typeof value !== 'object') return {};
    return Object.fromEntries(Object.entries(value).filter(([date, fingerprint]) => /^\d{4}-\d{2}-\d{2}$/.test(date) && typeof fingerprint === 'string')) as WatchedSettlements;
  } catch { return {}; }
}
