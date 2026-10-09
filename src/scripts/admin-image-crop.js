const readFieldOption = (field, name, fallback) => {
	const value = field?.get?.(name) ?? field?.[name];
	return value ?? fallback;
};

const readValue = (value, name) => value?.get?.(name) ?? value?.[name];

const unwrapCropValue = (value) => {
	let current = value;
	const visited = new Set();

	while (current && typeof current === "object" && !visited.has(current)) {
		visited.add(current);
		if (readValue(current, "src") != null) break;

		const nested =
			readValue(current, "crop") ??
			readValue(current, "value") ??
			readValue(current, "image");
		if (nested == null || nested === current) break;
		current = nested;
	}

	return current;
};

const normalizeImageSource = (value) => {
	if (typeof value === "string") return value;
	return String(
		readValue(value, "path") ??
			readValue(value, "url") ??
			readValue(value, "src") ??
			"",
	);
};

const clamp = (value, minimum, maximum, fallback) => {
	const number = Number(value);
	return Math.min(
		maximum,
		Math.max(minimum, Number.isFinite(number) ? number : fallback),
	);
};

const normalizeCropValue = (value) => {
	const unwrappedValue = unwrapCropValue(value);
	if (typeof unwrappedValue === "string") {
		return { src: unwrappedValue, positionX: 50, positionY: 50, zoom: 1 };
	}
	return {
		src: normalizeImageSource(readValue(unwrappedValue, "src")),
		positionX: clamp(readValue(unwrappedValue, "positionX"), 0, 100, 50),
		positionY: clamp(readValue(unwrappedValue, "positionY"), 0, 100, 50),
		zoom: clamp(readValue(unwrappedValue, "zoom"), 1, 2, 1),
	};
};

export const filterImageLibrary = (images, query, indexedOnly) => {
	const search = String(query || "")
		.trim()
		.toLocaleLowerCase("zh-CN");
	return images.filter((image) => {
		if (indexedOnly && !image.indexed) return false;
		return (
			!search ||
			`${image.name} ${image.usage} ${image.src}`
				.toLocaleLowerCase("zh-CN")
				.includes(search)
		);
	});
};

export const selectLibraryImage = (currentValue, src) => ({
	...normalizeCropValue(currentValue),
	src,
	positionX: 50,
	positionY: 50,
	zoom: 1,
});

const controlLabelStyle = {
	display: "flex",
	justifyContent: "space-between",
	gap: "12px",
	marginBottom: "7px",
	color: "#314047",
	fontSize: "13px",
	fontWeight: 650,
};

const rangeStyle = {
	width: "100%",
	accentColor: "#2f7283",
};

export function setupImageCropWidget({
	uploadImage,
	isLocalPreview,
	showStatus,
}) {
	const createClass = window.createClass;
	const h = window.h;
	if (typeof createClass !== "function" || typeof h !== "function") {
		console.warn(
			"[Jay CMS] image crop widget requires Decap CMS React globals.",
		);
		return;
	}

	const ImageCropControl = createClass({
		getInitialState() {
			return {
				uploading: false,
				error: "",
				localPreviewUrl: "",
				previewError: false,
				galleryOpen: false,
				galleryScope: "indexed",
				galleryQuery: "",
				galleryLimit: 24,
			};
		},

		componentWillUnmount() {
			if (this.state.localPreviewUrl?.startsWith("blob:")) {
				URL.revokeObjectURL(this.state.localPreviewUrl);
			}
		},

		setCropValue(patch) {
			this.props.onChange({
				...normalizeCropValue(this.props.value),
				...patch,
			});
		},

		isValid() {
			return Boolean(normalizeCropValue(this.props.value).src.trim());
		},

		handleSourceChange(event) {
			if (this.state.localPreviewUrl?.startsWith("blob:")) {
				URL.revokeObjectURL(this.state.localPreviewUrl);
			}
			this.setState({ localPreviewUrl: "", error: "", previewError: false });
			this.setCropValue({ src: event.target.value });
		},

		handleSelectLibraryImage(image) {
			if (this.state.localPreviewUrl?.startsWith("blob:")) {
				URL.revokeObjectURL(this.state.localPreviewUrl);
			}
			this.props.onChange(selectLibraryImage(this.props.value, image.src));
			this.setState({ localPreviewUrl: "", previewError: false, error: "" });
			showStatus?.(
				`已选用“${image.name}”。调整取景后保存站点设置。`,
				"success",
				4200,
			);
		},

		async handleFileChange(event) {
			const file = event.target.files?.[0];
			event.target.value = "";
			if (!file) return;
			if (!file.type?.startsWith("image/")) {
				this.setState({ error: "请选择 JPG、PNG、WebP、GIF 等图片文件。" });
				return;
			}

			const previousPreviewUrl = this.state.localPreviewUrl;
			const localPreviewUrl = URL.createObjectURL(file);
			if (previousPreviewUrl?.startsWith("blob:"))
				URL.revokeObjectURL(previousPreviewUrl);
			this.setState({
				uploading: true,
				error: "",
				localPreviewUrl,
				previewError: false,
			});
			showStatus?.("正在上传取景图片，请不要关闭页面…", "pending");

			try {
				const uploadedUrl = await uploadImage(file);
				this.setCropValue({ src: uploadedUrl });
				this.setState({ uploading: false, error: "" });
				showStatus?.(
					"图片已上传。调整取景后，再保存站点设置。",
					"success",
					4200,
				);
			} catch (error) {
				const message =
					error?.message === "local_preview_upload_unavailable"
						? "本地后台不直接上传媒体；请填写已有站内路径，或在网页后台上传。"
						: error?.message === "missing_github_token"
							? "未读取到 GitHub 登录状态，请刷新后台并重新登录后再试。"
							: `上传失败：${error?.message || "请稍后重试"}`;
				URL.revokeObjectURL(localPreviewUrl);
				this.setState({
					uploading: false,
					localPreviewUrl: "",
					error: message,
				});
				showStatus?.(message, "error", 7600);
			}
		},

		renderLibrary() {
			const images = Array.isArray(window.__JAY_IMAGE_LIBRARY__)
				? window.__JAY_IMAGE_LIBRARY__
				: [];
			const indexedCount = images.filter((image) => image.indexed).length;
			const indexedOnly = this.state.galleryScope === "indexed";
			const matches = filterImageLibrary(
				images,
				this.state.galleryQuery,
				indexedOnly,
			);
			const visible = matches.slice(0, this.state.galleryLimit);
			const currentSource = normalizeCropValue(this.props.value).src;
			const panelId = `${this.props.forID}-library`;

			return h(
				"section",
				{
					id: panelId,
					className: "jay-image-library",
					"aria-label": "选择站内已有图片",
				},
				h(
					"div",
					{ className: "jay-image-library__head" },
					h("strong", null, "选择站内已有图片"),
					h(
						"button",
						{
							type: "button",
							className: "jay-image-library__close",
							"aria-label": "收起图片库",
							onClick: () => this.setState({ galleryOpen: false }),
						},
						"收起",
					),
				),
				h(
					"p",
					{ className: "jay-image-library__note" },
					"选用已有图片不会重复上传或删除原文件；保存站点设置后前台才会更新。",
				),
				h("input", {
					type: "search",
					className: "jay-image-library__search",
					placeholder: "搜索素材名称、用途或文件名",
					"aria-label": "搜索已有图片",
					value: this.state.galleryQuery,
					onChange: (event) =>
						this.setState({
							galleryQuery: event.target.value,
							galleryLimit: 24,
						}),
				}),
				h(
					"div",
					{
						className: "jay-image-library__scopes",
						role: "group",
						"aria-label": "图片范围",
					},
					[
						["indexed", `已整理素材 ${indexedCount}`],
						["all", `全部站内图片 ${images.length}`],
					].map(([scope, label]) =>
						h(
							"button",
							{
								key: scope,
								type: "button",
								className: "jay-image-library__scope",
								"aria-pressed": this.state.galleryScope === scope,
								onClick: () =>
									this.setState({ galleryScope: scope, galleryLimit: 24 }),
							},
							label,
						),
					),
				),
				h(
					"p",
					{ className: "jay-image-library__count", role: "status" },
					`找到 ${matches.length} 张图片${matches.length > visible.length ? `，当前显示 ${visible.length} 张` : ""}`,
				),
				visible.length
					? h(
							"div",
							{ className: "jay-image-library__grid" },
							visible.map((image) =>
								h(
									"button",
									{
										key: image.src,
										type: "button",
										className: "jay-image-library__item",
										"aria-pressed": currentSource === image.src,
										title: image.src,
										onClick: () => this.handleSelectLibraryImage(image),
									},
									h("img", { src: image.src, alt: "", loading: "lazy" }),
									h(
										"span",
										{ className: "jay-image-library__name" },
										image.name,
									),
									h(
										"small",
										{ className: "jay-image-library__usage" },
										image.usage || image.src,
									),
								),
							),
						)
					: h(
							"p",
							{ className: "jay-image-library__empty" },
							images.length
								? "没有找到匹配的图片，可修改搜索词或查看全部站内图片。"
								: "暂无站内图片，可从 Mac 上传新图片。",
						),
				matches.length > visible.length
					? h(
							"button",
							{
								type: "button",
								className: "jay-image-library__more",
								onClick: () =>
									this.setState({ galleryLimit: this.state.galleryLimit + 24 }),
							},
							`继续显示（还剩 ${matches.length - visible.length} 张）`,
						)
					: null,
			);
		},

		renderRange(label, name, minimum, maximum, step, suffix = "") {
			const value = normalizeCropValue(this.props.value)[name];
			return h(
				"label",
				{ style: { display: "block", minWidth: 0 } },
				h(
					"span",
					{ style: controlLabelStyle },
					h("span", null, label),
					h(
						"span",
						{ style: { fontVariantNumeric: "tabular-nums", color: "#597078" } },
						`${value}${suffix}`,
					),
				),
				h("input", {
					type: "range",
					min: minimum,
					max: maximum,
					step,
					value,
					style: rangeStyle,
					onChange: (event) =>
						this.setCropValue({ [name]: Number(event.target.value) }),
				}),
			);
		},

		render() {
			const value = normalizeCropValue(this.props.value);
			const previewSource = this.state.localPreviewUrl || value.src;
			const aspectRatio = readFieldOption(
				this.props.field,
				"preview_aspect",
				"16 / 9",
			);
			const cropHint = readFieldOption(
				this.props.field,
				"crop_hint",
				"拖动下面的控件，让人物脸部完整留在框内。原图不会被裁掉。",
			);
			const previewStyle = {
				position: "relative",
				width: "100%",
				aspectRatio,
				overflow: "hidden",
				borderRadius: "12px",
				background: "#dce7eb",
			};

			return h(
				"div",
				{
					className: this.props.classNameWrapper,
					style: {
						padding: "14px",
						border: "1px solid #d6e0e4",
						borderRadius: "12px",
						background: "#f8fafb",
					},
				},
				h(
					"div",
					{ style: previewStyle },
					previewSource && !this.state.previewError
						? h("img", {
								alt: "当前前台取景预览",
								src: previewSource,
								onError: () => this.setState({ previewError: true }),
								style: {
									width: "100%",
									height: "100%",
									objectFit: "cover",
									objectPosition: `${value.positionX}% ${value.positionY}%`,
									transform: `scale(${value.zoom})`,
									transformOrigin: `${value.positionX}% ${value.positionY}%`,
								},
							})
						: h(
								"div",
								{
									style: {
										display: "grid",
										height: "100%",
										placeItems: "center",
										padding: "20px",
										color: "#586970",
										textAlign: "center",
									},
								},
								this.state.previewError
									? "图片无法加载。请从已有素材中重新选择，或检查图片路径。"
									: "从已有素材中选择，或从 Mac 上传图片",
							),
					h("div", {
						"aria-hidden": true,
						style: {
							position: "absolute",
							inset: "10%",
							border: "1px dashed rgba(255,255,255,.78)",
							boxShadow: "0 0 0 999px rgba(8,23,31,.12)",
							pointerEvents: "none",
						},
					}),
				),
				h(
					"p",
					{
						style: {
							margin: "9px 0 12px",
							color: "#5c6d74",
							fontSize: "13px",
							lineHeight: 1.55,
						},
					},
					cropHint,
				),
				h(
					"div",
					{
						style: {
							display: "flex",
							flexWrap: "wrap",
							gap: "8px",
							marginBottom: "12px",
						},
					},
					h(
						"button",
						{
							type: "button",
							className: "jay-image-library__open",
							"aria-expanded": this.state.galleryOpen,
							"aria-controls": `${this.props.forID}-library`,
							onClick: () =>
								this.setState({ galleryOpen: !this.state.galleryOpen }),
						},
						"从已有素材选择",
					),
					h(
						"label",
						{
							style: {
								display: "inline-flex",
								alignItems: "center",
								padding: "9px 13px",
								borderRadius: "8px",
								background: this.state.uploading ? "#9aabb1" : "#2f7283",
								color: "#fff",
								cursor: this.state.uploading ? "wait" : "pointer",
								fontWeight: 650,
							},
						},
						this.state.uploading ? "正在上传…" : "从 Mac 上传新图片",
						h("input", {
							type: "file",
							accept: "image/jpeg,image/png,image/webp,image/gif,image/avif",
							disabled: this.state.uploading,
							onChange: this.handleFileChange,
							style: { display: "none" },
						}),
					),
					h(
						"button",
						{
							type: "button",
							onClick: () =>
								this.setCropValue({ positionX: 50, positionY: 50, zoom: 1 }),
							style: {
								padding: "9px 13px",
								border: "1px solid #b9c8ce",
								borderRadius: "8px",
								background: "#fff",
								color: "#304047",
								cursor: "pointer",
							},
						},
						"恢复居中",
					),
				),
				this.state.galleryOpen ? this.renderLibrary() : null,
				h(
					"label",
					{ style: { display: "block", marginBottom: "14px" } },
					h(
						"span",
						{ style: controlLabelStyle },
						h("span", null, "已有图片路径"),
					),
					h("input", {
						type: "text",
						value: value.src,
						placeholder: "/uploads/example.webp",
						onChange: this.handleSourceChange,
						style: {
							width: "100%",
							minHeight: "42px",
							padding: "9px 11px",
							border: "1px solid #aebdc3",
							borderRadius: "8px",
							background: "#fff",
							color: "#1f2b30",
							fontSize: "16px",
						},
					}),
				),
				h(
					"div",
					{
						style: {
							display: "grid",
							gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
							gap: "14px",
						},
					},
					this.renderRange("左右焦点", "positionX", 0, 100, 1, "%"),
					this.renderRange("上下焦点", "positionY", 0, 100, 1, "%"),
					this.renderRange("画面缩放", "zoom", 1, 2, 0.05, "×"),
				),
				this.state.error
					? h(
							"p",
							{
								role: "alert",
								style: {
									margin: "12px 0 0",
									color: "#a33f31",
									fontSize: "13px",
									lineHeight: 1.55,
								},
							},
							this.state.error,
						)
					: isLocalPreview
						? h(
								"p",
								{
									style: {
										margin: "12px 0 0",
										color: "#66767d",
										fontSize: "13px",
									},
								},
								"本地预览可调整已有路径；上传请使用线上后台。",
							)
						: null,
			);
		},
	});

	window.CMS.registerWidget("image-crop", ImageCropControl);
}
