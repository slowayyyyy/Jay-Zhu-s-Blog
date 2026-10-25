import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import {roomPresentation} from '../../src/lib/music-room-settings.mjs';
const root = new URL('../../',import.meta.url);
const read = path=>readFileSync(new URL(path,root),'utf8');
const room = JSON.parse(read('src/data/music-room.json'));

test('presentation accepts older settings and clamps malformed CMS numbers',()=>{
 assert.equal(roomPresentation().recordSize,440);
 assert.equal(roomPresentation({appearance:{recordSize:'',lyricHeight:'invalid',backgroundOpacity:200,darkBackgroundOpacity:-10,lyricFontSize:100,miniMode:'broken'},labels:{lyrics:'',focus:'静听'}}).lyricHeight,380);
 const value=roomPresentation({appearance:{recordSize:900,backgroundOpacity:-1,lyricFontSize:'28',showSleeve:false,miniMode:'always'},labels:{lyrics:'',focus:'静听'}});
 assert.equal(value.recordSize,520);assert.equal(value.backgroundOpacity,0);assert.equal(value.lyricFontSize,28);
 assert.equal(value.showSleeve,false);assert.equal(value.labels.lyrics,'歌词');assert.equal(value.labels.focus,'静听');assert.equal(value.miniMode,'always');
 assert.equal(roomPresentation({appearance:{miniMode:'broken'}}).miniMode,'auto');
 const desktop={src:'/image',positionX:42};
 assert.deepEqual(roomPresentation({appearance:{backgroundImage:desktop,mobileBackgroundImage:{src:''}}}).mobileBackgroundImage,desktop);
});

test('new room materials are local, indexed, and retain real song metadata',()=>{
 const media=JSON.parse(read('src/data/media-library.json'));
 const serialized=JSON.stringify(media);
 for(const key of ['backgroundImage','mobileBackgroundImage']){
  const src=room.appearance[key].src;
  assert.ok(existsSync(new URL('public'+src,root)),src);
  assert.ok(serialized.includes(src),'asset must be available in CMS library');
 }
 const template=read('src/pages/music/room/index.astro');
 assert.match(template,/src=\{track.cover\}/);
 assert.match(template,/\{track.artist\}/);
 assert.doesNotMatch(read('src/scripts/music-room.js'),/new Audio|createElement\(['"]audio/);
});

function fixture(miniMode='auto'){
 const source=read('src/scripts/music-room.js');
 const logic=source.slice(source.indexOf('function syncRoomPanel('),source.indexOf('// Incumbent wallpaper'));
 const events=new Map(),windowEvents=new Map(),scrolls=[];let bottom=500;
 const button=()=>({attrs:{},setAttribute(k,v){this.attrs[k]=v;}});
 const tabs=['lyrics','note'].map(roomTab=>({...button(),dataset:{roomTab}}));
 const lyrics={getAttribute:()=> 'false'};
 const notes={},reopen={},missing={},current={hidden:false},nav={inert:false};
 const mini={...button(),contains:()=>false};
 const controls={getBoundingClientRect:()=>({bottom})};
 const selectors={'#music-room-player .lrc-drawer':lyrics,'[data-room-note-panel],#room-note-panel':notes,'[data-room-reopen]':reopen,'[data-note-missing]':missing,'[data-current-note]':current,'#music-room-player .music-controls':controls,'[data-room-mini]':mini};
 const page={dataset:{musicPage:'room',roomPanel:'lyrics',roomOptions:JSON.stringify({miniMode})},querySelector:s=>selectors[s],querySelectorAll:()=>tabs,addEventListener:(k,f)=>events.set(k,f),removeEventListener:k=>events.delete(k)};
 const observers=[];
 class Observer {constructor(fn){this.fn=fn;observers.push(this);}observe(){}disconnect(){this.disconnected=true;}}
 const context={page:()=>page,document:{getElementById:()=>nav},window:{scrollY:320,scrollTo:value=>scrolls.push(value.top),addEventListener:(k,f)=>windowEvents.set(k,f),removeEventListener:k=>windowEvents.delete(k)},requestAnimationFrame:fn=>fn(),IntersectionObserver:Observer,MutationObserver:Observer,cleanupRoomView:()=>{}};
 vm.createContext(context);vm.runInContext(logic,context);
 return{context,page,tabs,lyrics,notes,reopen,missing,current,nav,mini,observers,events,windowEvents,scrolls,setBottom:v=>{bottom=v;}};
}

test('lyrics and notes expose one accessible panel; missing notes and collapsed lyrics have a recovery state',()=>{
 const f=fixture();f.context.syncRoomPanel(f.page);
 assert.equal(f.lyrics.inert,false);assert.equal(f.notes.hidden,true);assert.equal(f.tabs[0].attrs['aria-selected'],'true');
 f.page.dataset.roomPanel='note';f.context.syncRoomPanel(f.page);
 assert.equal(f.lyrics.inert,true);assert.equal(f.notes.inert,false);assert.equal(f.tabs[1].tabIndex,0);assert.equal(f.missing.hidden,true);
 f.current.hidden=true;f.context.syncRoomPanel(f.page);assert.equal(f.missing.hidden,false);
 f.page.dataset.roomPanel='lyrics';f.lyrics.getAttribute=()=> 'true';f.context.syncRoomPanel(f.page);
 assert.equal(f.lyrics.inert,true);assert.equal(f.reopen.hidden,false);
});

test('automatic mini appears only after main controls pass above viewport and cleans up on navigation',()=>{
 const f=fixture();f.context.setupRoomView();
 assert.equal(f.mini.hidden,true);assert.equal(f.mini.inert,true);
 f.setBottom(1400);f.observers[0].fn();assert.equal(f.mini.hidden,true);
 f.setBottom(80);f.observers[0].fn();assert.equal(f.mini.hidden,false);assert.equal(f.mini.inert,false);
 f.page.dataset.focus='true';f.events.get('room:focus')();assert.equal(f.nav.inert,true);assert.equal(f.mini.hidden,true);
 f.page.isConnected=true;f.events.get('room:focus')();assert.deepEqual(f.scrolls,[0]);
 f.page.dataset.focus='false';f.events.get('room:focus')();assert.deepEqual(f.scrolls,[0,320]);
 f.page.dataset.focus='true';f.events.get('room:focus')();
 f.context.cleanupRoomView();assert.equal(f.nav.inert,false);assert.equal(f.events.size,0);assert.equal(f.windowEvents.size,0);assert.ok(f.observers.every(o=>o.disconnected));
 const always=fixture('always');always.context.setupRoomView();assert.equal(always.mini.hidden,false);
});
