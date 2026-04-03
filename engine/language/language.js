import { PathHandler } from "../resources/pathHandler.js";

export const Language = function(id, directory, sources) {
    this.id = id;
    this.directory = directory;
    this.sources = sources;
    this.state = Language.STATE.NONE;
}

Language.STATE = {
    NONE: 0,
    LOADING: 1,
    LOADED: 2
};

Language.prototype.getID = function() {
    return this.id;
}

Language.prototype.loadFiles = function(onLoaded) {
    if(this.sources.length === 0 || this.state === Language.STATE.LOADING) {
        return;
    }

    this.state = Language.STATE.LOADING;

    const requests = [];

    for(const source of this.sources) {
        const path = PathHandler.getPath(this.directory, source);

        requests.push(PathHandler.promiseJSON(path));
    }

    Promise.all(requests)
    .then(files => {
        this.state = Language.STATE.NONE;
        onLoaded(files);
    })
    .catch(e => {
        this.state = Language.STATE.NONE;
    });
}