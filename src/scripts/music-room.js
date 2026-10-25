// A view/controller for the persistent MusicManager, never a second audio engine.
let filter = null;
let foyerScroll = null;
let roomNavigation = null;
let transfer = null;
let boundSwup = null;
let layoutActive = false;
let cleanupRoomView = () => {};
const page = () => document.querySelector('[data-music-page]');
const transitionOptions = () => {
  try { return JSON.parse(page()?.dataset.musicTransition || '{}'); } catch { return {}; }
};
const record = () => page()?.querySelector('[data-player-variant]:not([data-player-variant="mini"]) .music-record');
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function clearTransfer() {
  if (!transfer) return;
  transfer.target?.style.removeProperty('visibility');
  transfer.animation?.cancel();
  clearTimeout(transfer.timeout);
  transfer.node.remove();
  transfer = null;
}

function captureRecord(link) {
  clearTransfer();
  const options = transitionOptions();
  const returning = link.hasAttribute('data-music-return');
  // Scroll intent must survive disabled/reduced/offscreen record animations.
  roomNavigation = { returning, pathname:link.pathname, hash:link.hash };
  if (!returning) foyerScroll = window.scrollY;
  if (!options.enabled || reducedMotion()) return;
  const source = record();
  if (!source) return;
  const rect = source.getBoundingClientRect();
  if (rect.bottom <= 0 || rect.top >= innerHeight || !rect.width) return;
  const node = document.createElement('div');
  node.className = 'music-record-transfer';
  node.dataset.playerVariant = source.closest('[data-player-variant]').dataset.playerVariant;
  node.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;pointer-events:none;z-index:120;`;
  node.setAttribute('aria-hidden','true');
  const clone = source.cloneNode(true);
  clone.style.cssText = 'width:100%;height:100%;margin:0';
  // FLIP only the record; the decorative tonearm belongs to the room.
  node.dataset.tonearm = 'false';
  clone.querySelector('.music-tonearm')?.remove();
  node.append(clone);
  document.body.append(node);
  transfer = { node, rect, options, returning, hash:link.hash, target:null, animation:null, timeout:setTimeout(clearTransfer,5000) };
}

function completeTransfer() {
  const options = transitionOptions();
  const navigation = roomNavigation;
  roomNavigation = null;
  // Ordinary navbar visits and history restoration belong to the site router.
  // Only an explicit room round-trip may override its content/anchor position.
  if (navigation && navigation.pathname === window.location.pathname && !navigation.hash) {
    if (navigation.returning && page()?.dataset.musicPage === 'foyer' && options.rememberScroll && foyerScroll !== null)
      window.scrollTo({top:foyerScroll,behavior:'instant'});
    if (!navigation.returning && page()?.dataset.musicPage === 'room')
      window.scrollTo({top:0,behavior:'instant'});
  }
  if (!transfer) return;
  const target = record();
  if (!target) { clearTransfer(); return; }
  const rect = target.getBoundingClientRect();
  if (rect.bottom <= 0 || rect.top >= innerHeight || reducedMotion()) { clearTransfer(); return; }
  const active = transfer;
  active.target = target;
  target.style.visibility = 'hidden';
  active.animation = active.node.animate([
    { transform:'translate(0,0) scale(1)',opacity:1 },
    { transform:`translate(${rect.left-active.rect.left}px,${rect.top-active.rect.top}px) scale(${rect.width/active.rect.width})`,opacity:1 },
  ], {duration:Math.min(750,Math.max(450,Number(options.duration)||600)),easing:'cubic-bezier(.22,.68,.18,1)',fill:'forwards'});
  active.node.style.transformOrigin='top left';
  active.animation.finished.then(() => { if (transfer === active) clearTransfer(); }).catch(() => {});
}

function cancelTransfer() {
  roomNavigation = null;
  clearTransfer();
}

function applyFilter() {
  const root = page();
  if (!root) return;
  const query = root.querySelector('[data-song-search]')?.value.trim().toLocaleLowerCase() || '';
  let visible = 0;
  root.querySelectorAll('[data-song-search-text]').forEach(row => {
    row.hidden = !row.dataset.songSearchText.includes(query) || (filter !== null && !filter.includes(Number(row.dataset.songIndex)));
    if (!row.hidden) visible++;
  });
  const empty = root.querySelector('[data-library-empty]');
  if (empty) empty.hidden = visible !== 0;
}

function syncCurrentNote(root, currentIndex) {
  const section = root?.querySelector('[data-current-note]');
  if (!section) return;
  let entries;
  try { entries = JSON.parse(section.dataset.noteEntries); } catch { section.hidden = true; return; }
  const note = entries.find(entry => entry.index === (currentIndex >= 0 ? currentIndex : 0));
  section.hidden = !note;
  if (!note) return;
  section.querySelector('[data-note-song]').textContent = `${note.name} · ${note.artist}`;
  section.querySelector('[data-note-title]').textContent = note.title;
  section.querySelector('[data-note-text]').textContent = note.text;
  section.querySelector('[data-note-example]').hidden = !note.example;
  const cover = section.querySelector('[data-note-cover]');
  cover.hidden = !note.cover;
  if (note.cover) { cover.src = note.cover; cover.alt = note.name; }
  else cover.removeAttribute('src');
}

function filterNoteArchive(root) {
  if (!root) return;
  const query = root.querySelector('[data-note-search]')?.value.trim().toLocaleLowerCase() || '';
  let matches = 0;
  root.querySelectorAll('[data-note-search-text]').forEach(item => {
    item.hidden = !item.dataset.noteSearchText.includes(query);
    if (item.hidden) item.open = false;
    else matches++;
  });
  const empty = root.querySelector('[data-notes-empty]');
  if (empty) empty.hidden = matches !== 0;
}

function syncPlaying() {
  const state = window.__fireflyMusic?.getState();
  if (!state) return;
  syncCurrentNote(page(), state.currentIndex);
  syncRoomPanel(page());
  page()?.querySelectorAll('[data-song-index]').forEach(button => {
    const active = Number(button.dataset.songIndex) === state.currentIndex;
    button.setAttribute('aria-current',String(active));
    button.dataset.playing = String(active && state.isPlaying);
  });
}

function initPage() {
  cleanupRoomView();
  syncRoomLayout();
  filter = null;
  syncPlaying();
  applyFilter();
  setupRoomView();
}

function syncRoomPanel(root) {
  if (root?.dataset.musicPage !== 'room') return;
  const panel = root.dataset.roomPanel || 'lyrics';
  const lyrics = root.querySelector('#music-room-player .lrc-drawer');
  const open = lyrics?.getAttribute('aria-hidden') === 'false';
  if (lyrics) lyrics.inert = panel !== 'lyrics' || !open;
  root.querySelectorAll('[data-room-tab]').forEach(button => {
    const selected = button.dataset.roomTab === panel;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  const notes = root.querySelector('[data-room-note-panel],#room-note-panel');
  if (notes) { notes.hidden = panel !== 'note'; notes.inert = panel !== 'note'; }
  const reopen = root.querySelector('[data-room-reopen]');
  if (reopen) reopen.hidden = panel !== 'lyrics' || open;
  const missing = root.querySelector('[data-note-missing]');
  if (missing) missing.hidden = root.querySelector('[data-current-note]')?.hidden === false;
}

function setupRoomView() {
  const root = page();
  if (root?.dataset.musicPage !== 'room') return;
  // Reuse the live controls, including their existing engine bindings.
  const widget = root.querySelector('#music-room-player');
  const times = widget?.querySelector('.music-times');
  const progress = widget?.querySelector('.music-progress');
  if (times && progress && times.parentElement !== progress) progress.prepend(times);
  const volume = widget?.querySelector('.music-volume');
  const controlRow = widget?.querySelector('.music-controls');
  if (volume && controlRow && volume.parentElement !== controlRow) controlRow.insertBefore(volume, controlRow.querySelector('.btn-drawer-toggle'));
  const translation = widget?.querySelector('.btn-translation-toggle');
  if (translation && translation.parentElement !== widget) widget.append(translation);
  const controls = root.querySelector('#music-room-player .music-controls');
  const mini = root.querySelector('[data-room-mini]');
  const navbar = document.getElementById('navbar-wrapper');
  const previousInert = navbar?.inert;
  let options = {};
  try { options = JSON.parse(root.dataset.roomOptions || '{}'); } catch { /* defaults */ }
  const syncMini = () => {
    if (!mini || !controls) return;
    const show = root.dataset.focus !== 'true' && (options.miniMode === 'always' || controls.getBoundingClientRect().bottom <= 88);
    if (!show && mini.contains(document.activeElement)) controls.querySelector('.btn-play')?.focus({preventScroll:true});
    mini.hidden = !show;
    mini.inert = !show;
    mini.setAttribute('aria-hidden', String(!show));
  };
  let beforeFocusScroll = 0;
  const onFocus = () => {
    const active = root.dataset.focus === 'true';
    if (active) beforeFocusScroll = window.scrollY;
    if (navbar) navbar.inert = active;
    syncMini();
    requestAnimationFrame(() => {
      if (root.isConnected) window.scrollTo({top:active ? 0 : beforeFocusScroll,behavior:'instant'});
    });
  };
  const observer = new IntersectionObserver(syncMini, {rootMargin:'-88px 0px 0px',threshold:0});
  if (controls) observer.observe(controls);
  const lyrics = root.querySelector('#music-room-player .lrc-drawer');
  const panelObserver = new MutationObserver(() => syncRoomPanel(root));
  if (lyrics) panelObserver.observe(lyrics,{attributes:true,attributeFilter:['aria-hidden']});
  root.addEventListener('room:focus', onFocus);
  window.addEventListener('resize',syncMini);
  syncRoomPanel(root);
  syncMini();
  cleanupRoomView = () => {
    observer.disconnect(); panelObserver.disconnect();
    root.removeEventListener('room:focus',onFocus);
    window.removeEventListener('resize',syncMini);
    if (navbar) navbar.inert = previousInert || false;
    cleanupRoomView = () => {};
  };
}

// Incumbent wallpaper handlers use inline !important styles. Keep the room
// boundary authoritative without replacing those handlers on other routes.
function syncRoomLayout() {
  const room = page()?.dataset.musicPage === 'room';
  const main = document.getElementById('main-content-shell');
  const wallpaper = document.getElementById('wallpaper-wrapper');
  if (room) {
    layoutActive = true;
    if (main?.style.getPropertyValue('top') !== '0px') main?.style.setProperty('top','0px','important');
    if (main?.style.getPropertyValue('margin-top') !== '0px') main?.style.setProperty('margin-top','0px','important');
    if (wallpaper?.style.getPropertyValue('display') !== 'none') wallpaper?.style.setProperty('display','none','important');
  } else if (layoutActive) {
    layoutActive = false;
    if(main?.style.getPropertyValue('top')==='0px')main.style.removeProperty('top');
    if(main?.style.getPropertyValue('margin-top')==='0px')main.style.removeProperty('margin-top');
    if(wallpaper?.style.getPropertyValue('display')==='none')wallpaper.style.removeProperty('display');
  }
}
const layoutObserver = new MutationObserver(syncRoomLayout);
for (const element of [document.getElementById('main-content-shell'),document.getElementById('wallpaper-wrapper')]) {
  if(element)layoutObserver.observe(element,{attributes:true,attributeFilter:['style']});
}

document.addEventListener('click',async event => {
  const target = event.target instanceof Element ? event.target : null;
  const link = target?.closest('a[data-music-enter],a[data-music-return]');
  if (link && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) captureRecord(link);
  const root = page();
  if (!root || !target || !root.contains(target)) return;
  const tab = target.closest('[data-room-tab]');
  if (tab) {
    root.dataset.roomPanel = tab.dataset.roomTab;
    if (tab.dataset.roomTab === 'lyrics' && root.querySelector('#music-room-player .btn-lrc-toggle')?.getAttribute('aria-expanded') === 'false')
      root.querySelector('#music-room-player .btn-lrc-toggle').click();
    syncRoomPanel(root);
  }
  if (target.closest('[data-room-reopen]')) root.querySelector('[data-room-tab="lyrics"]')?.click();
  const focus = target.closest('[data-room-focus]');
  if (focus) {
    const active = root.dataset.focus !== 'true';
    root.dataset.focus = String(active);
    focus.setAttribute('aria-pressed',String(active));
    let options = {};
    try { options = JSON.parse(root.dataset.roomOptions || '{}'); } catch { /* defaults */ }
    focus.querySelector('span').textContent = active ? options.exitFocus || '退出专注' : options.focus || '专注聆听';
    root.dispatchEvent(new Event('room:focus'));
  }
  const song = target.closest('button[data-song-index]');
  if (song) {
    const manager = window.__fireflyMusic;
    if (!manager) return;
    await manager.init();
    if (!song.isConnected) return;
    const index = Number(song.dataset.songIndex);
    if (manager.getState().currentIndex === index) manager.togglePlay();
    else manager.playTrackByIndex(index);
  }
  const collection = target.closest('[data-collection]');
  if (collection) {
    filter = JSON.parse(collection.dataset.members || '[]');
    root.querySelectorAll('[data-collection]').forEach(button=>button.setAttribute('aria-pressed',String(button===collection)));
    root.querySelector('[data-filter-label]').textContent = collection.querySelector('strong').textContent;
    root.querySelector('.collection-filter').hidden = filter === null;
    applyFilter();
    // Shelf filters do not jump the page or mutate the playback queue.
    if (!collection.closest('.room-collection-tabs')) root.querySelector('#library').scrollIntoView({behavior:reducedMotion()?'instant':'smooth',block:'start'});
  }
  if (target.closest('[data-clear-filter]')) {
    filter = null;
    root.querySelector('.collection-filter').hidden = true;
    root.querySelectorAll('[data-collection]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.collection==='all')));
    applyFilter();
  }
  const view = target.closest('[data-library-view-button]');
  if (view) {
    root.querySelector('.room-library').dataset.libraryView = view.dataset.libraryViewButton;
    root.querySelectorAll('[data-library-view-button]').forEach(button=>button.setAttribute('aria-pressed',String(button===view)));
  }
});
document.addEventListener('input',event => {
  if (event.target.matches?.('[data-song-search]')) applyFilter();
  if (event.target.matches?.('[data-note-search]')) filterNoteArchive(page());
});
document.addEventListener('keydown',event => {
  const root = page();
  if (!root) return;
  if (event.key === 'Escape' && root.dataset.focus === 'true') {
    root.querySelector('[data-room-focus]')?.click();
    root.querySelector('[data-room-focus]')?.focus({preventScroll:true});
  }
  const tab = event.target?.closest?.('[data-room-tab]');
  if (!tab || !root.contains(tab) || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
  event.preventDefault();
  const tabs = [...root.querySelectorAll('[data-room-tab]')];
  const index = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length-1 : (tabs.indexOf(tab) + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  tabs[index].click(); tabs[index].focus();
});
['fm:init','fm:track','fm:play-state'].forEach(name=>window.addEventListener(name,syncPlaying));
function bindSwup() {
  if (!window.swup || boundSwup === window.swup) return;
  boundSwup = window.swup;
  window.swup.hooks.on('page:view',initPage);
  window.swup.hooks.on('visit:end',completeTransfer);
  window.swup.hooks.on('visit:abort',cancelTransfer);
  window.swup.hooks.on('fetch:error',cancelTransfer);
}
document.addEventListener('swup:enable',bindSwup);
document.addEventListener('astro:page-load',()=>{bindSwup();initPage();});
bindSwup();
initPage();
