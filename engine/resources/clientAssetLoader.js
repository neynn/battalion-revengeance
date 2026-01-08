export const ClientAssetLoader = function(devPath, prodPath) {
    this.devPath = devPath;
    this.prodPath = prodPath;
    this.resources = {};
}

ClientAssetLoader.MODE = {
    DEVELOPER: 0,
    PRODUCTION: 1
};

ClientAssetLoader.prototype.loadJSONList = async function(pathHandler, fileList) {
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

ClientAssetLoader.prototype.loadResources = async function(pathHandler, modeID) {
    switch(modeID) {
        case ClientAssetLoader.MODE.DEVELOPER: {
            const files = await pathHandler.promiseJSON(this.devPath);
            const resources = await this.loadJSONList(pathHandler, files);

            this.resources = resources;
            break;
        }
        case ClientAssetLoader.MODE.PRODUCTION: {
            const resources = await pathHandler.promiseJSON(this.prodPath);

            this.resources = resources;
            break;
        }
    }

    return this.resources;
}

ClientAssetLoader.prototype.download = function(filename, data) {
    const blob = new Blob([data], { type: "text/json" });
    const link = document.createElement("a");
  
    link.download = `${filename}.json`;
    link.href = window.URL.createObjectURL(blob);
    link.dataset.downloadurl = ["text/json", link.download, link.href].join(":");
  
    const evt = new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
    });
  
    link.dispatchEvent(evt);
    link.remove();
}

ClientAssetLoader.prototype.mergeResources = function() {
    this.download("assets", JSON.stringify(this.resources));
}