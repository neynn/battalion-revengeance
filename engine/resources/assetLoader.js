const loadJSONList = async function(pathHandler, fileList) {
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

export const downloadFile = function(filename, data) {
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

export const loadResourcesDev = async function(pathHandler, path) {
    const files = await pathHandler.promiseJSON(path);

    if(files) {
        const resources = await loadJSONList(pathHandler, files);

        return Promise.resolve(resources);
    }

    return Promise.reject();
}

export const loadResourcesProd = async function(pathHandler, path) {
    const resources = await pathHandler.promiseJSON(path);

    if(resources) {
        return Promise.resolve(resources);
    }

    return Promise.reject();
}