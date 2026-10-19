import { KEY, getKeyByCode } from "./input_constants.js";

export const Keyboard = function() {
    this.keyFlags = new Uint8Array(KEY._COUNT);
    this.keyStates = new Uint8Array(KEY._COUNT * 2);

    document.addEventListener("keydown", (event) => this.onKeyDown(event));
    document.addEventListener("keyup", (event) => this.onKeyUp(event));
    document.addEventListener("blur", (event) => this.upAllKeys());
    document.addEventListener("focus", (event) => this.upAllKeys());
}

Keyboard.KEY_STATE = {
    UP: 0,
    DOWN: 1
};

Keyboard.KEY_FLAG = {
    NONE: 0,
    NO_DEFAULT: 1 << 0
};

Keyboard.prototype.upAllKeys = function() {
    for(let i = 0; i < KEY._COUNT; i++) {
        this.keyStates[i] = Keyboard.KEY_STATE.UP;
    }
}

Keyboard.prototype.exit = function() {
    for(let i = 0; i < KEY._COUNT; i++) {
        this.keyStates[i] = Keyboard.KEY_STATE.UP;
        this.keyStates[i + KEY._COUNT] = Keyboard.KEY_STATE.UP;
        this.keyFlags[i] = Keyboard.KEY_FLAG.NONE;
    }
}

Keyboard.prototype.isKeyPressed = function(keyID) {
    if(keyID < 0 || keyID >= KEY._COUNT) {
        return false;
    }

    return this.keyStates[keyID] === Keyboard.KEY_STATE.DOWN && this.keyStates[keyID + KEY._COUNT] === Keyboard.KEY_STATE.UP;
}

Keyboard.prototype.isKeyReleased = function(keyID) {
    if(keyID < 0 || keyID >= KEY._COUNT) {
        return false;
    }

    return this.keyStates[keyID] === Keyboard.KEY_STATE.UP && this.keyStates[keyID + KEY._COUNT] === Keyboard.KEY_STATE.DOWN;
}

Keyboard.prototype.isKeyHeld = function(keyID) {
    if(keyID < 0 || keyID >= KEY._COUNT) {
        return false;
    }

    return this.keyStates[keyID] === Keyboard.KEY_STATE.DOWN;
}

Keyboard.prototype.updateKeyStates = function() {
    //The current key state gets put as the previous one.
    for(let i = 0; i < KEY._COUNT; i++) {
        this.keyStates[i + KEY._COUNT] = this.keyStates[i];
    }
}

Keyboard.prototype.onKeyDown = function(event) {
    const keyCode = event.key;
    const keyID = getKeyByCode(keyCode);

    if(keyID !== KEY._INVALID) {
        const keyState = this.keyStates[keyID];
        const keyFlags = this.keyFlags[keyID];

        if(keyFlags & Keyboard.KEY_FLAG.NO_DEFAULT) {
            event.preventDefault();
        }

        if(!event.repeat) {
            this.keyStates[keyID] = Keyboard.KEY_STATE.DOWN;
        }
    }
}

Keyboard.prototype.onKeyUp = function(event) {
    const keyCode = event.key;
    const keyID = getKeyByCode(keyCode);

    if(keyID !== KEY._INVALID) {
        const keyState = this.keyStates[keyID];
        const keyFlags = this.keyFlags[keyID];

        if(keyFlags & Keyboard.KEY_FLAG.NO_DEFAULT) {
            event.preventDefault();
        }

        this.keyStates[keyID] = Keyboard.KEY_STATE.UP;
    }
}

Keyboard.prototype.reserve = function(keyID) {
    if(keyID >= 0 && keyID < KEY._COUNT) {    
        this.keyFlags[keyID] |= Keyboard.KEY_FLAG.NO_DEFAULT;
    }
}

Keyboard.prototype.free = function(keyID) {
    if(keyID >= 0 && keyID < KEY._COUNT) {    
        this.keyFlags[keyID] &= ~Keyboard.KEY_FLAG.NO_DEFAULT;
    }
}