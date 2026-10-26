import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { groupMomentImages } from '../lib/moment-gallery.mjs';
import { parseImagePresentation } from '../lib/remark-image-presentation.mjs';

const parser = unified().use(remarkParse);

// Preserve all non-image Markdown verbatim and let Decap render it normally.
// The shared frontend grouping pass owns image grouping, columns and captions.
export function momentPreviewSegments(value = '') {
	const tree = parser.parse(value);
	const images = tree.children.filter(node=>node.type==='paragraph').flatMap(node=>node.children.filter(child=>child.type==='image'));
	const children=[];let cursor=0;
	for (const image of images) {
		const start=image.position.start.offset,end=image.position.end.offset;
		if (start>cursor) children.push({type:'text',value:value.slice(cursor,start)});
		children.push({type:'element',tagName:'img',properties:{src:image.url,alt:parseImagePresentation(image.alt).alt,title:image.title || ''}});
		cursor=end;
	}
	if (cursor<value.length) children.push({type:'text',value:value.slice(cursor)});
	return groupMomentImages({type:'root',children},'moment-preview').children;
}

export function setupMomentPreview({ CMS, h, styles }) {
	const markdown = CMS.getWidget('markdown');
	CMS.registerPreviewStyle(styles, {raw:true});
	CMS.registerWidget('moment-markdown', markdown.control, props => {
		const pieces=momentPreviewSegments(props.value || '');
		return h('div', {className:'dynamic-content'}, ...pieces.map((piece,index)=>{
			if (piece.type==='text') return h(markdown.preview,{...props,key:index,value:piece.value});
			return h('div',{key:index,className:'moment-media-grid','data-count':piece.properties['data-count'],style:{'--moment-columns':Number(piece.properties.style.split(':')[1])}},...piece.children.map((figure,imageIndex)=>{
				const image=figure.children[0];
				const {src,alt,title}=image.properties;
				const asset=props.getAsset?.(src);
				return h('figure',{key:imageIndex},h('img',{src:asset ? asset.toString() : src,alt,loading:'lazy'}),title ? h('figcaption',null,title) : null);
			}));
		}));
	});
}
