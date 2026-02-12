import { createBitmapData, mapBitmap } from "../graphics/colorHelper.js";

export const Texture = function(id, name, path) {
    this.id = id;
    this.name = name;
    this.path = path;
    this.bitmap = null;
    this.references = 0;
    this.width = 0;
    this.height = 0;
    this.state = Texture.STATE.EMPTY;
}

Texture.STATE = {
    EMPTY: 0,
    LOADING: 1,
    LOADED: 2
};

Texture.ERROR_CODE = {
    NONE: "NONE",
    ERROR_IMAGE_LOAD: "LOAD_ERROR",
    ERROR_NO_PATH: "NO_PATH",
    ERROR_IMAGE_ALREADY_LOADED: "ALREADY_LOADED",
    ERROR_IMAGE_IS_LOADING: "IS_LOADING"
};

Texture.createImageData = function(bitmap) {
    const { width, height } = bitmap;
    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    context.imageSmoothingEnabled = false;
    context.drawImage(bitmap, 0, 0);

    const imageData = context.getImageData(0, 0, width, height);
    const pixelArray = imageData.data;

    return pixelArray;
}

Texture.prototype.getSizeBytes = function() {
    return this.width * this.height * 4;
}

Texture.prototype.loadColoredImage = function(copyBitmap, schema) {
    if(this.state === Texture.STATE.EMPTY) {
        this.state = Texture.STATE.LOADING;

        const bitmapData = createBitmapData(copyBitmap);
        const mappedData = mapBitmap(bitmapData, schema);

        createImageBitmap(mappedData)
        .then(bitmap => this.setBitmapData(bitmap))
        .catch(error => this.clear());
    }
}

Texture.prototype.isState = function(state) {
    return this.state === state;
}

Texture.prototype.clear = function() {
    this.bitmap = null;
    this.state = Texture.STATE.EMPTY;
}

Texture.prototype.getLoadingError = function() {
    if(!this.path) {
        return Texture.ERROR_CODE.ERROR_NO_PATH;
    }

    if(this.state === Texture.STATE.LOADING) {
        return Texture.ERROR_CODE.ERROR_IMAGE_IS_LOADING;
    }

    if(this.bitmap) {
        return Texture.ERROR_CODE.ERROR_IMAGE_ALREADY_LOADED;
    }

    return Texture.ERROR_CODE.NONE;
}

Texture.prototype.requestBitmap = function() {
    const errorCode = this.getLoadingError();

    if(errorCode !== Texture.ERROR_CODE.NONE) {
        return Promise.reject(errorCode);
    }

    this.state = Texture.STATE.LOADING;

    return fetch(this.path)
    .then((response) => {
        if(response.ok) {
            return response.blob();
        }

        return Promise.reject(Texture.ERROR_CODE.ERROR_IMAGE_LOAD);
    })
    .then((blob) => createImageBitmap(blob))
    .then((bitmap) => {
        this.setBitmapData(bitmap);
    
        return Promise.resolve(bitmap);
    })
    .catch((error) => {
        this.state = Texture.STATE.EMPTY;

        return Promise.reject(error);
    });
};

Texture.prototype.clear = function() {
    this.bitmap = null;
    this.width = 0;
    this.height = 0;
    this.state = Texture.STATE.EMPTY;
}

Texture.prototype.setImageData = function(bitmap, width, height) {
    this.bitmap = bitmap;
    this.width = width;
    this.height = height;
    this.state = Texture.STATE.LOADED;
}

Texture.prototype.addReference = function() {
    return this.references++;
}

Texture.prototype.removeReference = function() {
    if(this.references === 1) {
        this.clear();
    }

    return this.references--;
}

Texture.prototype.getID = function() {
    return this.id;
}

Texture.prototype.setBitmapData = function(bitmap) {
    const { width, height } = bitmap;

    this.setImageData(bitmap, width, height);
}