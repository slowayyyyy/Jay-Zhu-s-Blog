import assert from 'node:assert/strict';
import test from 'node:test';
import {momentPreviewSegments,setupMomentPreview} from '../../src/scripts/admin-moment-preview.js';

test('CMS moment preview keeps the native editor and stored Markdown, using the frontend CSS and grouping',()=>{
	const control={},preview={};const registered={};
	const CMS={getWidget:name=>{assert.equal(name,'markdown');return {control,preview};},registerPreviewStyle:(css,options)=>registered.styles={css,options},registerWidget:(name,editor,render)=>Object.assign(registered,{name,editor,render})};
	const h=(type,props,...children)=>({type,props,children});
	setupMomentPreview({CMS,h,styles:'shared rules'});
	assert.equal(registered.name,'moment-markdown');assert.equal(registered.editor,control);
	assert.deepEqual(registered.styles,{css:'shared rules',options:{raw:true}});
	const props={value:'Original **Markdown**',onChange:()=>{throw Error('preview cannot edit content');}};
	const tree=registered.render(props);assert.equal(tree.props.className,'dynamic-content');assert.equal(tree.children[0].type,preview);
	assert.equal(props.value,'Original **Markdown**');assert.equal(tree.children[0].props.value,props.value);
	const gallery=registered.render({value:'![alt](/photo.jpg "Caption")',getAsset:()=>({toString:()=>'/resolved.jpg'})}).children[0];
	assert.equal(gallery.children[0].children[0].props.src,'/resolved.jpg');
	assert.equal(gallery.children[0].children[1].children[0],'Caption');
});

test('CMS preview shares frontend one/two/four/nine-image layouts, keeps captions, prose and image order',()=>{
	for(const count of [1,2,3,4,9,12]){
		const body='Before **bold**\n\n'+Array.from({length:count},(_,i)=>`![Image ${i} | lg | center](/${i}.jpg "Caption ${i}")`).join('\n\n');
		const pieces=momentPreviewSegments(body),gallery=pieces[1];
		assert.equal(pieces[0].value,'Before **bold**\n\n');assert.equal(gallery.properties['data-count'],count);
		assert.equal(gallery.properties.style,`--moment-columns:${count===1?1:count===2||count===4?2:3}`);
		assert.deepEqual(gallery.children.map(f=>f.children[0].properties.src),Array.from({length:count},(_,i)=>`/${i}.jpg`));
		assert.deepEqual(gallery.children.map(f=>f.children[1].children[0].value),Array.from({length:count},(_,i)=>`Caption ${i}`));
		assert.equal(gallery.children[0].children[0].properties.alt,'Image 0');
	}
	const pieces=momentPreviewSegments('![One](/1.jpg)\n\nBetween\n\n![Two](/2.jpg)');
	assert.equal(pieces.length,3);assert.equal(pieces[1].value,'\n\nBetween\n\n');
	assert.equal(momentPreviewSegments('```md\n![code](/not-image.jpg)\n```')[0].type,'text');
});
