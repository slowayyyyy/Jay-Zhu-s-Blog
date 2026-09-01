const MAX_AUDIO_BYTES = 50 * 1024 * 1024;
const AUDIO_EXTENSION_PATTERN = /\.(aac|flac|m4a|mp3|oga|ogg|opus|wav)$/iu;

const sanitizeAudioFilename = (file) => {
	const originalName = String(file.name || 'audio.mp3').normalize('NFKC');
	const extension = originalName.match(AUDIO_EXTENSION_PATTERN)?.[0]?.toLowerCase() || '.mp3';
	const basename =
		originalName
			.slice(0, -extension.length)
			.replace(/[^\p{L}\p{N}]+/gu, '-')
			.replace(/^-+|-+$/gu, '')
			.slice(0, 72) || 'audio';
	const stamp = new Date().toISOString().replace(/\D/gu, '').slice(0, 14);
	const random = crypto.randomUUID().replaceAll('-', '').slice(0, 8);
	return `${stamp}-${random}-${basename}${extension}`;
};

const filenameFromPath = (value) => {
	try {
		return decodeURIComponent(String(value || '').split('/').at(-1) || '');
	} catch {
		return String(value || '').split('/').at(-1) || '';
	}
};

export function setupR2AudioWidget({ getGithubAccessToken, isLocalPreview, showStatus }) {
	if (window.__jayR2AudioWidget || !window.CMS) return;
	const createClass = window.createClass;
	const h = window.h;
	if (typeof createClass !== 'function' || typeof h !== 'function') {
		console.error('[Jay CMS] Decap widget helpers are unavailable for R2 audio.');
		return;
	}

	window.__jayR2AudioWidget = true;
	const R2AudioControl = createClass({
		getInitialState() {
			return { uploading: false, error: '' };
		},

		async handleFileChange(event) {
			const file = event.target.files?.[0];
			event.target.value = '';
			if (!file) return;
			if (!AUDIO_EXTENSION_PATTERN.test(file.name || '')) {
				this.setState({ error: '支持 MP3、M4A、AAC、OGG、OPUS、WAV 和 FLAC。' });
				return;
			}
			if (file.size <= 0 || file.size > MAX_AUDIO_BYTES) {
				this.setState({ error: '单个音乐文件必须小于 50 MB。' });
				return;
			}
			if (isLocalPreview) {
				this.setState({ error: 'R2 音乐上传请使用线上管理后台。' });
				return;
			}

			const token = getGithubAccessToken();
			if (!token) {
				this.setState({ error: 'GitHub 登录已失效，请刷新后台并重新登录。' });
				return;
			}

			const filename = sanitizeAudioFilename(file);
			this.setState({ uploading: true, error: '' });
			showStatus(`正在上传 ${file.name} 到 R2，请勿关闭页面...`, 'pending', 60_000);

			try {
				const response = await fetch(`/api/media/audio/${encodeURIComponent(filename)}`, {
					method: 'PUT',
					headers: {
						Authorization: `Bearer ${token}`,
						'Content-Type': file.type || 'application/octet-stream',
						'X-Original-Filename': encodeURIComponent(file.name || filename),
					},
					body: file,
				});
				const payload = await response.json().catch(() => ({}));
				if (!response.ok || !payload.path) {
					throw new Error(payload.error || `R2 上传失败：HTTP ${response.status}`);
				}

				this.props.onChange(payload.path);
				this.setState({ uploading: false, error: '' });
				showStatus(
					`${file.name} 已上传到 R2。请继续保存“网站与个人资料”，让歌单正式生效。`,
					'success',
					7600,
				);
			} catch (error) {
				console.error('[Jay CMS] R2 audio upload failed.', error);
				this.setState({
					uploading: false,
					error: error?.message || 'R2 音乐上传失败，请稍后重试。',
				});
				showStatus(
					`音乐上传失败：${error?.message || '未知错误'}`,
					'error',
					9000,
				);
			}
		},

		clearValue() {
			this.props.onChange('');
			this.setState({ error: '' });
		},

		render() {
			const value = String(this.props.value || '');
			const managedByR2 = value.startsWith('/media/audio/');
			const helperText = this.state.uploading
				? '正在上传到 Cloudflare R2...'
				: managedByR2
					? '已由 R2 托管。替换或清除后保存，旧文件会自动删除。'
					: value
						? '这是旧版 GitHub 音乐地址，建议重新上传迁移到 R2。'
						: '选择音乐后会先上传到 R2，再保存歌单设置。';

			return h(
				'div',
				{
					style: {
						padding: '14px',
						border: '1px solid #d7dfe3',
						borderRadius: '8px',
						background: '#f8fafb',
					},
				},
				value
					? h(
							'div',
							{ style: { marginBottom: '12px' } },
							h(
								'strong',
								{ style: { display: 'block', marginBottom: '8px', color: '#172329' } },
								filenameFromPath(value),
							),
							h('audio', {
								controls: true,
								preload: 'metadata',
								src: value,
								style: { width: '100%', maxWidth: '520px' },
							}),
						)
					: null,
				h(
					'div',
					{ style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
					h(
						'label',
						{
							style: {
								display: 'inline-flex',
								alignItems: 'center',
								padding: '8px 13px',
								borderRadius: '6px',
								background: this.state.uploading ? '#aab7bc' : '#376d7b',
								color: '#fff',
								cursor: this.state.uploading ? 'wait' : 'pointer',
								fontWeight: 600,
							},
						},
						this.state.uploading ? '上传中...' : value ? '替换音乐' : '选择并上传音乐',
						h('input', {
							type: 'file',
							accept: '.mp3,.m4a,.aac,.ogg,.oga,.opus,.wav,.flac,audio/*',
							disabled: this.state.uploading,
							onChange: this.handleFileChange,
							style: { display: 'none' },
						}),
					),
					value
						? h(
								'button',
								{
									type: 'button',
									disabled: this.state.uploading,
									onClick: this.clearValue,
									style: {
										padding: '8px 13px',
										border: '1px solid #d6a39a',
										borderRadius: '6px',
										background: '#fff',
										color: '#a33f31',
										cursor: 'pointer',
									},
								},
								'清除音乐',
							)
						: null,
				),
				h(
					'p',
					{
						style: {
							margin: '10px 0 0',
							color: this.state.error ? '#b42318' : '#66767d',
							fontSize: '13px',
							lineHeight: 1.6,
						},
					},
					this.state.error || helperText,
				),
			);
		},
	});

	window.CMS.registerWidget('r2-audio', R2AudioControl);
}
