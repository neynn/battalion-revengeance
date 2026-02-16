import { PathHandler } from "../resources/pathHandler.js";

export const Language = function(id, directory, sources) {
    this.id = id;
    this.directory = directory;
    this.sources = sources;
    this.state = Language.STATE.NONE;
    this.translations = {};
}

Language.STATE = {
    NONE: 0,
    LOADING: 1,
    LOADED: 2
};

Language.LOAD_RESPONSE = {
    SUCCESS: 0,
    ERROR: 1,
    LOADING: 2,
};

Language.prototype.getID = function() {
    return this.id;
}

Language.prototype.loadFiles = function(onResponse) {
    if(this.sources.length === 0) {
        onResponse(Language.LOAD_RESPONSE.ERROR);
    }

    if(this.state === Language.STATE.LOADED) {
        onResponse(Language.LOAD_RESPONSE.SUCCESS);
    }

    if(this.state === Language.STATE.LOADING) {
        onResponse(Language.LOAD_RESPONSE.LOADING);
    }

    const requests = [];

    for(const source of this.sources) {
        const path = PathHandler.getPath(this.directory, source);

        requests.push(PathHandler.promiseJSON(path));
    }

    Promise.all(requests)
    .then(files => {
        this.state = Language.STATE.LOADED;
        this.loadTranslations(files);
        onResponse(Language.LOAD_RESPONSE.SUCCESS);
    })
    .catch(e => {
        this.state = Language.STATE.NONE;
        onResponse(Language.LOAD_RESPONSE.ERROR);
    });
}

Language.prototype.clear = function() {
    this.translations = {};
    this.state = Language.STATE.NONE;
}

Language.prototype.loadTranslations = function(files) {
    if(files.length === 1 && files[0] !== null) {
        this.translations = files[0];
        return;
    }

    for(let i = 0; i < files.length; i++) {
        const file = files[i];

        if(file === null) {
            continue;
        }

        for(const key in file) {
            if(this.translations[key] === undefined) {
                this.translations[key] = file[key];
            } else {
                console.error(`Translation <${key}> is already set!`);
            }
        }
    }
}

Language.prototype.getMissingTags = function(template) {
    const missing = new Set();

    for(const tagID in template) {
        const tag = this.translations[tagID];

        if(tag === undefined || tag.length === 0) {
            missing.add(tagID);
        }
    }

    return missing;
}