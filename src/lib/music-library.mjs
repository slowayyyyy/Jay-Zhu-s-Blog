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

// Only a song's own note is live. Archived room notes never reappear after
// the owner clears a note or removes a song from the playback library.
export function listeningNotes(library = []) {
  return library.filter(track => typeof track.note?.text === 'string' && track.note.text.trim()).map(track => ({
    id:track.id,index:track.index,name:track.name,artist:track.artist,cover:track.cover || '',
    title:String(track.note.title || track.name),text:track.note.text,example:track.note.example === true,
  }));
}

export function cropStyle(crop = {}) {
  crop ||= {};
  const clamp = (value, min, max, fallback) => Number.isFinite(Number(value)) ? Math.min(max, Math.max(min, Number(value))) : fallback;
  return `object-position:${clamp(crop.positionX, 0, 100, 50)}% ${clamp(crop.positionY, 0, 100, 50)}%;transform:scale(${clamp(crop.zoom, 1, 3, 1)})`;
}

// The image moves inside a fixed circular mask; scaling never enlarges the disc.
export function coverFocusStyle(crop = {}) {
  const number = (key, fallback, min, max) => {
    const raw = crop?.[key];
    const value = raw == null || raw === '' ? fallback : Number(raw);
    return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
  };
  const x = number('positionX', 50, 0, 100);
  const y = number('positionY', 50, 0, 100);
  return `object-position:${x}% ${y}%;transform:scale(${number('zoom',1,1,2)});transform-origin:${x}% ${y}%`;
}
