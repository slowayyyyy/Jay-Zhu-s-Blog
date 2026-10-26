// HEIC must be converted even when a browser can preview it natively: readers
// may use a different browser. Load the decoder only for these files.
export async function isHeicImage(file) {
	const bytes = new Uint8Array(await file.slice(0, 64).arrayBuffer());
	if ((bytes[0] === 0xff && bytes[1] === 0xd8) ||
		(bytes[0] === 0x89 && bytes[1] === 0x50) ||
		String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF') return false;
	const header = String.fromCharCode(...bytes);
	if (header.slice(4, 8) === 'ftyp') {
		if (/avif|avis/u.test(header.slice(8))) return false;
		if (/heic|heix|hevc|hevx|heim|heis|mif1|msf1/u.test(header.slice(8))) return true;
	}
	return /^image\/hei[cf](?:-sequence)?$/iu.test(file.type || '') || /\.hei[cf]$/iu.test(file.name || '');
}

export async function prepareWebImage(file, decode = async (blob) => {
	const { heicTo } = await import('heic-to/csp');
	return heicTo({ blob, type: 'image/jpeg', quality: 0.94 });
}) {
	if (!await isHeicImage(file)) return file;
	try {
		const converted = await decode(file);
		if (!(converted instanceof Blob) || converted.size === 0 || converted.type !== 'image/jpeg') {
			throw new Error('invalid_converted_image');
		}
		const name = (file.name || 'pasted-image').replace(/\.[^.]+$/u, '') + '.jpg';
		return new File([converted], name, { type: 'image/jpeg' });
	} catch (cause) {
		throw new Error('heic_conversion_failed', { cause });
	}
}
