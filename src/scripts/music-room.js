// A view/controller for the persistent MusicManager, never a second audio engine.
let filter = null;
let foyerScroll = 0;
let transfer = null;
let boundSwup = null;
let layoutActive = false;
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
  if (page()?.dataset.musicPage === 'foyer' && options.rememberScroll) window.scrollTo({top:foyerScroll,behavior:'instant'});
  if (transfer && !transfer.returning && !transfer.hash) window.scrollTo({top:0,behavior:'instant'});
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

function syncPlaying() {
  const state = window.__fireflyMusic?.getState();
  if (!state) return;
  page()?.querySelectorAll('[data-song-index]').forEach(button => {
    const active = Number(button.dataset.songIndex) === state.currentIndex;
    button.setAttribute('aria-current',String(active));
    button.dataset.playing = String(active && state.isPlaying);
  });
}

function initPage() {
  syncRoomLayout();
  filter = null;
  syncPlaying();
  applyFilter();
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
    root.querySelector('.collection-filter').hidden = false;
    applyFilter();
    root.querySelector('#library').scrollIntoView({behavior:reducedMotion()?'instant':'smooth',block:'start'});
  }
  if (target.closest('[data-clear-filter]')) {
    filter = null;
    root.querySelector('.collection-filter').hidden = true;
    root.querySelectorAll('[data-collection]').forEach(button=>button.setAttribute('aria-pressed','false'));
    applyFilter();
  }
  const view = target.closest('[data-library-view-button]');
  if (view) {
    root.querySelector('.room-library').dataset.libraryView = view.dataset.libraryViewButton;
    root.querySelectorAll('[data-library-view-button]').forEach(button=>button.setAttribute('aria-pressed',String(button===view)));
  }
});
document.addEventListener('input',event => { if (event.target.matches?.('[data-song-search]')) applyFilter(); });
['fm:init','fm:track','fm:play-state'].forEach(name=>window.addEventListener(name,syncPlaying));
function bindSwup() {
  if (!window.swup || boundSwup === window.swup) return;
  boundSwup = window.swup;
  window.swup.hooks.on('page:view',initPage);
  window.swup.hooks.on('visit:end',completeTransfer);
  window.swup.hooks.on('visit:abort',clearTransfer);
  window.swup.hooks.on('fetch:error',clearTransfer);
}
document.addEventListener('swup:enable',bindSwup);
document.addEventListener('astro:page-load',()=>{bindSwup();initPage();});
bindSwup();
initPage();
