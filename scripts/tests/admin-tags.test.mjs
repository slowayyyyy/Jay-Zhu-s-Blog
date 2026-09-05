import test from 'node:test';
import assert from 'node:assert/strict';
import { createTagService, newTagId } from '../../src/scripts/admin-tags-service.js';

function repository(initial = {}, failure) {
	const files = new Map(Object.entries(initial));
	const writes = [];
	return {
		files,
		writes,
		request: async (path, options = {}) => {
			if (options.method === 'PUT') {
				const id = decodeURIComponent(path.split('/').pop().slice(0, -5));
				assert.equal(options.body.sha, undefined, 'never overwrite existing tag descriptions');
				if (files.has(id)) throw new Error('already exists');
				const raw = JSON.parse(Buffer.from(options.body.content, 'base64').toString('utf8'));
				await failure?.(id, raw, files);
				files.set(id, raw);
				writes.push(id);
				return {};
			}
			if (path.startsWith('git/blobs/')) {
				const id = path.slice('git/blobs/'.length);
				return { content: Buffer.from(JSON.stringify(files.get(id))).toString('base64') };
			}
			return [...files].map(([id]) => ({ type: 'file', name: `${id}.json`, sha: id }));
		},
	};
}

test('new tags persist as UTF-8 records; existing IDs, descriptions and case-insensitive duplicates are preserved', async () => {
	const repo = repository({
		Markdown: { name: 'Markdown', description: '保留说明' },
		research: { name: '科研', description: '研究笔记' },
	});
	const service = createTagService(repo);
	assert.deepEqual(
		await service.ensure([' markdown ', '科研', '深度学习', '深度学习', 'MARKDOWN']),
		['Markdown', 'research', '深度学习'],
	);
	assert.deepEqual(repo.writes, ['深度学习']);
	assert.equal(repo.files.get('Markdown').description, '保留说明');
	assert.deepEqual(repo.files.get('深度学习'), { name: '深度学习', description: '' });
	assert.deepEqual(await service.ensure(['深度学习']), ['深度学习']);
	assert.deepEqual(repo.writes, ['深度学习'], 'retry does not create duplicates');
});

test('punctuation, path separators and reserved Windows names yield safe, distinct stable IDs', async () => {
	const inputs = ['C++', 'C#', '../测试', 'CON', 'a/b', 'ＡＩ', 'a'.repeat(200)];
	const ids = await Promise.all(inputs.map(newTagId));
	assert.equal(new Set(ids).size, ids.length);
	for (const id of ids) {
		assert.match(id, /^[\p{L}\p{N}_-]+$/u);
		assert.ok(id.length < 100);
	}
	assert.equal(await newTagId('AI'), await newTagId(' ai '));
	assert.equal(await newTagId('ＡＩ'), await newTagId('AI'));
});

test('failed creation blocks save; retry recovers partial success without losing earlier tags', async () => {
	let offline = true;
	const repo = repository({}, async (id) => {
		if (offline && id === '第二个') throw new Error('offline');
	});
	const service = createTagService(repo);
	await assert.rejects(service.ensure(['第一个', '第二个']), /offline/);
	assert.deepEqual(repo.writes, ['第一个']);
	offline = false;
	assert.deepEqual(await service.ensure(['第一个', '第二个']), ['第一个', '第二个']);
	assert.deepEqual(repo.writes, ['第一个', '第二个']);
});

test('lost create response or concurrent creation reuses the record instead of failing or overwriting', async () => {
	const repo = repository({}, async (id, raw, files) => {
		files.set(id, { ...raw, description: '并发保存的说明' });
		throw new Error('response lost');
	});
	assert.deepEqual(await createTagService(repo).ensure(['新标签']), ['新标签']);
	assert.equal(repo.files.get('新标签').description, '并发保存的说明');
});

test('removing every article tag does not delete taxonomy or make network writes', async () => {
	const service = createTagService({
		request: () => {
			throw new Error('unexpected request');
		},
	});
	assert.deepEqual(await service.ensure([]), []);
});
