import type { GalleryConfig } from "@/types/galleryConfig";
import galleryData from "../data/gallery.json";

export const galleryConfig: GalleryConfig = {
	albums: galleryData.albums,
	columnWidth: galleryData.columnWidth,
};
