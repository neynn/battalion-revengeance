import fs from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

var FileRoot = "";

export const ServerPathHandler = {
    promiseJSON: async function(path) {
        try {
            const data = await fs.readFile(path, "utf-8");

            return JSON.parse(data);
        } catch(error) {
            return null;
        }
    },
    getPath: function(directory, source) {
        if(Array.isArray(directory)) {
            return join(FileRoot, ...directory, source);
        } else if(typeof directory === 'string') {
            return join(FileRoot, directory, source);
        } else {
            return FileRoot;
        }
    },
    setRoot: function(root) {
        FileRoot = dirname(fileURLToPath(root));
    }
};