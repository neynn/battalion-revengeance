import { PathHandler } from "../resources/pathHandler.js";

export const MapSource = function(id, config) {
    const {
        directory = [],
        source = "",
        text = ""
    } = config;

    this.id = id;
    this.directory = directory;
    this.source = source;
    this.text = text;
    this.file = null;
    this.translations = null;
}

MapSource.CACHE_ENABLED = 1;

MapSource.prototype.promiseFile = async function() {
    if(this.source.length === 0) {
        return Promise.resolve(null);
    }

    if(MapSource.CACHE_ENABLED) {
        if(this.file !== null) {
            return Promise.resolve(this.file);
        }
    }

    const path = PathHandler.getPath(this.directory, this.source);
    const file = await PathHandler.promiseJSON(path);

    if(MapSource.CACHE_ENABLED) {
        this.file = file;
    }

    return file;
}

MapSource.prototype.promiseTranslations = async function() {
    if(this.text.length === 0) {
        return Promise.resolve(null);
    }

    if(MapSource.CACHE_ENABLED) {
        if(this.translations !== null) {
            return Promise.resolve(this.translations);
        }
    }

    const path = PathHandler.getPath(this.directory, this.text);
    const file = await PathHandler.promiseJSON(path);

    if(MapSource.CACHE_ENABLED) {
        this.translations = file;
    }

    return file;
}