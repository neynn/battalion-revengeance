export const PathHandler = {
    getPathByString: function(directory, source) {
        return `${directory}/${source}`;
    },
    getPathByArray: function(directory, source) {
        let path = "";

        for(let i = 0; i < directory.length; i++) {
            const folder = directory[i];

            path += folder;
            path += "/";
        }

        path += source;

        return path;
    },
    getPath: function(directory, source) {
        switch(typeof directory) {
            case "string": return PathHandler.getPathByString(directory, source);
            default: return PathHandler.getPathByArray(directory, source);
        }
    },
    promiseJSON: function(path) {
        return fetch(path).then(response => response.json()).catch(error => null);
    },
    promiseAudioBuffer: function(path, context) {
        return fetch(path)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => context.decodeAudioData(arrayBuffer));
    }
};