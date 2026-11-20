import { PathHandler } from "../resources/pathHandler.js";

export const Language = function(id) {
    this.id = id;
    this.paths = [];
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

Language.prototype.addPath = function(directory, source) {
    this.paths.push(PathHandler.getPath(directory, source));
}

Language.prototype.loadFiles = function(onLoaded) {
    if(this.paths.length === 0 || this.state === Language.STATE.LOADING) {
        return;
    }

    this.state = Language.STATE.LOADING;

    const requests = [];

    for(const path of this.paths) {
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