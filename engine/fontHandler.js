import { PathHandler } from "./resources/pathHandler.js";

export const FontHandler = function() {
    this.fontTypes = {};
    this.fonts = new Map();
}

FontHandler.prototype.load = function(fontTypes) {
    if(!fontTypes) {
        return;
    }

    this.fontTypes = fontTypes;
    this.loadFontList(fontTypes);
}

FontHandler.prototype.addFont = function(id, font) {
    if(!this.fonts.has(id)) {
        this.fonts.set(id, font);

        document.fonts.add(font);
    }
}

FontHandler.prototype.loadCSSFont = function(id, directory, source) {
    const path = PathHandler.getPath(directory, source);
    const fontFace = new FontFace(id, `url(${path})`);

    return fontFace.load().then(font => this.addFont(id, font));
}

FontHandler.prototype.loadFontList = function(fontList) {
	const promises = [];

	for(const fontID in fontList) {
		const fontMeta = fontList[fontID];
        const { directory, source } = fontMeta;
        const promise = this.loadCSSFont(fontID, directory, source);

		promises.push(promise);
	}
}
