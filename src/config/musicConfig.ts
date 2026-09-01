import type { MusicPlayerConfig } from "../types/musicConfig";

// 音乐播放器配置
export const musicPlayerConfig: MusicPlayerConfig = {
	// 是否在导航栏显示音乐播放器入口
	showInNavbar: true,

	// 是否在侧边栏显示音乐播放器组件
	showInSidebar: true,

	// 使用方式："meting" 使用 Meting API，"local" 使用本地音乐列表
	mode: "local",

	// 默认音量 (0-1)
	volume: 0.7,

	// 播放模式：'list'=列表循环, 'one'=单曲循环, 'random'=随机播放
	playMode: "list",

	// 是否显启用歌词
	showLyrics: true,

	// Meting API 配置
	meting: {
		// Meting API 地址
		// 默认使用官方 API，也可以使用自定义 API
		api: "https://api.i-meto.com/meting/api?server=:server&type=:type&id=:id&r=:r",
		// 音乐平台：netease=网易云音乐, tencent=QQ音乐, kugou=酷狗音乐, xiami=虾米音乐, baidu=百度音乐
		server: "netease",
		// 类型：song=单曲, playlist=歌单, album=专辑, search=搜索, artist=艺术家
		type: "playlist",
		// 歌单/专辑/单曲 ID 或搜索关键词
		id: "10046455237",
		// 认证 token（可选）
		auth: "",
		// 备用 API 配置（当主 API 失败时使用）
		fallbackApis: [
			"https://api.injahow.cn/meting/?server=:server&type=:type&id=:id",
			"https://api.moeyao.cn/meting/?server=:server&type=:type&id=:id",
		],
	},

	// 本地音乐配置（当 mode 为 'local' 时使用）
	// 1. 支持传入歌词文件的路径
	// lrc: "/assets/music/lrc/使一颗心免于哀伤-哼唱.lrc",
	// 2. 或者直接填入歌词字符串内容
	// lrc: "[00:00.00]歌词内容...",
	local: {
		playlist: [
			{ name: "旅人の唄", artist: "大原ゆい子", url: "/media/audio/20260901150506-bfc6980d-大原ゆい子-旅人の唄-旅人之歌-kgg-dec.mp3", cover: "", lrc: "" },
			{ name: "芽吹の唄", artist: "大原ゆい子", url: "/media/audio/20260901150655-70964cdb-大原ゆい子-芽吹の唄.mp3", cover: "", lrc: "" },
			{ name: "spiral", artist: "LONGMAN", url: "/media/audio/20260901150725-b5f79610-LONGMAN-spiral-kgg-dec.mp3", cover: "", lrc: "" },
			{ name: "祈り、終われば", artist: "中島美嘉", url: "/media/audio/20260901150746-fa7cac8a-中島美嘉-祈り-終われば.mp3", cover: "", lrc: "" },
			{ name: "かげくらべの唄", artist: "大原ゆい子", url: "/media/audio/20260901150807-3aa83d0f-大原ゆい子-かげくらべの唄-与你身影作比之歌.mp3", cover: "", lrc: "" },
			{ name: "ムスビメ (联结)", artist: "大原ゆい子", url: "/media/audio/20260901150825-4a04356cdb-大原ゆい子-ムスビメ-联结.mp3", cover: "", lrc: "" },
			{ name: "守りたいもの（想要守护之物）", artist: "大原ゆい子", url: "/media/audio/20260901150858-8b47d5a7-大原ゆい子-守りたいもの-想要守护之物.mp3", cover: "", lrc: "" },
			{ name: "決意の唄", artist: "大原ゆい子", url: "/media/audio/20260901150919-a124278c-大原ゆい子-決意の唄.mp3", cover: "", lrc: "" },
			{ name: "風と行く道 (随风而行的路)", artist: "大原ゆい子", url: "/media/audio/20260901150938-8b1f8086-大原ゆい子-風と行く道-随风而行的路.mp3", cover: "", lrc: "" },
		],
	},
};
