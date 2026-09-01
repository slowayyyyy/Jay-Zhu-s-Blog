import type { SidebarLayoutConfig } from "../types/sidebarConfig";

/**
 * 苍蓝回廊使用开放式内容布局。文章目录由浮动控件承担，避免首页重新
 * 变成资料、统计和日历堆叠的仪表盘。
 */
export const sidebarLayoutConfig: SidebarLayoutConfig = {
	enable: false,
	position: "right",
	tabletSidebar: "right",
	hideSidebarOnPostPage: true,
	showBothSidebarsOnPostPage: false,
	leftComponents: [],
	rightComponents: [],
	mobileBottomComponents: [],
};
