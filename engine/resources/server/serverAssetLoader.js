export const ServerAssetLoader = function() {
    this.resources = {};
}

ServerAssetLoader.prototype.loadJSONList = async function(pathHandler, fileList) {
    const files = {};
    const promises = [];

    for(const fileID in fileList) {
        const fileMeta = fileList[fileID];
        const { directory, source } = fileMeta;
        const path = pathHandler.getPath(directory, source);
        const promise = pathHandler.promiseJSON(path).then(file => files[fileID] = file);

        promises.push(promise);
    }

    await Promise.all(promises);

    return files;
}

ServerAssetLoader.prototype.loadResources = async function(pathHandler) {
    const filePath = pathHandler.getPath(["assets"], "assets.json");
    const fileList = await pathHandler.promiseJSON(filePath);

    if(fileList) {
        this.resources = await this.loadJSONList(pathHandler, fileList);
    }

    return this.resources;
}