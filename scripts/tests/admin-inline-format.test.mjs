import test from 'node:test';
import assert from 'node:assert/strict';
import { applyTyporaCommand, inlineScriptMarkup, typoraCommandForKey } from '../../src/scripts/admin-typora-shortcuts.js';

test('article editor wraps inline scripts without moving them to another paragraph', () => {
	assert.equal(applyTyporaCommand('H2O', 1, 2, 'sub').value, 'H~2~O');
	assert.equal(applyTyporaCommand('x2', 1, 2, 'sup').value, 'x^2^');
	assert.equal(inlineScriptMarkup('2', 'sub'), '<sub>2</sub>');
	assert.equal(inlineScriptMarkup('<n&1>', 'sup'), '<sup>&lt;n&amp;1&gt;</sup>');
});

test('article editor recognizes upper and lower script shortcuts on Mac and Windows', () => {
	assert.equal(typoraCommandForKey({ metaKey: true, ctrlKey: false, altKey: false, shiftKey: true, code: 'Period', key: '>' }, true), 'sup');
	assert.equal(typoraCommandForKey({ metaKey: false, ctrlKey: true, altKey: false, shiftKey: true, code: 'Comma', key: '<' }, false), 'sub');
});
