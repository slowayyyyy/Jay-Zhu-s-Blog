import assert from 'node:assert/strict';
import test from 'node:test';
import {isHeicImage,prepareWebImage} from '../../src/lib/web-image.mjs';

const heic=(name='photo.heic',type='image/heic')=>new File([new Uint8Array([0,0,0,24]),'ftypheic',new Uint8Array(20)],name,{type});
test('HEIC detection handles missing metadata and leaves AVIF and actual JPEG pixels alone',async()=>{
	assert.equal(await isHeicImage(heic()),true);
	assert.equal(await isHeicImage(heic('clipboard','application/octet-stream')),true);
	assert.equal(await isHeicImage(new File([new Uint8Array([0,0,0,24]),'ftypavifmif1'],'photo.avif',{type:'image/avif'})),false);
	assert.equal(await isHeicImage(new File([new Uint8Array([255,216,255,224])],'photo.heic',{type:'image/jpeg'})),false);
});
test('small HEIC files convert to real JPEG filenames and failed decodes cannot fall back to uploading HEIC',async()=>{
	const original=heic();let calls=0;
	const converted=await prepareWebImage(original,async source=>{calls++;assert.equal(source,original);return new Blob([new Uint8Array([255,216,255])],{type:'image/jpeg'});});
	assert.equal(calls,1);assert.equal(converted.name,'photo.jpg');assert.equal(converted.type,'image/jpeg');assert.equal(original.name,'photo.heic');
	for(const decode of [async()=>{throw Error('unsupported');},async()=>new Blob([],{type:'image/jpeg'}),async()=>new Blob(['not JPEG'],{type:'image/heic'})])await assert.rejects(prepareWebImage(original,decode),/heic_conversion_failed/);
	const png=new File([new Uint8Array([137,80,78,71])],'screenshot.png',{type:'image/png'});
	assert.equal(await prepareWebImage(png,async()=>assert.fail('must not load HEIC decoder')),png);
});
