export const Display = function(width, height, type) {
    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d");
    this.type = type;
    this.width = 0;
    this.height = 0;
    this.centerX = 0;
    this.centerY = 0;
    this.color = Display.COLOR.DARK_GRAY;
    this.flipState = Display.STATE.UNFLIPPED;
    this.translateX = 0;
    this.translateY = 0;
    this.resize(width, height);

    if(this.type === Display.TYPE.DISPLAY) {
        this.canvas.oncontextmenu = (event) => { 
            event.preventDefault();
            event.stopPropagation();
        }
    }
}

Display.BASE_SCALE = 1;

Display.COLOR = {
    BLACK: "#000000",
    DARK_GRAY: "#111111"
};

Display.TYPE = {
    BUFFER: 0,
    DISPLAY: 1,
    CUSTOM: 2
};

Display.STATE = {
    UNFLIPPED: 0,
    FLIPPED: 1
};

Display.prototype.save = function() {
    this.context.save();
}

Display.prototype.reset = function() {
    this.context.restore();
    this.flipState = Display.STATE.UNFLIPPED;
    this.translateX = 0;
    this.translateY = 0;
}

Display.prototype.translate = function(translateX, translateY) {
    this.context.translate(translateX, translateY);
    this.translateX = translateX;
    this.translateY = translateY;
}

Display.prototype.flip = function() {
    if(this.flipState === Display.STATE.UNFLIPPED) {
        this.flipState = Display.STATE.FLIPPED;
        this.context.setTransform(-1, 0, 0, 1, this.translateX, this.translateY);
    }
}

Display.prototype.unflip = function() {
    if(this.flipState === Display.STATE.FLIPPED) {
        this.flipState = Display.STATE.UNFLIPPED;
        this.context.setTransform(1, 0, 0, 1, this.translateX, this.translateY);
    }
}

Display.prototype.clear = function() {
    this.context.fillStyle = this.color;
    this.context.fillRect(0, 0, this.width, this.height);
}

Display.prototype.resize = function(width, height) {
    this.clear();
    this.canvas.width = width;
    this.canvas.height = height;
    this.width = width;
    this.height = height;
    this.centerX = width / 2;
    this.centerY = height / 2;
    this.context.imageSmoothingEnabled = false;
}

Display.prototype.getImageData = function() {
    return this.context.getImageData(0, 0, this.width, this.height);
}

Display.prototype.stackAlpha = function(alpha) {
    const nextAlpha = alpha * this.context.globalAlpha;

    if(nextAlpha < 0) {
        this.context.globalAlpha = 0;
    } else if(nextAlpha > 1) {
        this.context.globalAlpha = 1;
    } else {
        this.context.globalAlpha = nextAlpha;
    }
}

Display.prototype.setAlpha = function(alpha) {
    if(alpha >= 0 && alpha <= 1) {
        this.context.globalAlpha = alpha;
    }
}

Display.prototype.getScale = function(targetWidth, targetHeight) {
    let scale = Display.BASE_SCALE;
    let scaleX = targetWidth / this.width;
    let scaleY = targetHeight / this.height;

    if(scaleX < scaleY) {
        scale = scaleX;
    } else {
        scale = scaleY;
    }

    if(scale < Display.BASE_SCALE) {
        scale = Display.BASE_SCALE;
    }

    return scale;
}

Display.prototype.copyTo = function(target, width, height) {
    target.context.drawImage(
        this.canvas,
        0, 0, this.width, this.height,
        0, 0, width, height
    );
}

Display.prototype.toDocument = function() {
    this.canvas.style.position = "absolute";
    
    document.body.appendChild(this.canvas);
}