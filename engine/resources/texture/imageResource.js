export const ImageResource = function() {
    this.state = ImageResource.STATE.EMPTY;
    this.references = 0;
    this.width = 0;
    this.height = 0;
    this.bitmap = null;
}

ImageResource.STATE = {
    EMPTY: 0,
    LOADING: 1,
    LOADED: 2
};

ImageResource.prototype.clear = function() {
    this.state = ImageResource.STATE.EMPTY;
    this.references = 0;
    this.width = 0;
    this.height = 0;
    this.bitmap = null;
}

ImageResource.prototype.setData = function(bitmap) {
    this.state = ImageResource.STATE.LOADED;
    this.width = bitmap.width;
    this.height = bitmap.height;
    this.bitmap = bitmap;
}

ImageResource.prototype.getBytes = function() {
    return this.width * this.height * 4;
}

ImageResource.prototype.addReference = function() {
    return this.references++;
}

ImageResource.prototype.removeReference = function() {
    const references = this.references - 1;

    if(references === 0) {
        this.clear();
    }

    this.references = references;

    return references;
}