export const InputRouter = function() {
    this.binds = new Map();
    this.commands = new Map();
    this.keybinds = {};
    this.usedKeys = new Set();
}

InputRouter.PREFIX = {
    DOWN: "+",
    UP: "-",
    HOLD: "~"
};

InputRouter.CURSOR_INPUT = {
    M1: "M1",
    M2: "M2",
    M3: "M3"
};

InputRouter.isPrefix = function(key) {
    switch(key) {
        case InputRouter.PREFIX.DOWN: return true;
        case InputRouter.PREFIX.UP: return true;
        case InputRouter.PREFIX.HOLD: return true;
        default: return false;
    }
}

InputRouter.prototype.clear = function(gameContext) {
    const { client } = gameContext;
    const { keyboard } = client;

    for(const key of this.usedKeys) {
        keyboard.free(key);
    }

    this.binds.clear();
    this.commands.clear();
    this.usedKeys.clear();
}

InputRouter.prototype.createKeybind = function(keybind, commandID) {
    const length = keybind.length;

    if(length === 0) {
        return;
    }

    const prefix = keybind[0];
    const isPrefixed = length > 1 && InputRouter.isPrefix(prefix);
    let key = keybind;

    if(isPrefixed) {
        key = keybind.slice(1);

        this.bindKey(prefix, key, commandID);
    } else {
        this.bindKey(InputRouter.PREFIX.DOWN, keybind, commandID);
        this.bindKey(InputRouter.PREFIX.UP, keybind, commandID);
    }

    if(InputRouter.CURSOR_INPUT[key] === undefined) {
        this.usedKeys.add(key);
    }
}

InputRouter.prototype.load = function(keybinds) {
    if(keybinds) {
        this.keybinds = keybinds;
    }
}

InputRouter.prototype.bind = function(gameContext, tableID) {
    const { client } = gameContext;
    const { keyboard } = client;
    const keybinds = this.keybinds[tableID];

    if(!keybinds) {
        return;
    }

    for(const commandID in keybinds) {
        const keybind = keybinds[commandID];
        
        if(Array.isArray(keybind)) {
            for(let i = 0; i < keybind.length; i++) {
                this.createKeybind(keybind[i], commandID);
            }
        } else if(typeof keybind === "string") {
            this.createKeybind(keybind, commandID);
        } else {
            console.warn("Invalid input type!");
        }
    }

    for(const key of this.usedKeys) {
        keyboard.reserve(key);
    }
} 

InputRouter.prototype.bindKey = function(prefix, key, commandID) {
    const keybind = prefix + key;
    const commandList = this.binds.get(keybind);

    if(!commandList) {
        this.binds.set(keybind, [commandID]);
    } else {
        commandList.push(commandID);
    }
}

InputRouter.prototype.on = function(commandID, command) {
    if(this.commands.has(commandID) || typeof command !== "function") {
        return;
    }

    this.commands.set(commandID, command);
}

InputRouter.prototype.handleInput = function(prefix, inputID) {
    const prefixedID = prefix + inputID;
    const commandList = this.binds.get(prefixedID);

    if(!commandList) {
        return;
    }

    for(let i = 0; i < commandList.length; i++) {
        const commandID = commandList[i];
        const command = this.commands.get(commandID);

        if(command) {
            command();
        }
    }
}