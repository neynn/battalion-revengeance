export const PathHandler = function() {}

const getPathByString = function(directory, source) {
    return `${directory}/${source}`;
}

const getPathByArray = function(directory, source) {
    let path = "";

    for(let i = 0; i < directory.length; i++) {
        const folder = directory[i];

        path += folder;
        path += "/";
    }

    path += source;

    return path;
}

PathHandler.getPath = function(directory, source) {
    switch(typeof directory) {
        case "string": return getPathByString(directory, source);
        default: return getPathByArray(directory, source);
    }
}

PathHandler.promiseJSON = function(path) {
    return fetch(path).then(response => response.json()).catch(error => null);
}