export const ClientAssetLoader = function() {
    this.resources = {};
}

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

ClientAssetLoader.prototype.loadResourcesDev = async function(pathHandler, path) {
    const files = await pathHandler.promiseJSON(path);

    if(files) {
        const resources = await this.loadJSONList(pathHandler, files);

        this.resources = resources;
    }

    return this.resources;
}

ClientAssetLoader.prototype.loadResourcesProd = async function(pathHandler, path) {
    const resources = await pathHandler.promiseJSON(path);

    if(resources) {
        this.resources = resources;
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