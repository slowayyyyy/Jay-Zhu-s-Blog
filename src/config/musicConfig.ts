import type { MusicPlayerConfig } from "../types/musicConfig";
import azureContent from "../data/azure-content.json";

export const musicPlayerConfig: MusicPlayerConfig = {
	showInNavbar: true,
	mode: "local",
	volume: 0.65,
	playMode: "list",
	showLyrics: true,
	meting: {
		api: "https://api.i-meto.com/meting/api?server=:server&type=:type&id=:id&r=:r",
		server: "netease",
		type: "playlist",
		id: "",
		auth: "",
		fallbackApis: [],
	},
	local: {
		playlist: azureContent.playlist.map((track) => ({
			name: track.name,
			artist: track.artist,
			url: track.src,
			cover: track.cover,
			lrc: track.lrc,
		})),
	},
};
