import YAML from 'yaml';
import { findTag, newTagId, tagKey } from './admin-tags-service.js';

const REPO = 'slowayyyyy/Jay-Zhu-s-Blog';
const BRANCH = 'main';
const TOKEN_PATTERN = /(?:gho_|ghu_|ghs_|ghr_|github_pat_)[A-Za-z0-9_]+/u;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_BYTES = 40 * 1024 * 1024;
const MAX_ASSETS = 80;

const findToken = (value, depth = 0) => {
	if (depth > 5 || value == null) return null;
	if (typeof value === 'string') return value.match(TOKEN_PATTERN)?.[0] || null;
	if (Array.isArray(value)) return value.map((item) => findToken(item, depth + 1)).find(Boolean) || null;
	if (typeof value === 'object') {
		for (const key of ['token', 'access_token', 'accessToken', 'githubToken']) {
			if (key in value) {
				const token = findToken(value[key], depth + 1);
				if (token) return token;
			}
		}
		return Object.values(value).map((item) => findToken(item, depth + 1)).find(Boolean) || null;
	}
	return null;
};

export const getCmsGithubToken = (storage = window.localStorage) => {
	for (let index = 0; index < storage.length; index += 1) {
		const raw = storage.getItem(storage.key(index));
		if (!raw) continue;
		try {
			const parsed = JSON.parse(raw);
			const token = findToken(parsed);
			if (token) return token;
		} catch {
			const token = findToken(raw);
			if (token) return token;
		}
	}
	return null;
};

const apiPath = (path) => `/api/github/repos/${REPO}/${path}`;
const encodePath = (path) => path.split('/').map(encodeURIComponent).join('/');

const request = async (path, token, { method = 'GET', body, allow404 = false } = {}) => {
	const response = await fetch(apiPath(path), {
		method,
		cache: 'no-store',
		headers: {
			Authorization: `token ${token}`,
			Accept: 'application/vnd.github+json',
			'Content-Type': 'application/json',
			'X-GitHub-Api-Version': '2022-11-28',
		},
		...(body === undefined ? {} : { body: JSON.stringify(body) }),
	});
	if (allow404 && response.status === 404) return null;
	const payload = await response.json().catch(() => ({}));
	if (!response.ok) {
		const error = new Error(response.status === 401 ? '登录已失效，请返回后台重新登录。'
			: response.status === 403 ? '当前 GitHub 登录无仓库写入权限。'
			: response.status === 422 ? '提交时 main 已更新，请重新预览并重试；没有覆盖任何远端内容。'
			: `GitHub ${response.status}：${payload.message || '请求失败'}`);
		error.status = response.status;
		throw error;
	}
	return payload;
};

const base64File = (file) => new Promise((resolve, reject) => {
	const reader = new FileReader();
	reader.onload = () => resolve(String(reader.result).split(',')[1]);
	reader.onerror = () => reject(reader.error || new Error('图片读取失败'));
	reader.readAsDataURL(file);
});

const decodeBase64Utf8 = (value) => new TextDecoder().decode(
	Uint8Array.from(atob(String(value).replace(/\s/gu, '')), (character) => character.charCodeAt(0)),
);

const prepareTags = async (selected, token, tree) => {
	if (!selected.length) return [];
	const files = await request('contents/src/content/tags?ref=main', token);
	if (!Array.isArray(files)) throw new Error('无法读取标签目录，未提交文章。');
	const catalog = await Promise.all(files.filter((file) => file.type === 'file' && file.name.endsWith('.json')).map(async (file) => {
		const blob = await request(`git/blobs/${file.sha}`, token);
		const data = JSON.parse(decodeBase64Utf8(blob.content));
		return { id: file.name.slice(0, -5), name: data.name || file.name.slice(0, -5) };
	}));
	const ids = [];
	for (const value of selected) {
		let tag = findTag(catalog, value);
		if (!tag) {
			const id = await newTagId(value);
			if (catalog.some((item) => tagKey(item.id) === tagKey(id))) throw new Error(`新标签「${value}」标识冲突，请在后台先处理。`);
			const blob = await request('git/blobs', token, { method: 'POST', body: {
				content: `${JSON.stringify({ name: value, description: '' }, null, 2)}\n`, encoding: 'utf-8',
			} });
			tree.push({ path: `src/content/tags/${id}.json`, mode: '100644', type: 'blob', sha: blob.sha });
			tag = { id, name: value };
			catalog.push(tag);
		}
		if (!ids.includes(tag.id)) ids.push(tag.id);
	}
	return ids;
};

export const validateImportAssets = (assets) => {
	if (assets.length > MAX_ASSETS) throw new Error(`图片超过 ${MAX_ASSETS} 张，请拆分文章。`);
	let total = 0;
	for (const { file } of assets) {
		if (!file.size || file.size > MAX_IMAGE_BYTES) throw new Error(`图片「${file.name}」必须小于 10 MB。`);
		if (!/\.(?:avif|gif|jpe?g|png|webp)$/iu.test(file.name)) throw new Error(`暂不支持图片类型：${file.name}`);
		total += file.size;
	}
	if (total > MAX_TOTAL_BYTES) throw new Error('本篇图片合计超过 40 MB，请先压缩。');
};

export async function publishTyporaDraft(plan, { token = getCmsGithubToken(), onProgress = () => {} } = {}) {
	if (!token) throw new Error('请先在同一浏览器登录博客后台，再返回这里导入。');
	if (plan.missing.length) throw new Error('有本地图片尚未匹配，未提交任何内容。');
	validateImportAssets(plan.assets);
	const articlePath = `src/content/posts/${plan.slug}.md`;
	const existing = await request(`contents/${encodePath(articlePath)}?ref=${BRANCH}`, token, { allow404: true });
	if (existing) throw new Error(`文章文件 ${plan.slug}.md 已存在；请更改标题或日期，避免覆盖旧文章。`);
	for (const asset of plan.assets) {
		const present = await request(`contents/${encodePath(asset.path)}?ref=${BRANCH}`, token, { allow404: true });
		if (present) throw new Error(`图片路径 ${asset.path} 已存在；请更改文章标题或日期，避免覆盖已有素材。`);
	}
	onProgress('已确认没有同名文章，正在准备一次性提交…');
	const reference = await request(`git/ref/heads/${BRANCH}`, token);
	const baseCommit = await request(`git/commits/${reference.object.sha}`, token);
	const tree = [];
	onProgress('正在核对文章标签…');
	const tagIds = await prepareTags(plan.tags, token, tree);
	for (const [index, asset] of plan.assets.entries()) {
		onProgress(`正在处理图片 ${index + 1}/${plan.assets.length}：${asset.file.name}`);
		const blob = await request('git/blobs', token, { method: 'POST', body: {
			content: await base64File(asset.file), encoding: 'base64',
		} });
		tree.push({ path: asset.path, mode: '100644', type: 'blob', sha: blob.sha });
	}
	const articleContent = `---\n${YAML.stringify({ ...plan.metadata, tags: tagIds }, { lineWidth: 0 }).trimEnd()}\n---\n\n${plan.body.trimStart()}`;
	const articleBlob = await request('git/blobs', token, { method: 'POST', body: { content: articleContent, encoding: 'utf-8' } });
	tree.push({ path: articlePath, mode: '100644', type: 'blob', sha: articleBlob.sha });
	const nextTree = await request('git/trees', token, { method: 'POST', body: { base_tree: baseCommit.tree.sha, tree } });
	const nextCommit = await request('git/commits', token, { method: 'POST', body: {
		message: `Import Typora draft: ${plan.title}`, tree: nextTree.sha, parents: [reference.object.sha],
	} });
	onProgress('正在写入 main；若后台同时有人保存，系统会拒绝覆盖并提示重试。');
	await request(`git/refs/heads/${BRANCH}`, token, { method: 'PATCH', body: { sha: nextCommit.sha, force: false } });
	return { sha: nextCommit.sha, slug: plan.slug, articlePath };
}
