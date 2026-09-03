import type { AnalyticsConfig } from "../types/analyticsConfig";
import azureContent from "../data/azure-content.json";

export const analyticsConfig: AnalyticsConfig = {
	googleAnalyticsId: "",
	microsoftClarityId: "",
	umamiAnalytics: {
		websiteId: azureContent.integrations.umamiWebsiteId?.trim() || "",
		scriptUrl: azureContent.integrations.umamiScriptUrl,
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
