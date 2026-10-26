import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import {recentTracks,rememberTrack} from '../../src/lib/recent-tracks.mjs';
import {roomPresentation} from '../../src/lib/music-room-settings.mjs';
const source=readFileSync(new URL('../../src/scripts/music-room.js',import.meta.url),'utf8');
const filterLogic=source.slice(source.indexOf('function librarySlice('),source.indexOf('function syncCurrentNote('));
const storage=()=>{const values=new Map();return{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};};

test('recent history deduplicates stable IDs, caps at 50, and excludes hidden or removed songs',()=>{
 const saved=storage(),ids=Array.from({length:80},(_,i)=>`song-${i}`);
 for(const id of ids)rememberTrack(saved,id,ids);
 assert.equal(recentTracks(saved,ids).length,50);
 assert.equal(recentTracks(saved,ids)[0],'song-79');
 rememberTrack(saved,'song-45',ids);
 assert.deepEqual(recentTracks(saved,['song-45','song-79','song-1']),['song-45','song-79']);
 assert.deepEqual(rememberTrack(saved,'hidden',['song-79']),['song-79']);
 assert.deepEqual(recentTracks({getItem:()=>'{broken'},ids),[]);
 assert.deepEqual(recentTracks({getItem:()=>'{"x":1}'},ids),[]);
 assert.deepEqual(recentTracks({getItem(){throw Error('blocked');}},ids),[]);
 assert.doesNotThrow(()=>rememberTrack({getItem:()=>null,setItem(){throw Error('quota');}},ids[0],ids));
});

test('drawer search spans a large library, collections and recency without paginating or mutating song indices',()=>{
 const saved=storage(),rows=Array.from({length:1000},(_,i)=>({dataset:{songIndex:String(i),songSearchText:`song ${i}`,trackId:`song-${i}`},style:{}}));
 rows[999].dataset.songSearchText='流沙 陶喆';
 const search={value:''},empty={},recentEmpty={},root={dataset:{libraryScope:'all'},matches:()=>true,querySelector:s=>({'[data-song-search]':search,'[data-library-empty]':empty,'[data-recent-empty]':recentEmpty}[s]),querySelectorAll:()=>rows};
 const context={page:()=>root,filter:null,libraryPageIndex:0,localStorage:saved,recentTracks};
 vm.createContext(context);vm.runInContext(filterLogic,context);
 context.applyFilter();assert.equal(rows.filter(row=>!row.hidden).length,1000);
 search.value='陶喆';context.applyFilter(true);assert.deepEqual(rows.filter(row=>!row.hidden).map(row=>row.dataset.songIndex),['999']);
 search.value='';root.dataset.libraryScope='playlists';context.filter=[999,2];context.applyFilter(true);assert.deepEqual(rows.filter(row=>!row.hidden).map(row=>row.dataset.songIndex),['2','999']);
 root.dataset.libraryScope='recent';context.applyFilter();assert.equal(recentEmpty.hidden,false);
 rememberTrack(saved,'song-999',rows.map(row=>row.dataset.trackId));rememberTrack(saved,'song-2',rows.map(row=>row.dataset.trackId));
 context.applyFilter();assert.equal(recentEmpty.hidden,true);assert.equal(rows[2].style.order,'0');assert.equal(rows[999].style.order,'1');
 root.dataset.libraryScope='all';context.applyFilter();assert.equal(rows.filter(row=>!row.hidden).length,1000);assert.ok(rows.every((row,i)=>Number(row.dataset.songIndex)===i));
});

test('new background settings normalize old/invalid values safely and preserve independent mobile crop',()=>{
 const v=roomPresentation({appearance:{backgroundDim:200,drawerWidth:-1,textColor:'red;display:none',mutedColor:'#c9bdd3',backgroundMotion:false,showRecent:false}});
 assert.equal(v.backgroundDim,85);assert.equal(v.drawerWidth,300);assert.equal(v.textColor,'#f4edf8');assert.equal(v.mutedColor,'#c9bdd3');assert.equal(v.backgroundMotion,false);assert.equal(v.showRecent,false);
 const old=roomPresentation();assert.equal(old.backgroundDim,32);assert.equal(old.drawerOpen,true);assert.equal(old.backgroundMotion,true);
});
