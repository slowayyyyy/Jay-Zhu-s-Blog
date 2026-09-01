import type { AnnouncementConfig } from "../types/announcementConfig";

export const announcementConfig: AnnouncementConfig = {
	// 公告标题，留空则走i18n默认标题
	title: "",

	// 公告内容
	content: "欢迎来到苍蓝回廊。这里记录论文、阅读、运动和缓慢生长的日常。",

	// 是否允许用户关闭公告
	closable: true,

	link: {
		// 启用链接
		enable: true,
		// 链接文本
		text: "走进回廊",
		// 链接 URL
		url: "/about/",
		// 内部链接
		external: false,
	},
};
