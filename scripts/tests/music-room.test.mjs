import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { musicLibrary, selectTracks, cropStyle, listeningNotes } from '../../src/lib/music-library.mjs';
const root = new URL('../../',import.meta.url);
const read = path=>readFileSync(new URL(path,root),'utf8');
const azure=JSON.parse(read('src/data/azure-content.json'));
const room=JSON.parse(read('src/data/music-room.json'));
const library=musicLibrary(azure.playlist);

test('room navigation uses its own width budget and collapses by shell width, not the reading column',()=>{
 const css=read('src/styles/music-room.css');
 const navigation=css.match(/body\.sticky-navbar:has\(\[data-music-page="room"\]\) #top-row\s*\{([^}]+)\}/)?.[1];
 assert.ok(navigation);
 assert.match(navigation,/max-width:none!important/);
 assert.doesNotMatch(navigation,/1200px/);
 assert.match(css,/container:music-navigation \/ inline-size/);
 assert.match(css,/@container music-navigation \(max-width:1440px\)/);
 assert.match(css,/\.nav-actions\s*\{ grid-column:2;/);
 assert.match(css,/#main-content-shell>div\s*\{[^}]*max-width:1200px/);
});

test('song notes are maintained beside the song; archived data does not become live again',()=>{
 const songs=[{id:'a',src:'/a',name:'A',note:{text:'First'}},{id:'b',src:'/b',name:'B',note:{title:'B note',text:'Second'}},{id:'empty',src:'/c',note:{text:'  '}},{id:'off',src:'',note:{text:'Inactive'}}];
 assert.deepEqual(listeningNotes(musicLibrary(songs)).map(n=>[n.id,n.index,n.title]),[['a',0,'A'],['b',1,'B note']]);
 assert.deepEqual(listeningNotes(musicLibrary([songs[1],songs[0]])).map(n=>[n.id,n.index]),[['b',0],['a',1]]);
 assert.deepEqual(listeningNotes(musicLibrary([{...songs[0],note:{text:''}}])),[]);
 for(const old of room.notes){
  const track=azure.playlist.find(t=>t.id===old.track);
  assert.deepEqual(track.note,{title:old.title,text:old.text,example:old.example});
 }
 const template=read('src/pages/music/room/index.astro');
 assert.match(template,/const notes = listeningNotes\(library\)/);
 assert.match(template,/data-current-note/);
 assert.match(template,/<details class="notes-archive"/);
 assert.doesNotMatch(template,/const notes = room.notes/);
 assert.match(read('public/admin/config.yml'),/正文留空则不显示/);
});

test('current song changes update one note safely; absent notes hide the whole section',()=>{
 const source=read('src/scripts/music-room.js');
 const logic=source.slice(source.indexOf('function syncCurrentNote('),source.indexOf('function syncPlaying('));
 const entries=[{index:0,name:'A',artist:'Artist',title:'Note A',text:'<script>literal text</script>',cover:'/a.png',example:true},{index:2,name:'C',artist:'Other',title:'Note C',text:'Body C',cover:'',example:false}];
 const parts=Object.fromEntries(['song','title','text','example','cover'].map(key=>['[data-note-'+key+']',{hidden:false,removeAttribute(k){delete this[k];}}]));
 const section={dataset:{noteEntries:JSON.stringify(entries)},querySelector:s=>parts[s]};
 const root={querySelector:()=>section};
 const context={};vm.createContext(context);vm.runInContext(logic,context);
 context.syncCurrentNote(root,0);
 assert.equal(section.hidden,false);assert.equal(parts['[data-note-text]'].textContent,entries[0].text);
 assert.equal(parts['[data-note-cover]'].src,'/a.png');
 context.syncCurrentNote(root,1);assert.equal(section.hidden,true);
 context.syncCurrentNote(root,2);assert.equal(section.hidden,false);
 assert.equal(parts['[data-note-title]'].textContent,'Note C');assert.equal(parts['[data-note-cover]'].hidden,true);
 assert.equal(parts['[data-note-example]'].hidden,true);
 context.syncCurrentNote(null,0);
 section.dataset.noteEntries='broken';context.syncCurrentNote(root,0);assert.equal(section.hidden,true);
 assert.match(source,/syncCurrentNote\(page\(\), state.currentIndex\)/);
 assert.match(source,/'fm:init','fm:track','fm:play-state'/);
});

test('all-notes search filters text and names without changing playback',()=>{
 const source=read('src/scripts/music-room.js');
 const logic=source.slice(source.indexOf('function filterNoteArchive('),source.indexOf('function syncPlaying('));
 const rows=[{dataset:{noteSearchText:'a artist ocean'},open:true},{dataset:{noteSearchText:'b other forest'},open:true}];
 const search={value:' Ocean '};const empty={hidden:true};
 const root={querySelector:s=>s==='[data-note-search]'?search:empty,querySelectorAll:()=>rows};
 const context={};vm.createContext(context);vm.runInContext(logic,context);
 context.filterNoteArchive(root);assert.equal(rows[0].hidden,false);assert.equal(rows[1].hidden,true);assert.equal(rows[1].open,false);assert.equal(empty.hidden,true);
 search.value='nothing';context.filterNoteArchive(root);assert.equal(empty.hidden,false);
 search.value='';context.filterNoteArchive(root);assert.ok(rows.every(r=>!r.hidden));
 assert.doesNotMatch(logic,/playTrack|togglePlay|\.init\(/);
});

test('fixed song references survive reorder and audio replacement; inactive songs are not played',()=>{
 const songs=[{id:'a',name:'A',src:'/a'},{id:'b',name:'B',src:'/b'},{id:'disabled',name:'C',src:''}];
 const original=musicLibrary(songs);
 const reordered=musicLibrary([{...songs[1],src:'/new-audio'},songs[0],songs[2]]);
 assert.deepEqual(selectTracks(original,['b','a','b','gone']).map(t=>t.id),['b','a']);
 assert.deepEqual(selectTracks(reordered,['b','a']).map(t=>t.index),[0,1]);
 assert.deepEqual(musicLibrary(null),[]);
 assert.deepEqual(selectTracks(library,[]),[]);
});

test('all configured selections and production images resolve; no authored media is duplicated',()=>{
 const ids=library.map(t=>t.id);
 assert.equal(ids.length,new Set(ids).size);
 const selected=[...room.foyer.tracks,...room.collections.flatMap(c=>c.tracks),...room.notes.map(n=>n.track)];
 for(const id of selected)assert.ok(ids.includes(id),id);
 for(const crop of [room.headerImage,room.player.recordImage,room.player.tonearmImage,...room.collections.map(c=>c.cover)])
  assert.ok(existsSync(new URL('public'+crop.src,root)),crop.src);
 const source=read('src/scripts/music-room.js');
 assert.doesNotMatch(source,/new Audio|createElement\(['"]audio|\.loadTrack\(/);
 assert.match(source,/prefers-reduced-motion/);
});

test('CMS exposes every room setting and retains the incumbent audio widget',()=>{
 const yaml=createRequire(import.meta.resolve('astro/package.json'))('yaml');
 const config=yaml.parse(read('public/admin/config.yml'));
 const settings=config.collections.find(c=>c.name==='site_settings').files;
 const fields=settings.find(f=>f.name==='music_room').fields;
 const verify=(data,fields)=>{
  for(const [key,value] of Object.entries(data)){
   const field=fields.find(f=>f.name===key);
   assert.ok(field,'missing CMS field: '+key);
   if(field.widget==='object')verify(value,field.fields);
   if(field.widget==='list'&&field.fields)for(const item of value)verify(item,field.fields);
  }
 };
 const data=structuredClone(room);delete data.headerImage.alt; // crop controls own source, zoom and focus
 delete data.player.recordImage;
 delete data.player.tonearmImage;
 for(const field of ['headerImage'])delete data[field];
 data.collections=data.collections.map(({cover,...collection})=>collection);
 verify(data,fields);
 const azureFields=settings.find(f=>f.name==='azure').fields;
 const playlist=azureFields.find(f=>f.name==='playlist');
 assert.equal(playlist.fields.find(f=>f.name==='src').widget,'r2-audio');
 assert.equal(playlist.fields.find(f=>f.name==='id').widget,'hidden');
 assert.equal(playlist.fields.find(f=>f.name==='note').widget,'object');
 assert.equal(playlist.fields.find(f=>f.name==='note').fields.find(f=>f.name==='text').widget,'text');
 assert.equal(fields.find(f=>f.name==='notes').widget,'hidden');
 assert.equal(fields.find(f=>f.name==='headerImage').widget,'hidden');
 const appearance=fields.find(f=>f.name==='appearance').fields;
 assert.equal(appearance.find(f=>f.name==='backgroundImage').widget,'image-crop');
 assert.equal(appearance.find(f=>f.name==='darkBackgroundImage').widget,'image-crop');
 assert.equal(appearance.find(f=>f.name==='recordSize').widget,'select');
});

test('song picker preserves unresolved ids until explicit removal, filters names, and supports single selection',()=>{
 let source=read('src/scripts/admin-music-picker.js').replace(/^import .*;\n/gm,'').replace('export function','function');
 let control;
 const context={window:{CMS:{registerWidget:(name,c)=>{assert.equal(name,'music-track-picker');control=c;}},createClass:value=>value,h:(tag,props,...children)=>({tag,props,children})},musicLibrary:()=>library,azureContent:azure};
 vm.runInNewContext(source+';setupMusicPicker()',context);
 const changes=[];
 const instance={props:{value:['gone',library[0].id],field:{get:()=>true},onChange:value=>changes.push(value)},state:{query:'',tracks:library,error:''}};
 const tree=control.render.call(instance);
 const flatten=node=>node&&typeof node==='object'?[node,...(node.children||[]).flatMap(flatten)]:[];
 const nodes=flatten(tree);
 assert.ok(nodes.some(n=>n.children?.some(c=>typeof c==='string'&&c.includes('暂未找到'))));
 const checkbox=nodes.find(n=>n.tag==='input'&&n.props.type==='checkbox');
 checkbox.props.onChange();
 assert.deepEqual(Array.from(changes[0]),['gone']);
 instance.props.field={get:()=>false};instance.props.value='';
 const single=flatten(control.render.call(instance)).find(n=>n.tag==='input'&&n.props.type==='radio');
 single.props.onChange();
 assert.equal(changes[1],library[0].id);
});

test('crop rendering clamps untrusted values and handles cleared optional images',()=>{
 assert.match(cropStyle({positionX:999,positionY:-1,zoom:8}),/100% 0%;transform:scale\(3\)/);
 assert.match(cropStyle(null),/50% 50%/);
});

test('lyrics preference survives remounts; collapsed drawers are inert and restore focus',()=>{
 const source=read('src/components/features/MusicPlayer.astro');
 const logic=source.slice(source.indexOf('    function setDrawer('),source.indexOf('    // ── Playlist virtual scroll listener'));
 const init=source.slice(source.indexOf('    var lyricsOpen ='),source.indexOf('    // ── Init: either sync'));
 const saved=new Map();const events={};
 const window={dispatchEvent:event=>events[event.type]?.forEach(fn=>fn(event))};
 const document={activeElement:null};
 const element=()=>({inert:true,style:{},attrs:{},classes:new Set(),listeners:{},classList:{toggle(){}},setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];},contains(el){return el===this.child;},focus(){document.activeElement=this;},addEventListener(k,fn){this.listeners[k]=fn;}});
 const mount=(variant='room')=>{
  const ui=Object.fromEntries(['lrcDrawer','btnLrc','playlistDrawer','btnDrawer','iconLrcOn','iconLrcOff'].map(k=>[k,element()]));
  const context={window,document,ui,widget:{dataset:{playerVariant:variant}},cfg:{showLyrics:true,openLyrics:variant==='room'},local:{vs:{playlist:[]}},localStorage:{getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)},CustomEvent:class{constructor(type,args){this.type=type;this.detail=args.detail;}},on:(name,fn)=>(events[name]??=[]).push(fn)};
  vm.runInNewContext(logic+init,context);return ui;
 };
 const first=mount();assert.equal(first.lrcDrawer.inert,false);assert.equal(saved.size,0);
 first.lrcDrawer.child={};document.activeElement=first.lrcDrawer.child;
 first.btnLrc.listeners.click();
 assert.equal(first.lrcDrawer.inert,true);assert.equal(first.btnLrc.attrs['aria-expanded'],'false');
 assert.equal(document.activeElement,first.btnLrc);assert.equal(saved.get('music-player-lyrics-open'),'false');
 const next=mount();assert.equal(next.lrcDrawer.inert,true);
 next.btnLrc.listeners.click();assert.equal(first.lrcDrawer.inert,false);
 assert.equal(mount('foyer').lrcDrawer.inert,false);assert.equal(mount('mini').lrcDrawer.inert,true);
 next.btnDrawer.listeners.click();assert.equal(next.playlistDrawer.inert,false);assert.equal(next.lrcDrawer.inert,true);
 next.btnDrawer.listeners.click();assert.equal(next.playlistDrawer.inert,true);
 assert.match(source,/aria-controls=\{`\$\{widgetId\}-lyrics`\}/);
});
