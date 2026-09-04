import { getIconSvg } from '../constants/icons';
import { ADMIN_COLOR_OPTIONS, ADMIN_ICON_OPTIONS } from './admin-choice-options.js';

const readValue = (value) => String(value ?? '').trim();
const normalizeHex = (value) => {
	const raw = readValue(value);
	if (/^#[0-9a-f]{6}$/iu.test(raw)) return raw.toLowerCase();
	if (/^#[0-9a-f]{3}$/iu.test(raw)) {
		return `#${raw
			.slice(1)
			.split('')
			.map((character) => character.repeat(2))
			.join('')}`.toLowerCase();
	}
	return '';
};

const panelStyle = {
	padding: '14px',
	border: '1px solid #d6e0e4',
	borderRadius: '12px',
	background: '#f8fafb',
};
const inputStyle = {
	width: '100%',
	minHeight: '42px',
	padding: '9px 11px',
	border: '1px solid #aebdc3',
	borderRadius: '8px',
	background: '#fff',
	color: '#1f2b30',
	fontSize: '16px',
};

const renderIcon = (h, name, size = 24) =>
	h('span', {
		'aria-hidden': true,
		style: {
			display: 'inline-grid',
			width: `${size}px`,
			height: `${size}px`,
			flex: `0 0 ${size}px`,
			placeItems: 'center',
			fontSize: `${size}px`,
			lineHeight: 1,
		},
		dangerouslySetInnerHTML: { __html: getIconSvg(name) },
	});

export function setupChoiceWidgets() {
	const createClass = window.createClass;
	const h = window.h;
	if (typeof createClass !== 'function' || typeof h !== 'function') {
		console.warn('[Jay CMS] choice widgets require Decap CMS React globals.');
		return;
	}

	const IconPickerControl = createClass({
		getInitialState() {
			return { query: '' };
		},

		isValid() {
			return Boolean(readValue(this.props.value));
		},

		render() {
			const value = readValue(this.props.value);
			const selected = ADMIN_ICON_OPTIONS.find((option) => option.value === value);
			const query = this.state.query.trim().toLocaleLowerCase('zh-CN');
			const visibleOptions = ADMIN_ICON_OPTIONS.filter((option) =>
				`${option.label} ${option.group} ${option.value}`
					.toLocaleLowerCase('zh-CN')
					.includes(query),
			);

			return h(
				'div',
				{ className: this.props.classNameWrapper, style: panelStyle },
				h(
					'div',
					{
						style: {
							display: 'flex',
							alignItems: 'center',
							gap: '12px',
							marginBottom: '12px',
							padding: '11px 12px',
							borderRadius: '10px',
							background: '#e9f2f5',
							color: '#254f5b',
						},
					},
					value ? renderIcon(h, value, 30) : null,
					h(
						'div',
						{ style: { minWidth: 0 } },
						h(
							'strong',
							{ style: { display: 'block', fontSize: '14px' } },
							selected?.label || '自定义图标',
						),
						h(
							'span',
							{
								style: {
									display: 'block',
									marginTop: '2px',
									color: '#587078',
									fontSize: '12px',
									overflowWrap: 'anywhere',
								},
							},
							value || '尚未选择',
						),
					),
				),
				h('input', {
					type: 'search',
					value: this.state.query,
					placeholder: '搜索用途，例如：更新、文章、音乐、GitHub',
					'aria-label': '搜索图标',
					onChange: (event) => this.setState({ query: event.target.value }),
					style: { ...inputStyle, marginBottom: '10px' },
				}),
				h(
					'p',
					{
						style: {
							margin: '0 0 10px',
							color: '#5c6d74',
							fontSize: '13px',
							lineHeight: 1.55,
						},
					},
					'直接选择即可；“推荐”适合常见场景。当前提供 61 个常用图标，也可在下方填写其他 Iconify 名称。',
				),
				visibleOptions.length
					? h(
							'div',
							{
								style: {
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))',
									gap: '8px',
									maxHeight: '330px',
									overflowY: 'auto',
									padding: '1px 3px 4px 1px',
								},
							},
							...visibleOptions.map((option) => {
								const active = option.value === value;
								return h(
									'button',
									{
										type: 'button',
										'aria-pressed': active,
										title: `${option.label} · ${option.group}`,
										onClick: () => this.props.onChange(option.value),
										style: {
											display: 'flex',
											alignItems: 'center',
											gap: '10px',
											minHeight: '58px',
											padding: '9px 10px',
											border: active ? '2px solid #2f7283' : '1px solid #c8d4d8',
											borderRadius: '10px',
											background: active ? '#e0f0f4' : '#fff',
											color: '#26383f',
											cursor: 'pointer',
											textAlign: 'left',
										},
									},
									renderIcon(h, option.value),
									h(
										'span',
										{ style: { minWidth: 0 } },
										h('strong', { style: { display: 'block', fontSize: '13px' } }, option.label),
										h(
											'small',
											{ style: { color: '#65777e', fontSize: '11px' } },
											`${option.group}${option.recommended ? ' · 推荐' : ''}`,
										),
									),
								);
							}),
						)
					: h(
							'p',
							{
								role: 'status',
								style: {
									margin: '16px 0',
									color: '#65777e',
									textAlign: 'center',
								},
							},
							'没有匹配的常用图标，可以修改关键词或使用下方自定义名称。',
						),
				h(
					'label',
					{ style: { display: 'block', marginTop: '12px' } },
					h(
						'span',
						{
							style: {
								display: 'block',
								marginBottom: '6px',
								color: '#3c4d54',
								fontSize: '13px',
								fontWeight: 650,
							},
						},
						'自定义 Iconify 名称（高级）',
					),
					h('input', {
						type: 'text',
						value,
						placeholder: '例如 material-symbols:favorite-rounded',
						onChange: (event) => this.props.onChange(event.target.value.trim()),
						style: inputStyle,
					}),
				),
			);
		},
	});

	const ColorPaletteControl = createClass({
		getInitialState() {
			return { draft: readValue(this.props.value) };
		},

		componentDidUpdate(previousProps) {
			if (
				previousProps.value !== this.props.value &&
				readValue(this.props.value) !== this.state.draft
			) {
				this.setState({ draft: readValue(this.props.value) });
			}
		},

		isValid() {
			return Boolean(normalizeHex(this.props.value));
		},

		setColor(value) {
			const normalized = normalizeHex(value);
			this.setState({ draft: value });
			if (normalized) this.props.onChange(normalized);
		},

		render() {
			const value = normalizeHex(this.props.value) || '#38bdf8';
			const selected = ADMIN_COLOR_OPTIONS.find((option) => option.value === value);
			const invalidDraft = Boolean(this.state.draft) && !normalizeHex(this.state.draft);

			return h(
				'div',
				{ className: this.props.classNameWrapper, style: panelStyle },
				h(
					'div',
					{
						style: {
							display: 'flex',
							alignItems: 'center',
							gap: '11px',
							marginBottom: '11px',
						},
					},
					h('span', {
						'aria-hidden': true,
						style: {
							width: '38px',
							height: '38px',
							flex: '0 0 38px',
							border: '1px solid rgba(15,23,42,.18)',
							borderRadius: '10px',
							background: value,
						},
					}),
					h(
						'div',
						h(
							'strong',
							{
								style: { display: 'block', color: '#26383f', fontSize: '14px' },
							},
							selected?.label || '自定义颜色',
						),
						h(
							'span',
							{ style: { color: '#65777e', fontSize: '12px' } },
							`${value}${selected ? ` · ${selected.usage}` : ''}`,
						),
					),
				),
				h(
					'p',
					{
						style: {
							margin: '0 0 10px',
							color: '#5c6d74',
							fontSize: '13px',
							lineHeight: 1.55,
						},
					},
					'选择颜色即可同步到前台。苍蓝与晴空蓝适合大多数内容，其余颜色已标注推荐用途。',
				),
				h(
					'div',
					{
						style: {
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit,minmax(145px,1fr))',
							gap: '8px',
						},
					},
					...ADMIN_COLOR_OPTIONS.map((option) => {
						const active = option.value === value;
						return h(
							'button',
							{
								type: 'button',
								'aria-pressed': active,
								title: `${option.label}：${option.usage}`,
								onClick: () => this.setColor(option.value),
								style: {
									display: 'flex',
									alignItems: 'center',
									gap: '9px',
									minHeight: '52px',
									padding: '8px 9px',
									border: active ? '2px solid #2f7283' : '1px solid #c8d4d8',
									borderRadius: '10px',
									background: active ? '#e0f0f4' : '#fff',
									color: '#26383f',
									cursor: 'pointer',
									textAlign: 'left',
								},
							},
							h('span', {
								'aria-hidden': true,
								style: {
									width: '24px',
									height: '24px',
									flex: '0 0 24px',
									border: '1px solid rgba(15,23,42,.15)',
									borderRadius: '7px',
									background: option.value,
								},
							}),
							h(
								'span',
								{ style: { minWidth: 0 } },
								h(
									'strong',
									{ style: { display: 'block', fontSize: '13px' } },
									`${option.label}${option.recommended ? ' · 推荐' : ''}`,
								),
								h(
									'small',
									{
										style: {
											display: 'block',
											color: '#65777e',
											fontSize: '11px',
											lineHeight: 1.35,
										},
									},
									option.usage,
								),
							),
						);
					}),
				),
				h(
					'label',
					{ style: { display: 'block', marginTop: '13px' } },
					h(
						'span',
						{
							style: {
								display: 'block',
								marginBottom: '6px',
								color: '#3c4d54',
								fontSize: '13px',
								fontWeight: 650,
							},
						},
						'自定义颜色',
					),
					h(
						'div',
						{
							style: {
								display: 'grid',
								gridTemplateColumns: '52px minmax(0,1fr)',
								gap: '8px',
							},
						},
						h('input', {
							type: 'color',
							value,
							'aria-label': '打开颜色选择器',
							onChange: (event) => this.setColor(event.target.value),
							style: {
								width: '52px',
								height: '42px',
								padding: '3px',
								border: '1px solid #aebdc3',
								borderRadius: '8px',
								background: '#fff',
								cursor: 'pointer',
							},
						}),
						h('input', {
							type: 'text',
							value: this.state.draft,
							placeholder: '#38bdf8',
							'aria-invalid': invalidDraft,
							onChange: (event) => this.setColor(event.target.value),
							style: {
								...inputStyle,
								borderColor: invalidDraft ? '#b7493a' : inputStyle.border.split(' ').pop(),
							},
						}),
						invalidDraft
							? h(
									'span',
									{
										role: 'alert',
										style: {
											gridColumn: '1 / -1',
											color: '#a33f31',
											fontSize: '12px',
										},
									},
									'请输入 6 位颜色值，例如 #38bdf8。',
								)
							: null,
					),
				),
			);
		},
	});

	window.CMS.registerWidget('icon-picker', IconPickerControl);
	window.CMS.registerWidget('color-palette', ColorPaletteControl);
}
