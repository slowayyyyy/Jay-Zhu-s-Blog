import type { AnalyticsConfig } from "../types/analyticsConfig";

export const analyticsConfig: AnalyticsConfig = {
	googleAnalyticsId: "",
	microsoftClarityId: "",
	umamiAnalytics: {
		websiteId: "",
		scriptUrl: "https://cloud.umami.is/script.js",
		shareId: "",
		shareApiBase: "https://cloud.umami.is/analytics/us",
		historicalStats: { visitors: 0, pageviews: 0 },
		showPageViews: false,
		showSiteStats: false,
		replaysScriptUrl: "",
		trackOutboundLinks: true,
		collectWebVitals: false,
		replays: {
			enabled: false,
			sampleRate: 0,
			maskLevel: "strict",
			maxDuration: 300000,
			blockSelector: "",
		},
	},
	la51Analytics: {
		Id: "",
		sdkUrl: "",
		ck: "",
		autoTrack: false,
		hashMode: false,
		screenRecord: false,
	},
};
