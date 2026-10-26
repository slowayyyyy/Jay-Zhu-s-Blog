const whitespace = node => node.type === 'text' && !node.value.trim();
const textOf = node => node.type === 'text' ? node.value : (node.children || []).map(textOf).join('');
const findImage = node => node.tagName === 'img' ? node : (node.children || []).map(findImage).find(Boolean);

// Existing Markdown image renderers use p/center/figure wrappers. Normalize
// only image-only wrappers, preserving prose, captions and authored ordering.
function figures(node) {
	if (node.type !== 'element') return null;
	if (node.tagName === 'figure' && findImage(node)) return [node];
	if (node.tagName === 'img') {
		const caption=String(node.properties?.title || '').trim();
		return [{type:'element',tagName:'figure',properties:{},children:[node,...(caption ? [{type:'element',tagName:'figcaption',properties:{},children:[{type:'text',value:caption}]}] : [])]}];
	}
	if (!['p','center'].includes(node.tagName)) return null;
	const result=[];
	for (const child of node.children || []) {
		if (whitespace(child)) continue;
		const media=figures(child);
		if (!media) return null;
		result.push(...media);
	}
	return result.length ? result : null;
}

export function groupMomentImages(tree, group = 'moment') {
	const process = parent => {
		if (!parent.children) return;
		const blocks=[];
		for (const node of parent.children) {
			if (node.tagName === 'p' && !figures(node) && node.children?.some(child=>figures(child))) {
				let prose=[];
				const flush=()=>{ if(prose.some(n=>!whitespace(n))) blocks.push({...node,children:prose});prose=[]; };
				for(const child of node.children) {const media=figures(child);if(media){flush();blocks.push(...media);}else prose.push(child);}
				flush();
			} else blocks.push(node);
		}
		const output=[];let pending=[];
		const flush = () => {
			if (!pending.length) return;
			const count=pending.length;
			for(const figure of pending){
				const image=findImage(figure);const caption=figure.children?.find(node=>node.tagName==='figcaption');
				image.properties ||= {};
				image.properties['data-fancybox']=group;
				image.properties['data-caption']=caption ? textOf(caption) : '';
				image.properties.loading='lazy';
			}
			output.push({type:'element',tagName:'div',properties:{className:['moment-media-grid'],'data-count':count,style:`--moment-columns:${count===1 ? 1 : count===2 || count===4 ? 2 : 3}`},children:pending});
			pending=[];
		};
		for (const node of blocks) {
			const media=figures(node);
			if(media){pending.push(...media);continue;}
			if(whitespace(node)&&pending.length)continue;
			flush();
			if (['root','section','div','blockquote'].includes(node.tagName || node.type) && !node.properties?.className?.includes('moment-media-grid')) process(node);
			output.push(node);
		}
		flush();parent.children=output;
	};
	process(tree);return tree;
}

export default function rehypeMomentGallery() {
	return (tree,file) => {
		const path=String(file.path || file.history?.[0] || '').replaceAll('\\','/');
		if (!/(?:^|\/)src\/content\/dynamic\//u.test(path)) return;
		groupMomentImages(tree,'moment-'+path.split('/').at(-1).replace(/\.[^.]+$/u,''));
	};
}
