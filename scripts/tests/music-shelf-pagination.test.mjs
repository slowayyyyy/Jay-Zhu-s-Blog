import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import {coverFocusStyle} from '../../src/lib/music-library.mjs';
import {roomPresentation} from '../../src/lib/music-room-settings.mjs';
const source = readFileSync(new URL('../../src/scripts/music-room.js',import.meta.url),'utf8');
const logic = source.slice(source.indexOf('function librarySlice('),source.indexOf('function syncCurrentNote('));

function mount(tracks,size=6){
 const controls={previous:{},next:{},status:{},select:{options:[],replaceChildren(...children){this.options=children;}}};
 const pager={querySelector:key=>({'[data-library-previous]':controls.previous,'[data-library-next]':controls.next,'[data-library-page-status]':controls.status,'[data-library-page-select]':controls.select}[key])};
 const search={value:''},empty={};
 const rows=tracks.map((name,index)=>({dataset:{songIndex:String(index),songSearchText:name},hidden:false}));
 const root={querySelector:key=>({'[data-song-search]':search,'[data-library-page-size]':{dataset:{libraryPageSize:String(size)}},'[data-library-pagination]':pager,'[data-library-empty]':empty,'.library-songs':{scrollTo(){}}}[key]),querySelectorAll:()=>rows};
 const context={page:()=>root,filter:null,libraryPageIndex:0,document:{createElement:()=>({})}};
 vm.createContext(context);vm.runInContext(logic,context);
 return {context,search,empty,rows,pager,controls,visible:()=>rows.filter(r=>!r.hidden).map(r=>Number(r.dataset.songIndex))};
}

test('large libraries stay bounded and page boundaries preserve original indices',()=>{
 const a=mount(Array.from({length:1000},(_,i)=>`song ${i}`));
 a.context.applyFilter();assert.deepEqual(a.visible(),[0,1,2,3,4,5]);assert.equal(a.controls.previous.disabled,true);assert.equal(a.controls.select.options.length,167);
 a.context.libraryPageIndex=1;a.context.applyFilter();assert.deepEqual(a.visible(),[6,7,8,9,10,11]);
 a.context.libraryPageIndex=999;a.context.applyFilter();assert.deepEqual(a.visible(),[996,997,998,999]);assert.equal(a.controls.next.disabled,true);assert.equal(a.context.libraryPageIndex,166);
});

test('search and collections run over the full library before paging and reset stale pages',()=>{
 const names=Array.from({length:14},(_,i)=>`song ${i}`);names[12]='流沙 陶喆';names[13]='普通朋友 陶喆';
 const a=mount(names);a.context.libraryPageIndex=2;a.context.applyFilter();assert.deepEqual(a.visible(),[12,13]);
 a.search.value=' 陶喆 ';a.context.applyFilter(true);assert.deepEqual(a.visible(),[12,13]);assert.equal(a.context.libraryPageIndex,0);assert.equal(a.pager.hidden,true);
 a.search.value='';a.context.filter=[13,0,8,3,7,2,10];a.context.applyFilter(true);assert.deepEqual(a.visible(),[0,2,3,7,8,10]);
 a.context.libraryPageIndex=1;a.context.applyFilter();assert.deepEqual(a.visible(),[13]);
 a.search.value='not found';a.context.applyFilter(true);assert.deepEqual(a.visible(),[]);assert.equal(a.empty.hidden,false);assert.equal(a.pager.hidden,true);
 a.search.value='';a.context.filter=null;a.context.applyFilter(true);assert.deepEqual(a.visible(),[0,1,2,3,4,5]);assert.equal(a.empty.hidden,true);
 assert.doesNotMatch(logic,/playTrack|togglePlay|new Audio|\.init\(/);
});

test('configurable page sizes and invalid older inputs have safe bounds',()=>{
 for(const size of [6,12,18,24]){const a=mount(Array(100).fill('song'),size);a.context.applyFilter();assert.equal(a.visible().length,size);}
 assert.equal(roomPresentation().libraryPageSize,6);
 assert.equal(roomPresentation({appearance:{libraryPageSize:'12'}}).libraryPageSize,12);
 for(const value of [0,-1,Infinity,10000,'broken'])assert.equal(roomPresentation({appearance:{libraryPageSize:value}}).libraryPageSize,6);
 const a=mount(Array(100).fill('song'),10000);a.context.applyFilter();assert.equal(a.visible().length,6);
});

test('cover framing scales inside a mask with a movable focal origin and safe CMS defaults',()=>{
 assert.equal(coverFocusStyle(),'object-position:50% 50%;transform:scale(1);transform-origin:50% 50%');
 assert.match(coverFocusStyle({zoom:1.45,positionX:0,positionY:75}),/scale\(1\.45\);transform-origin:0% 75%/);
 assert.equal(coverFocusStyle({zoom:'broken',positionX:'',positionY:null}),coverFocusStyle());
 assert.match(coverFocusStyle({zoom:20,positionX:-10,positionY:400}),/object-position:0% 100%;transform:scale\(2\)/);
});
