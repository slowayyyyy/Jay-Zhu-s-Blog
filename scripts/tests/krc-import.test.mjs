import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const root = new URL('../../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const key = [64,71,97,119,94,50,116,71,81,54,49,45,206,210,110,105];
const rows = [
  '[0,500]<0,500,0>Song - Artist',
  '[500,500]<0,500,0>Lyrics by：Writer',
  '[1000,500]<0,500,0>Composed by：Composer',
  '[1500,500]<0,200,0>Hello <200,300,0>world',
  '[2000,500]<0,500,0> ',
  '[2500,500]<0,500,0>Again',
];
function convert(language) {
  const directory = mkdtempSync(join(tmpdir(), 'canglan-krc-test-'));
  try {
    const metadata = ['[ti:Song]', '[ar:Artist]', '[offset:100]'];
    if (language !== undefined) metadata.push('[language:' + Buffer.from(JSON.stringify(language)).toString('base64') + ']');
    const compressed = deflateSync(Buffer.from([...metadata,...rows].join('\n')));
    for (let i=0;i<compressed.length;i++) compressed[i] ^= key[i % key.length];
    const input = join(directory,'input.krc'), output = join(directory,'output.json');
    writeFileSync(input,Buffer.concat([Buffer.from('krc1'),compressed]));
    execFileSync(process.execPath,[fileURLToPath(new URL('scripts/convert-krc.mjs',root)),input,output]);
    return JSON.parse(readFileSync(output,'utf8'));
  } finally { rmSync(directory,{recursive:true,force:true}); }
}

test('embedded translations align before English credits and empty rows are removed', () => {
  const result = convert({content:[{type:1,language:0,lyricContent:[[' '],[' '],[' '],['你好','世界'],[' '],['再来一次']]}]});
  assert.deepEqual(result.lines.map(line=>line.text),['Hello world','Again']);
  assert.deepEqual(result.lines.map(line=>line.translation),['你好世界','再来一次']);
  assert.deepEqual(result.lines.map(line=>line.time),[1.6,2.6]);
  assert.equal(result.lines[0].words[1].start,1.8);
  assert.equal(result.lines[0].words[1].duration,.3);
});

test('missing or mismatched translation tables never guess a shifted pairing', () => {
  for(const metadata of [undefined,{content:[{type:1,lyricContent:[['不能错配']]}]}]){
    const result = convert(metadata);
    assert.equal(result.lines.length,2);
    assert.ok(result.lines.every(line=>!Object.hasOwn(line,'translation')));
  }
});

test('Innocence keeps all timed words, supplied Chinese translations and original cover pixels', () => {
  const data = JSON.parse(read('src/data/azure-content.json'));
  const track = data.playlist.find(item=>item.id==='avril-innocence');
  assert.equal(data.playlist.at(-1),track);
  assert.equal(track.name,'Innocence'); assert.equal(track.artist,'Avril Lavigne');
  assert.equal(track.src,'/media/audio/20261020-avril-innocence.mp3');
  const lyrics = JSON.parse(read('public'+track.lrc));
  assert.equal(lyrics.format,'karaoke-v1'); assert.equal(lyrics.lines.length,61);
  assert.deepEqual(track.translations,lyrics.lines.map(line=>line.translation));
  assert.ok(track.translations.every(Boolean));
  assert.equal(lyrics.lines[0].text,'Waking up I see that everything is ok');
  assert.equal(lyrics.lines.at(-1).text,"Don't you let it pass you by");
  for (const [index,line] of lyrics.lines.entries()) {
    assert.ok(line.time >= 0 && line.end > line.time && line.end <= 233.039);
    if(index) assert.ok(line.time >= lyrics.lines[index-1].time);
    assert.ok(line.words.length>0);
    assert.equal(line.words.map(word=>word.text).join('').trim(),line.text);
    assert.ok(line.words.every(word=>word.start>=line.time&&word.start<line.end&&word.duration>=0));
    assert.doesNotMatch(line.text,/^(?:Lyrics by|Composed by)/i);
  }
  const svg = read('public'+track.cover);
  const embedded = Buffer.from(svg.match(/href="data:image\/png;base64,([^"]+)"/)[1],'base64');
  const originalPath = '/assets/images/music-covers/12-avril-innocence-original.png';
  assert.ok(embedded.equals(readFileSync(new URL('public'+originalPath,root))));
  assert.match(svg,/viewBox="87 48 354 354"/); assert.match(svg,/<circle cx="264" cy="225" r="177"/);
  assert.doesNotMatch(svg,/<script|https?:\/\/(?!www\.w3\.org)/);
  const assets = JSON.parse(read('src/data/media-library.json')).assets;
  assert.ok(assets.some(asset=>asset.src===track.cover));
  assert.ok(assets.some(asset=>asset.src===originalPath));
});
