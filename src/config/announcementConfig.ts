import type { AnnouncementConfig } from "../types/announcementConfig";

export const announcementConfig: AnnouncementConfig = {
	// 公告标题
	title: "欢迎来到苍蓝回廊",

	// 公告内容
	content:
		"我是 Jay Zhu。这里记录论文阅读、读书笔记、技术探索与普通生活，也收藏一些洛琪希与旋律。",

	// 是否允许用户关闭公告
	closable: true,

	link: {
		// 启用链接
		enable: true,
		// 链接文本
		text: "了解更多",
		// 链接 URL
		url: "/about/",
		// 内部链接
		external: false,
	},
};
