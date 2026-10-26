import assert from 'node:assert/strict';
import test from 'node:test';
import {createMarkdownProcessor} from '@astrojs/markdown-remark';
import rehypeMomentGallery from '../../src/lib/moment-gallery.mjs';

const render=async(body,path='/project/src/content/dynamic/test.md')=>{
	const processor=await createMarkdownProcessor({rehypePlugins:[rehypeMomentGallery]});
	return (await processor.render(body,{fileURL:new URL('file://'+path)})).code;
};
test('moments group consecutive images in compact one/two/four/nine-image layouts with captions',async()=>{
	for(const count of [1,2,3,4,6,9,12]){
		const html=await render('Text\n'+Array.from({length:count},(_,i)=>`![Photo ${i}](/${i}.jpg "Caption ${i}")`).join('\n'));
		assert.match(html,new RegExp(`data-count="${count}"`));
		assert.ok(html.includes(`--moment-columns:${count===1?1:count===2||count===4?2:3}`));
		assert.equal((html.match(/data-fancybox="moment-test"/g)||[]).length,count);
		assert.ok(html.includes('Text'));assert.ok(html.includes('/0.jpg'));
	}
});
test('prose splits image groups; article image rendering stays unchanged',async()=>{
	const body='Before\n\n![One](/1.jpg)\n\n![Two](/2.jpg)\n\nBetween\n\n![Three](/3.jpg)\n\nAfter';
	const html=await render(body);
	assert.equal((html.match(/moment-media-grid/g)||[]).length,2);
	assert.ok(html.indexOf('Before')<html.indexOf('/1.jpg'));
	assert.ok(html.indexOf('/2.jpg')<html.indexOf('Between'));
	assert.ok(html.indexOf('Between')<html.indexOf('/3.jpg'));
	assert.ok(html.indexOf('/3.jpg')<html.indexOf('After'));
	assert.doesNotMatch(await render(body,'/project/src/content/posts/article.md'),/moment-media-grid|data-fancybox/);
});
