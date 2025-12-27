import { PathHandler } from "../resources/pathHandler.js";

export const Language = function(id, files) {
    this.id = id;
    this.files = files;
    this.translations = {};
    this.state = Language.STATE.NONE;
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

Language.IS_STRICT = true;

Language.prototype.getID = function() {
    return this.id;
}

Language.prototype.loadFiles = function(onResponse) {
    if(this.files.length === 0) {
        onResponse(Language.LOAD_RESPONSE.ERROR);
    }

    if(this.state === Language.STATE.LOADED) {
        onResponse(Language.LOAD_RESPONSE.SUCCESS);
    }

    if(this.state === Language.STATE.LOADING) {
        onResponse(Language.LOAD_RESPONSE.LOADING);
    }

    const requests = [];

    for(let i = 0; i < this.files.length; i++) {
        const { directory, source } = this.files[i];
        const path = PathHandler.getPath(directory, source);

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

Language.prototype.getTranslation = function(key) {
    if(typeof key !== "string") {
        return "";
    }

    const translation = this.translations[key];

    if(translation === undefined) {
        if(Language.IS_STRICT) {
            console.info(`Missing translation! <${key}> in ${this.id}`);
        }

        return key;
    }

    if(translation.length === 0 && Language.IS_STRICT) {
        console.info(`Empty translation! <${key}> in ${this.id}`);

        return key;
    }

    return translation;
}

Language.prototype.getMissingTags = function(template) {
    const missing = new Set();

    for(const tagID in template) {
        const tag = this.translations[tagID];

        if(tag === undefined || (tag.length === 0 && Language.IS_STRICT)) {
            missing.add(tagID);
        }
    }

    return missing;
}