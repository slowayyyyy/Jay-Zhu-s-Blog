/**
 * 首页开屏动画的访客偏好设置。
 *
 * 这些值只保存在访客自己的浏览器里，不会改变站点构建配置；这样每个人
 * 都可以选择是否播放开屏动画，以及自己喜欢的角色。
 */
export const homePortfolioIntroSettings = {
	enabledStorageKey: "jay.home-portfolio-intro-enabled.v1",
	characterStorageKey: "jay.home-portfolio-intro-character.v1",
	topBannerStorageKey: "jay.home-portfolio-intro-top-banner.v1",
	bottomBannerStorageKey: "jay.home-portfolio-intro-bottom-banner.v1",
	defaultEnabled: true,
	defaultCharacterId: "roxy-water",
	defaultTopBannerId: "roxy-night",
	defaultBottomBannerId: "roxy-journey",
	defaultMobileTopBannerId: "roxy-night",
	defaultMobileBottomBannerId: "roxy-journey",
	banners: {
		desktop: {
			top: [
				{ id: "roxy-night", label: "夜空魔法", src: "/assets/images/roxy/night-flight.jpg" },
				{ id: "roxy-portrait", label: "水之魔术师", src: "/assets/images/roxy/portrait-magic.jpg" },
			],
			bottom: [
				{ id: "roxy-journey", label: "原野旅途", src: "/assets/images/roxy/field-journey.jpg" },
				{ id: "roxy-sunset", label: "落日草原", src: "/assets/images/roxy/sunset-rest.jpg" },
			],
		},
		mobile: {
			top: [
				{ id: "roxy-night", label: "夜空魔法", src: "/assets/images/roxy/night-flight.jpg" },
			],
			bottom: [
				{ id: "roxy-journey", label: "原野旅途", src: "/assets/images/roxy/field-journey.jpg" },
			],
		},
	},
	characters: [
		{ id: "roxy-water", label: "水之魔术师（默认）", src: "/assets/images/roxy/water-magic.jpg", thumbnail: "/assets/images/roxy/water-magic.jpg" },
		{ id: "roxy-portrait", label: "洛琪希", src: "/assets/images/roxy/portrait-magic.jpg", thumbnail: "/assets/images/roxy/portrait-magic.jpg" },
		{ id: "roxy-study", label: "书房", src: "/assets/images/roxy/study.jpg", thumbnail: "/assets/images/roxy/study.jpg" },
		{ id: "roxy-field", label: "原野", src: "/assets/images/roxy/field-journey.jpg", thumbnail: "/assets/images/roxy/field-journey.jpg" },
	],
} as const;

export type HomePortfolioIntroCharacter =
	(typeof homePortfolioIntroSettings.characters)[number];

export const homePortfolioIntroCharacterIds: readonly string[] =
	homePortfolioIntroSettings.characters.map((character) => character.id);
