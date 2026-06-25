import siteSettings from './site-settings.json';

export type Locale = 'zh' | 'en';
export type SectionKey = 'study' | 'research' | 'life';

export const sectionMeta: Record<
	SectionKey,
	{ zh: string; en: string; accent: string; summaryZh: string; summaryEn: string }
> = {
	study: {
		zh: '学习笔记',
		en: 'Study Notes',
		accent: 'var(--accent-study)',
		summaryZh: '把课程、自学与工具使用整理成可回看的方法。',
		summaryEn: 'Turning courses, self-study, and tooling into reusable notes.',
	},
	research: {
		zh: '科研记录',
		en: 'Research Journal',
		accent: 'var(--accent-research)',
		summaryZh: '记录论文阅读、问题拆解与科研节奏的建立过程。',
		summaryEn: 'A log of papers, problem framing, and research rhythm.',
	},
	life: {
		zh: '生活手账',
		en: 'Life Ledger',
		accent: 'var(--accent-life)',
		summaryZh: '阅读、运动与日常片刻，都被认真收纳。',
		summaryEn: 'Reading, training, and ordinary days kept with care.',
	},
};

export const translations = {
	zh: {
		nav: {
			home: '首页',
			search: '搜索',
			life: '生活手账',
			checkins: '每日打卡',
			about: '关于',
			rss: 'RSS',
		},
		section: {
			study: '学习笔记',
			research: '科研记录',
			life: '生活手账',
		},
		controls: {
			theme: '主题',
			language: '语言',
			player: '音乐播放器',
		},
		checkins: {
			kicker: 'DAILY LOG',
			title: '每日打卡',
			intro: '用最短的文字，留下今天确实做过的事。',
			listTitle: '全部记录',
		},
			home: {
			kicker: '个人博客',
			latestTitle: '最近书写',
			latestIntro: '按时间向下展开，是最近的学习、科研与生活片段。',
			sidebarTitle: '慢慢整理，慢慢生长',
			sidebarBody: '主页保持时间线视角，搜索页负责筛选，生活手账留给柔软的部分。',
			featured: '置顶阅读',
			statsPosts: '全部文章',
			checkinKicker: 'DAILY LOG',
			checkinTitle: '每日打卡',
			checkinIntro: '用最短的文字，留下今天确实做过的事。',
			checkinRecent: '最近记录',
			updating: '持续更新',
			viewCheckins: '查看记录',
		},
		search: {
			title: '搜索与归档',
			intro: '按关键词、标签、年份和栏目筛选，帮助未来的你迅速找到过去留下的线索。',
			keyword: '关键词',
			keywordPlaceholder: '搜索标题、摘要或正文关键词',
			section: '栏目',
			year: '年份',
			tag: '标签',
			all: '全部',
			reset: '重置筛选',
			resultCount: '找到 {count} 篇结果',
			empty: '没有匹配结果，试试放宽关键词或切换标签。',
		},
		life: {
			title: '生活手账',
			intro: '这里不急着证明什么，只认真记录阅读、运动与日常起伏。',
			highlightTitle: '最近的生活片段',
		},
		about: {
			title: '关于 Jay',
			research: '研究兴趣',
			hobbies: '阅读 / 运动 / 爱好',
			current: '当前在做什么',
			contact: '联系入口',
		},
		article: {
			toc: '文章目录',
			related: '继续阅读',
			back: '返回首页',
			views: '阅读量',
			updated: '更新于',
			published: '发布于',
		},
		common: {
			enter: '进入博客',
			readMore: '阅读全文',
			archive: '时间归档',
			tags: '标签',
			sections: '栏目',
			listenOn: '点击进入后将开始播放背景音乐',
		},
	},
	en: {
		nav: {
			home: 'Home',
			search: 'Search',
			life: 'Life Ledger',
			checkins: 'Check-in',
			about: 'About',
			rss: 'RSS',
		},
		section: {
			study: 'Study Notes',
			research: 'Research Journal',
			life: 'Life Ledger',
		},
		controls: {
			theme: 'Theme',
			language: 'Language',
			player: 'Music Player',
		},
		checkins: {
			kicker: 'DAILY LOG',
			title: 'Daily Check-in',
			intro: 'A short record of what was actually done today.',
			listTitle: 'All entries',
		},
			home: {
			kicker: 'Personal Blog',
			latestTitle: 'Latest Writing',
			latestIntro: 'The home page stays chronological: study, research, and life arranged as a timeline.',
			sidebarTitle: 'Slowly ordered, slowly grown',
			sidebarBody: 'The home page keeps the timeline, search handles retrieval, and Life Ledger keeps the softer notes.',
			featured: 'Featured',
			statsPosts: 'All Posts',
			checkinKicker: 'DAILY LOG',
			checkinTitle: 'Daily Check-in',
			checkinIntro: 'A short record of what was actually done today.',
			checkinRecent: 'Recent entries',
			updating: 'Updating',
			viewCheckins: 'View entries',
		},
		search: {
			title: 'Search & Archive',
			intro: 'Filter by keyword, tag, year, or section to revisit what you left here before.',
			keyword: 'Keyword',
			keywordPlaceholder: 'Search title, excerpt, or body text',
			section: 'Section',
			year: 'Year',
			tag: 'Tag',
			all: 'All',
			reset: 'Reset filters',
			resultCount: '{count} results',
			empty: 'No matching entries. Try a broader keyword or a different tag.',
		},
		life: {
			title: 'Life Ledger',
			intro: 'A place for reading, training, and the ordinary shifts of a week.',
			highlightTitle: 'Recent Life Notes',
		},
		about: {
			title: 'About Jay',
			research: 'Research Interests',
			hobbies: 'Reading / Exercise / Hobbies',
			current: 'What I Am Doing Now',
			contact: 'Contact',
		},
		article: {
			toc: 'Table of Contents',
			related: 'Continue Reading',
			back: 'Back to Home',
			views: 'Views',
			updated: 'Updated',
			published: 'Published',
		},
		common: {
			enter: 'Enter the Blog',
			readMore: 'Read More',
			archive: 'Archive',
			tags: 'Tags',
			sections: 'Sections',
			listenOn: 'Music will start after you enter',
		},
	},
} as const;

export const siteConfig = {
	...siteSettings,
	siteUrl: import.meta.env.PUBLIC_SITE_URL ?? 'https://jay-zhus-blog.pages.dev',
};
