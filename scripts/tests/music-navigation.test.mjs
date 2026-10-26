import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../../src/scripts/music-room.js', import.meta.url), 'utf8');
// Execute the actual transition controller, without mounting audio or the page UI.
const controller = source.slice(source.indexOf('// A view/controller'), source.indexOf('function applyFilter('));
function mount({ enabled = true, rememberScroll = true, reduced = false, offscreen = false } = {}) {
  const scrolls = [];
  const options = { enabled, rememberScroll };
  const currentPage = { dataset: { musicPage:'foyer', musicTransition:JSON.stringify(options) }, querySelector:() => offscreen ? { getBoundingClientRect:() => ({ bottom:-1, top:-30, width:100 }) } : null };
  const window = { scrollY:824, location:{ pathname:'/music/' }, scrollTo:position => scrolls.push(position.top) };
  const context = { window, document:{ querySelector:() => currentPage }, matchMedia:() => ({ matches:reduced }), innerHeight:900 };
  vm.createContext(context);
  vm.runInContext(controller, context);
  const visit = (pathname, page) => {
    window.location.pathname = pathname;
    currentPage.dataset.musicPage = page;
    context.completeTransfer();
  };
  const capture = (returning, hash = '') => context.captureRecord({ hasAttribute:() => returning, pathname:returning ? '/music/' : '/music/room/', hash });
  return { context, currentPage, window, scrolls, visit, capture };
}

test('navbar and history visits to music leave the router content position untouched', () => {
  const app = mount();
  app.visit('/music/', 'foyer');
  assert.deepEqual(app.scrolls, []);
  // A remembered old position must not override a later navbar visit either.
  app.capture(false);
  app.visit('/music/room/', 'room');
  app.visit('/about/', undefined);
  app.visit('/music/', 'foyer');
  assert.deepEqual(app.scrolls, [0]);
});

test('explicit return restores foyer position independently of animation availability', () => {
  for (const setting of [{}, { enabled:false }, { reduced:true }, { offscreen:true }]) {
    const app = mount(setting);
    app.capture(false);
    app.visit('/music/room/', 'room');
    app.capture(true);
    app.visit('/music/', 'foyer');
    assert.deepEqual(app.scrolls, [0, 824]);
    app.visit('/music/', 'foyer');
    assert.deepEqual(app.scrolls, [0, 824], 'intent is consumed once');
  }
});

test('direct room entry without a saved foyer position and disabled memory respect router scroll', () => {
  const direct = mount();
  direct.currentPage.dataset.musicPage = 'room';
  direct.capture(true);
  direct.visit('/music/', 'foyer');
  assert.deepEqual(direct.scrolls, []);
  const disabled = mount({ rememberScroll:false });
  disabled.capture(false);
  disabled.visit('/music/room/', 'room');
  disabled.capture(true);
  disabled.visit('/music/', 'foyer');
  assert.deepEqual(disabled.scrolls, [0]);
});

test('explicit anchors and unrelated destinations are not reset by a pending transition', () => {
  const app = mount();
  app.capture(false, '#library');
  app.visit('/music/room/', 'room');
  app.capture(true, '#section');
  app.visit('/music/', 'foyer');
  app.capture(false);
  app.visit('/about/', undefined);
  app.visit('/music/room/', 'room');
  assert.deepEqual(app.scrolls, []);
});

test('aborted or failed navigation clears its pending scroll intent', () => {
  const app = mount();
  app.capture(false);
  app.context.cancelTransfer();
  app.visit('/music/room/', 'room');
  app.capture(true);
  app.context.cancelTransfer();
  app.visit('/music/', 'foyer');
  assert.deepEqual(app.scrolls, []);
  for (const hook of ['visit:abort', 'fetch:error'])
    assert.ok(source.includes(`hooks.on('${hook}',cancelTransfer)`));
});
