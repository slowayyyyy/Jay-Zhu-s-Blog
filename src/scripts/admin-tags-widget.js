import { findTag, tagKey, tagValues } from './admin-tags-service.js';
import './admin-tags-widget.css';

export function setupTagsWidget(service) {
	const { h, createClass, CMS } = window;
	const TagsControl = createClass({
		getInitialState() {
			return { query: '', tags: [], loading: true, error: '' };
		},
		componentDidMount() {
			this.alive = true;
			this.unsubscribe = service.subscribe((tags) => {
				if (this.alive) this.setState({ tags });
			});
			void this.refresh();
		},
		componentWillUnmount() {
			this.alive = false;
			this.unsubscribe?.();
		},
		async refresh() {
			this.setState({ loading: true, error: '' });
			try {
				const tags = await service.load(true);
				if (this.alive) this.setState({ tags, loading: false });
			} catch {
				if (this.alive)
					this.setState({
						loading: false,
						error: '无法读取标签，请检查网络后点击“刷新标签”。已选标签仍保留。',
					});
			}
		},
		add(value) {
			if (this.state.loading || this.state.error) return;
			const trimmed = String(value).trim();
			if (!trimmed) return;
			const tag = findTag(this.state.tags, trimmed);
			const id = tag?.id || trimmed;
			const selected = tagValues(this.props.value);
			if (
				!selected.some((item) => tagKey(findTag(this.state.tags, item)?.id || item) === tagKey(id))
			) {
				this.props.onChange([...selected, id]);
			}
			this.setState({ query: '' });
		},
		render() {
			const selected = tagValues(this.props.value);
			const query = this.state.query.trim();
			const known = findTag(this.state.tags, query);
			const choices = this.state.tags.filter(
				(tag) =>
					!selected.some((item) => (findTag(this.state.tags, item)?.id || item) === tag.id) &&
					tagKey(`${tag.name} ${tag.description} ${tag.id}`).includes(tagKey(query)),
			);
			const inputId = this.props.forID || 'article-tags-input';
			return h(
				'div',
				{ className: `${this.props.classNameWrapper || ''} jay-tags` },
				h(
					'p',
					{ className: 'jay-tags-help', id: `${inputId}-hint` },
					'输入标签名，按回车或点击添加；新标签会在保存文章时同步到“标签管理”。',
				),
				h(
					'div',
					{ className: 'jay-tags-selected', 'aria-label': '已选标签' },
					...selected.map((value) => {
						const tag = findTag(this.state.tags, value);
						return h(
							'span',
							{ key: value, className: 'jay-tags-chip' },
							h('span', null, tag?.name || value),
							!tag && !this.state.loading && !this.state.error ? h('small', null, '待创建') : null,
							h(
								'button',
								{
									type: 'button',
									'aria-label': `移除标签 ${tag?.name || value}`,
									onClick: () => this.props.onChange(selected.filter((item) => item !== value)),
								},
								'×',
							),
						);
					}),
					!selected.length ? h('span', { className: 'jay-tags-help' }, '尚未添加标签') : null,
				),
				h(
					'div',
					{ className: 'jay-tags-entry' },
					h('input', {
						id: inputId,
						type: 'text',
						value: this.state.query,
						maxLength: 100,
						placeholder: '搜索已有标签，或输入一个新标签',
						'aria-describedby': `${inputId}-hint`,
						onChange: (event) => this.setState({ query: event.target.value }),
						onKeyDown: (event) => {
							if (
								event.key === 'Enter' &&
								!event.nativeEvent?.isComposing &&
								event.keyCode !== 229
							) {
								event.preventDefault();
								this.add(query);
							}
						},
					}),
					h(
						'button',
						{
							type: 'button',
							disabled: !query || this.state.loading || Boolean(this.state.error),
							onClick: () => this.add(query),
						},
						known ? '选用标签' : '添加新标签',
					),
				),
				h(
					'div',
					{ className: 'jay-tags-toolbar' },
					h(
						'span',
						{ role: 'status' },
						this.state.loading ? '正在读取标签…' : `${choices.length} 个可选标签`,
					),
					h(
						'button',
						{ type: 'button', disabled: this.state.loading, onClick: this.refresh },
						'刷新标签',
					),
				),
				this.state.error
					? h('p', { role: 'alert', className: 'jay-tags-error' }, this.state.error)
					: null,
				h(
					'div',
					{ className: 'jay-tags-options', 'aria-label': '可选标签' },
					...choices.map((tag) =>
						h(
							'button',
							{
								key: tag.id,
								type: 'button',
								title: tag.description || tag.name,
								onClick: () => this.add(tag.id),
							},
							tag.name,
						),
					),
				),
				!choices.length && !this.state.loading && !this.state.error && query && !known
					? h('p', { className: 'jay-tags-help' }, `还没有“${query}”，点击“添加新标签”即可。`)
					: null,
			);
		},
	});
	CMS.registerWidget('creatable-tags', TagsControl);
}
