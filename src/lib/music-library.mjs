// Stable selection keys: order changes never change a collection's membership.
export function trackId(track) {
  if (String(track.id || '').trim()) return String(track.id).trim();
  let hash = 2166136261;
  for (const character of String(track.src || `${track.name}/${track.artist}`)) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  }
  return `song-${(hash >>> 0).toString(16)}`;
}

export function musicLibrary(playlist = []) {
  return (playlist || []).filter((track) => String(track.src || '').trim()).map((track, index) => ({
    ...track, id: trackId(track), index,
  }));
}

export function selectTracks(library, ids = []) {
  return [...new Set(ids)].map((id) => library.find((track) => track.id === id)).filter(Boolean);
}

export function cropStyle(crop = {}) {
  crop ||= {};
  const clamp = (value, min, max, fallback) => Number.isFinite(Number(value)) ? Math.min(max, Math.max(min, Number(value))) : fallback;
  return `object-position:${clamp(crop.positionX, 0, 100, 50)}% ${clamp(crop.positionY, 0, 100, 50)}%;transform:scale(${clamp(crop.zoom, 1, 3, 1)})`;
}
