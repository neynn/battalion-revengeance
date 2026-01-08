import fs from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

export const ServerPathHandler = function() {
    this.root = "";
}

ServerPathHandler.prototype.setRoot = function(root) {
    this.root = dirname(fileURLToPath(root));
}

ServerPathHandler.prototype.getPath = function(directory, source) {
    if(Array.isArray(directory)) {
        return join(this.root, ...directory, source);
    } else if(typeof directory === 'string') {
        return join(this.root, directory, source);
    } else {
        return this.root;
    }
}

ServerPathHandler.prototype.promiseJSON = async function(path) {
    try {
        const data = await fs.readFile(path, "utf-8");

        return JSON.parse(data);
    } catch(err) {
        return null;
    }
}