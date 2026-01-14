import { MapPreview } from "./mapPreview.js";

export const MapRegistry = function() {
    this.mapPreviews = new Map();
}

MapRegistry.EMPTY_PREVIEW = new MapPreview("::", {});

MapRegistry.prototype.load = function(mapPreviews) {
    if(typeof mapPreviews !== "object") {
        return;
    }

    for(const previewID in mapPreviews) {
        const preview = mapPreviews[previewID];
        const mapPreview = new MapPreview(previewID, preview);

        this.mapPreviews.set(previewID, mapPreview);
    }
}

MapRegistry.prototype.getMapPreview = function(previewID) {
    const mapPreview = this.mapPreviews.get(previewID);

    if(!mapPreview) {
        return MapRegistry.EMPTY_PREVIEW;
    }

    return mapPreview;
}