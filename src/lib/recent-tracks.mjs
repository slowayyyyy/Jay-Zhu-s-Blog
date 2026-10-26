const KEY = 'canglan-listening-recent-v1';
// Only stable song IDs are stored. Hidden/removed songs never leak into results.
export function recentTracks(storage, visibleIds) {
  try {
    const ids = JSON.parse(storage?.getItem(KEY) || '[]');
    return Array.isArray(ids) ? [...new Set(ids.filter(id => typeof id === 'string' && visibleIds.includes(id)))].slice(0, 50) : [];
  } catch { return []; }
}
export function rememberTrack(storage, id, visibleIds) {
  if (!visibleIds.includes(id)) return recentTracks(storage, visibleIds);
  const ids = [id, ...recentTracks(storage, visibleIds).filter(value => value !== id)].slice(0, 50);
  try { storage?.setItem(KEY, JSON.stringify(ids)); } catch { /* Private browsing remains usable. */ }
  return ids;
}
