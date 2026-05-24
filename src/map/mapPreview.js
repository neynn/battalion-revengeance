export const MapPreview = function(id, config) {
    const {
        directory = [],
        source = "",
        title = ""
    } = config;

    this.id = id;
    this.directory = directory;
    this.source = source;
    this.text = "";
    this.title = title;
    this.file = null;
    this.translations = null;
}

MapPreview.CACHE_ENABLED = 1;

MapPreview.prototype.promiseFile = async function(pathHandler) {
    if(this.source.length === 0) {
        return Promise.resolve(null);
    }

    if(MapPreview.CACHE_ENABLED) {
        if(this.file !== null) {
            return Promise.resolve(this.file);
        }
    }

    const path = pathHandler.getPath(this.directory, this.source);
    const file = await pathHandler.promiseJSON(path);

    if(MapPreview.CACHE_ENABLED) {
        this.file = file;
    }

    return file;
}

MapPreview.prototype.promiseTranslations = async function(pathHandler) {
    if(this.text.length === 0) {
        return Promise.resolve(null);
    }

    if(MapPreview.CACHE_ENABLED) {
        if(this.translations !== null) {
            return Promise.resolve(this.translations);
        }
    }

    const path = pathHandler.getPath(this.directory, this.text);
    const file = await pathHandler.promiseJSON(path);

    if(MapPreview.CACHE_ENABLED) {
        this.translations = file;
    }

    return file;
}