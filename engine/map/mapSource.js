import { PathHandler } from "../resources/pathHandler.js";

export const MapSource = function(id, config) {
    const {
        directory = [],
        source = "",
        language = {}
    } = config;

    this.id = id;
    this.directory = directory;
    this.source = source;
    this.language = language;
    this.file = null;
}

MapSource.CACHE_ENABLED = true;

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

MapSource.prototype.promiseTranslations = function(languageID) {
    if(this.language[languageID]) {
        const path = PathHandler.getPath(this.directory, this.language[languageID]);
        const promise = PathHandler.promiseJSON(path);

        return promise;
    }

    return Promise.resolve(null);
}