import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { musicLibrary } from '../../src/lib/music-library.mjs';

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const source = read('src/components/features/MusicPlayer.astro');
const script = source.match(/<script define:vars[^>]*>([\s\S]*?)<\/script>/)[1];
// Run the real mount guard and real button handlers, not a replacement controller.
const mount = script.slice(0, script.indexOf('    // ── Local state'));
const buttons = script.slice(script.indexOf('    // ── Button click delegates'), script.indexOf('    ui.volContainer.addEventListener'));
const element = () => ({
  listeners: {},
  addEventListener(name, fn) { (this.listeners[name] ??= []).push(fn); },
  click() { this.listeners.click?.forEach(fn => fn()); },
});
const widget = () => {
  const parts = new Map();
  return { parts, querySelector(selector) { if (!parts.has(selector)) parts.set(selector, element()); return parts.get(selector); } };
};

test('persisted navbar and sidebar: revisiting routes never doubles Next, Pause, mode or translation', () => {
  const nodes = new Map(['navbar', 'sidebar', 'room'].map(id => [id, widget()]));
  let index = 0, playing = true, mode = 0;
  const translations = [];
  const mgr = {
    togglePlay() { playing = !playing; }, playNext() { index++; }, playPrev() { index--; },
    cyclePlayMode() { mode = (mode + 1) % 3; }, toggleMute() {},
  };
  const context = vm.createContext({
    window: { __fireflyMusic: mgr, dispatchEvent(e) { translations.push(e.detail.enabled); } },
    document: { getElementById(id) { return nodes.get(id) || element(); } },
    viewConfigStr: '{}', widgetId: '', localStorage: { setItem() {} },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
  });
  const run = id => {
    context.widgetId = id;
    vm.runInContext(mount + 'var local = { hasTranslations: true, translationEnabled: true };\n' + buttons + '})();', context);
  };
  for (let visit = 0; visit < 6; visit++) for (const id of nodes.keys()) run(id);
  for (const node of nodes.values()) {
    const before = index;
    node.parts.get('.btn-next').click(); assert.equal(index, before + 1);
    node.parts.get('.btn-prev').click(); assert.equal(index, before);
    playing = true; node.parts.get('.btn-play').click(); assert.equal(playing, false);
    node.parts.get('.btn-play').click(); assert.equal(playing, true);
    mode = 0; node.parts.get('.btn-repeat').click(); assert.equal(mode, 1);
    const count = translations.length;
    node.parts.get('.btn-translation-toggle').click();
    assert.equal(translations.length, count + 1); assert.equal(translations.at(-1), false);
    assert.equal(node.parts.get('.btn-play').listeners.click.length, 1);
  }
  // A newly rendered room uses a new node, even when its ID is the same.
  const old = nodes.get('room'); nodes.set('room', widget()); run('room');
  assert.notEqual(nodes.get('room'), old);
  playing = true; nodes.get('room').parts.get('.btn-play').click(); assert.equal(playing, false);
});

test('buffering overlay never steals control clicks and reports current busy state', () => {
  const logic = source.slice(source.indexOf('    function setLoading(bool)'), source.indexOf('    function updatePlayStateUI'));
  const classes = new Set(['opacity-0', 'pointer-events-none']);
  const ui = {
    loading: { classList: { add: name => classes.add(name), toggle(name, force) { if (force) classes.add(name); else classes.delete(name); } } },
    widget: { setAttribute(name, value) { this[name] = value; } },
  };
  const context = vm.createContext({ ui }); vm.runInContext(logic, context);
  for (const loading of [true, false, true, false]) {
    context.setLoading(loading);
    assert.ok(classes.has('pointer-events-none'));
    assert.equal(classes.has('opacity-0'), !loading);
    assert.equal(ui.widget['aria-busy'], String(loading));
  }
});

test('moving a connected persistent widget preserves sync; true removal disposes subscriptions', () => {
  const logic = source.slice(source.indexOf('    var observer = new MutationObserver'), source.indexOf('    var lyricsOpen ='));
  let callback, disconnected = false;
  const removed = [], canceled = [];
  const widget = { isConnected: true, parentNode: {} };
  const context = vm.createContext({
    widget, document: { body: {} }, handlers: { 'fm:play-state': () => {}, 'fm:translation-preference': () => {} },
    window: { removeEventListener(name) { removed.push(name); } },
    local: { scrollTimeout: 123, vs: { scrollRaf: 456 } },
    clearTimeout(value) { canceled.push(value); }, cancelAnimationFrame(value) { canceled.push(value); },
    MutationObserver: class { constructor(fn) { callback = fn; } observe() {} disconnect() { disconnected = true; } },
  });
  vm.runInContext(logic, context);
  const mutation = [{ removedNodes: [{ contains: node => node === widget }] }];
  callback(mutation); assert.equal(removed.length, 0); assert.equal(disconnected, false);
  widget.isConnected = false; callback(mutation);
  assert.deepEqual(removed, ['fm:play-state', 'fm:translation-preference']);
  assert.deepEqual(canceled, [123, 456]); assert.equal(disconnected, true);
});

test('room and manager retain the authored song order and default list mode', () => {
  const azure = JSON.parse(read('src/data/azure-content.json'));
  const names = ['旅人の唄', '芽吹の唄', 'spiral', '祈り、終われば', 'かげくらべの唄', 'ムスビメ (联结)', '守りたいもの（想要守护之物）', '決意の唄', '風と行く道 (随风而行的路)', 'たぶん (大概)', '下一次爱情来的时候'];
  assert.deepEqual(musicLibrary(azure.playlist).map(track => track.name), names);
  const config = read('src/config/musicConfig.ts');
  assert.match(config, /playMode: "list"/);
  assert.doesNotMatch(config, /\.sort\(|\.reverse\(/);
});

test('listening room cover is not obscured by a decorative spindle dot', () => {
  const css = read('src/styles/music-room.css');
  const spindle = css.split('\n').filter(line => line.includes('.music-record>div::after'));
  assert.equal(spindle.length, 1);
  assert.ok(spindle[0].startsWith('[data-player-variant="foyer"]'));
  assert.doesNotMatch(spindle[0], /data-player-variant="room"/);
});
