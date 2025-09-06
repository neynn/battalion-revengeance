import { PathHandler } from "./pathHandler.js";

export const AssetLoader = function(devPath, prodPath) {
    this.devPath = devPath;
    this.prodPath = prodPath;
    this.resources = {};
}

AssetLoader.MODE = {
    DEVELOPER: 0,
    PRODUCTION: 1
};

AssetLoader.prototype.loadJSONList = async function(fileList) {
    const files = {};
    const promises = [];

    for(const fileID in fileList) {
        const fileMeta = fileList[fileID];
        const { directory, source } = fileMeta;
        const path = PathHandler.getPath(directory, source);
        const promise = PathHandler.promiseJSON(path).then(file => files[fileID] = file);

        promises.push(promise);
    }

    await Promise.all(promises);

    return files;
}

AssetLoader.prototype.loadResources = async function(modeID) {
    switch(modeID) {
        case AssetLoader.MODE.DEVELOPER: {
            const files = await PathHandler.promiseJSON(this.devPath);
            const resources = await this.loadJSONList(files);

            this.resources = resources;
            break;
        }
        case AssetLoader.MODE.PRODUCTION: {
            const resources = await PathHandler.promiseJSON(this.prodPath);

            this.resources = resources;
            break;
        }
    }

    return this.resources;
}