export const tagKey = (value) =>
	String(value ?? '')
		.normalize('NFKC')
		.trim()
		.replace(/\s+/gu, ' ')
		.toLowerCase();
export const tagValues = (value) => {
	const items = value?.toJS?.() ?? value ?? [];
	return [
		...new Set(
			(Array.isArray(items) ? items : [items]).map((item) => String(item).trim()).filter(Boolean),
		),
	];
};

export function findTag(tags, value) {
	return (
		tags.find((tag) => tag.id === value) ??
		tags.find((tag) => tagKey(tag.name) === tagKey(value)) ??
		tags.find((tag) => tagKey(tag.id) === tagKey(value))
	);
}

export async function newTagId(name) {
	const normalized = tagKey(name);
	// Keep ordinary names readable; punctuation and long names receive a stable suffix.
	const safe = normalized
		.replace(/[^\p{L}\p{N}_-]/gu, '-')
		.replace(/^-+|-+$/gu, '')
		.slice(0, 64);
	if (safe === normalized && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/iu.test(safe)) return safe;
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(tagKey(name)));
	const suffix = Array.from(new Uint8Array(digest).slice(0, 8), (byte) =>
		byte.toString(16).padStart(2, '0'),
	).join('');
	return `${safe || 'tag'}-${suffix}`;
}

export function createTagService({ request, localRequest }) {
	let catalog = null;
	let loading;
	const blobs = new Map();
	const listeners = new Set();
	const folder = 'src/content/tags';
	const parse = (id, raw) => {
		const data = JSON.parse(raw);
		if (!data.name?.trim()) throw new Error(`标签「${id}」缺少名称，请在标签管理中补全。`);
		return { id, name: data.name, description: data.description || '' };
	};
	const decode = (content) =>
		new TextDecoder().decode(
			Uint8Array.from(atob(content.replace(/\s/gu, '')), (char) => char.charCodeAt(0)),
		);

	async function load(fresh = false) {
		if (loading) return loading;
		if (catalog && !fresh) return catalog;
		loading = (async () => {
			if (localRequest) {
				const entries = await localRequest('entriesByFolder', {
					folder,
					extension: 'json',
					depth: 1,
				});
				catalog = entries.map((entry) =>
					parse(
						entry.file.path
							.split('/')
							.pop()
							.replace(/\.json$/u, ''),
						entry.data,
					),
				);
			} else {
				const files = await request(`contents/${folder}`);
				if (!Array.isArray(files)) throw new Error('标签目录加载失败，请稍后重试。');
				const records = files.filter((file) => file.type === 'file' && file.name.endsWith('.json'));
				catalog = await Promise.all(
					records.map(async (file) => {
						if (!blobs.has(file.sha)) {
							const blob = await request(`git/blobs/${file.sha}`);
							blobs.set(file.sha, decode(blob.content));
						}
						return parse(file.name.slice(0, -5), blobs.get(file.sha));
					}),
				);
			}
			return catalog.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
		})();
		try {
			return await loading;
		} finally {
			loading = null;
		}
	}

	async function ensure(values) {
		const selected = tagValues(values);
		if (!selected.length) return [];
		let tags = await load(true);
		const result = [];
		for (const value of selected) {
			let existing = findTag(tags, value);
			if (!existing) {
				const id = await newTagId(value);
				if (tags.some((tag) => tagKey(tag.id) === tagKey(id)))
					throw new Error(`标签「${value}」的标识已占用，请换一个名称。`);
				const raw = JSON.stringify({ name: value, description: '' }, null, 2) + '\n';
				try {
					if (localRequest) {
						await localRequest('persistEntry', {
							entry: { slug: id, path: `${folder}/${id}.json`, raw },
							assets: [],
							options: {
								collectionName: 'tag_settings',
								commitMessage: `Create tag ${value}`,
								useWorkflow: false,
								status: 'published',
							},
						});
					} else {
						const content = btoa(
							Array.from(new TextEncoder().encode(raw), (byte) => String.fromCharCode(byte)).join(
								'',
							),
						);
						// No sha: GitHub refuses to overwrite an existing tag or its description.
						await request(`contents/${folder}/${encodeURIComponent(id)}.json`, {
							method: 'PUT',
							body: { message: `Create tag ${value}`, content },
						});
					}
					existing = { id, name: value, description: '' };
					tags.push(existing);
				} catch (error) {
					// A concurrent save or lost response may already have created this tag.
					tags = await load(true);
					existing = findTag(tags, value);
					if (!existing) throw error;
				}
			}
			if (!result.includes(existing.id)) result.push(existing.id);
		}
		for (const listener of listeners) listener([...tags]);
		return result;
	}

	return {
		load,
		ensure,
		subscribe(listener) {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
	};
}
