import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import stylus from 'stylus';

const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
// Check the real compiled theme, including Stylus color serialization.
const css = stylus.render(read('src/styles/variables.styl')).replace(/\/\*[\s\S]*?\*\//g, '');
function variables(selector) {
  const values = {};
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (match[1].trim() !== selector) continue;
    for (const declaration of match[2].matchAll(/(--[\w-]+):\s*([^;]+);/g)) values[declaration[1]] = declaration[2].trim();
  }
  return values;
}
const light = variables(':root');
const dark = { ...light, ...variables(':root.dark') };
const rgba = value => value.match(/[\d.]+/g).map(Number);
function oklch(value, hue) {
  const [l, c] = value.match(/[\d.]+/g).map(Number);
  const a = c * Math.cos(hue * Math.PI / 180), b = c * Math.sin(hue * Math.PI / 180);
  const x = (l + .3963377774 * a + .2158037573 * b) ** 3;
  const y = (l - .1055613458 * a - .0638541728 * b) ** 3;
  const z = (l - .0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621*x-3.3077115913*y+.2309699292*z, -1.2684380046*x+2.6097574011*y-.3413193965*z, -.0041960863*x-.7034186147*y+1.707614701*z].map(v => 255 * (v <= .0031308 ? 12.92*v : 1.055*v**(1/2.4)-.055));
}
function luminance(rgb) {
  return rgb.map(v => { const c = Math.max(0, Math.min(255, v)) / 255; return c <= .04045 ? c / 12.92 : ((c+.055)/1.055)**2.4; }).reduce((sum,v,i) => sum + v*[.2126,.7152,.0722][i], 0);
}
function contrast(foreground, background) {
  const alpha = foreground[3] ?? 1;
  const ink = foreground.slice(0,3).map((v,i) => v*alpha+background[i]*(1-alpha));
  const a = luminance(ink), b = luminance(background);
  return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
}

test('regular and deep text switch with the real light/dark theme', () => {
  assert.deepEqual(rgba(light['--content-regular']), [0,0,0,.9]);
  assert.deepEqual(rgba(dark['--content-regular']), [255,255,255,.9]);
  assert.notEqual(dark['--deep-text'], light['--deep-text']);
  assert.ok(dark['--deep-text'].startsWith('oklch(0.93 '));
});

test('default text inherits the theme without overriding component or syntax colors', () => {
  const main = read('src/styles/main.css');
  assert.match(main, /@layer base\s*\{\s*body\s*\{\s*color:\s*var\(--content-regular\);\s*\}\s*\}/);
  assert.doesNotMatch(main, /color:\s*var\(--content-regular\)\s*!important/);
  // The room's distinct ink and transparent karaoke gradient must remain local.
  assert.match(read('src/styles/music-room.css'), /--content-regular:var\(--room-ink\)/);
  assert.match(read('src/components/features/MusicPlayer.astro'), /-webkit-text-fill-color:\s*transparent/);
});

test('primary and secondary theme text exceed 4.5:1 across the hue selector', () => {
  for (let hue = 0; hue < 360; hue += 15) {
    const background = oklch(dark['--card-bg'], hue);
    for (const token of ['--content-regular','--content-meta']) {
      assert.ok(contrast(rgba(dark[token]),background) >= 4.5, `dark ${token} hue ${hue}`);
      assert.ok(contrast(rgba(light[token]),[255,255,255]) >= 4.5, `light ${token}`);
    }
    assert.ok(contrast(oklch(dark['--deep-text'],hue),background) >= 4.5, `deep text hue ${hue}`);
  }
});
