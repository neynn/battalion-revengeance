export const TextureHandle = function() {
    this.state = TextureHandle.STATE.EMPTY;
    this.references = 0;
    this.width = 0;
    this.height = 0;
    this.bitmap = null;
}

TextureHandle.STATE = {
    EMPTY: 0,
    LOADING: 1,
    LOADED: 2
};

TextureHandle.prototype.clear = function() {
    this.state = TextureHandle.STATE.EMPTY;
    this.references = 0;
    this.width = 0;
    this.height = 0;
    this.bitmap = null;
}

TextureHandle.prototype.setImage = function(bitmap) {
    this.state = TextureHandle.STATE.LOADED;
    this.width = bitmap.width;
    this.height = bitmap.height;
    this.bitmap = bitmap;
}

TextureHandle.prototype.addReference = function() {
    return this.references++;
}

TextureHandle.prototype.removeReference = function() {
    const references = this.references - 1;

    if(references === 0) {
        this.clear();
    }

    this.references = references;

    return references;
}

TextureHandle.prototype.getBytes = function() {
    return this.width * this.height * 4;
}