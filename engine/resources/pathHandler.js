export const ClientPathHandler = function() {}

ClientPathHandler.prototype.getPathByString = function(directory, source) {
    return `${directory}/${source}`;
}

ClientPathHandler.prototype.getPathByArray = function(directory, source) {
    let path = "";

    for(let i = 0; i < directory.length; i++) {
        const folder = directory[i];

        path += folder;
        path += "/";
    }

    path += source;

    return path;
}

ClientPathHandler.prototype.getPath = function(directory, source) {
    switch(typeof directory) {
        case "string": return PathHandler.getPathByString(directory, source);
        default: return PathHandler.getPathByArray(directory, source);
    }
}

ClientPathHandler.prototype.promiseJSON = function(path) {
    return fetch(path).then(response => response.json()).catch(error => null);
}

ClientPathHandler.prototype.promiseAudioBuffer = function(path, context) {
    return fetch(path)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => context.decodeAudioData(arrayBuffer));
}

export const PathHandler = new ClientPathHandler();