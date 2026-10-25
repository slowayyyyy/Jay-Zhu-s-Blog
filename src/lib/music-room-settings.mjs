// Normalize CMS inputs once so empty/older settings remain safe to render.
export function roomPresentation(room = {}) {
  const values = room.appearance || {};
  const number = (key, fallback, min, max) => {
    const raw = values[key];
    const parsed = raw === '' || raw == null ? fallback : Number(raw);
    return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
  };
  return {
    showBackground: values.showBackground !== false,
    backgroundImage: values.backgroundImage || {},
    mobileBackgroundImage: values.mobileBackgroundImage?.src ? values.mobileBackgroundImage : values.backgroundImage || {},
    darkBackgroundImage: values.darkBackgroundImage || {},
    backgroundOpacity: number('backgroundOpacity', 90, 0, 100),
    darkBackgroundOpacity: number('darkBackgroundOpacity', 18, 0, 100),
    recordSize: number('recordSize', 440, 300, 520),
    showSleeve: values.showSleeve !== false,
    lyricFontSize: number('lyricFontSize', 24, 18, 32),
    translationFontSize: number('translationFontSize', 16, 12, 22),
    lyricHeight: number('lyricHeight', 380, 280, 520),
    showFocus: values.showFocus !== false,
    sleeveLibrary: values.sleeveLibrary !== false,
    miniMode: ['auto', 'always'].includes(values.miniMode) ? values.miniMode : 'auto',
    labels: {
      lyrics: '歌词', notes: '手记', focus: '专注聆听', exitFocus: '退出专注',
      allTracks: '全部', list: '列表', covers: '封面',
      openLyrics: '展开歌词', emptyNote: '这首歌还没有手记。',
      ...Object.fromEntries(Object.entries(room.labels || {}).filter(([, value]) => typeof value === 'string' && value.trim())),
    },
  };
}
