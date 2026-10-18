export const InputRouter = function() {
    this.commands = new Map();
    this.keybinds = {};
    this.usedKeys = new Set();

    this.binds = [];
    this.binds[InputRouter.PREFIX.DOWN] = new Map();
    this.binds[InputRouter.PREFIX.UP] = new Map();
    this.binds[InputRouter.PREFIX.HOLD] = new Map();
}

InputRouter.PREFIX = {
    DOWN: 0,
    UP: 1,
    HOLD: 2,
    _COUNT: 3 
};

InputRouter.CURSOR_INPUT = {
    M1: "M1",
    M2: "M2",
    M3: "M3"
};

const charToPrefix = function(key) {
    switch(key) {
        case "+": return InputRouter.PREFIX.DOWN;
        case "-": return InputRouter.PREFIX.UP;
        case "~": return InputRouter.PREFIX.HOLD;
        default: return -1;
    }
}

InputRouter.prototype.clear = function(gameContext) {
    const { client } = gameContext;
    const { keyboard } = client;

    for(const key of this.usedKeys) {
        keyboard.free(key);
    }

    for(let i = 0; i < InputRouter.PREFIX._COUNT; i++) {
        this.binds[i].clear();
    }

    this.commands.clear();
    this.usedKeys.clear();
}

InputRouter.prototype.createKeybind = function(keybind, commandID) {
    const length = keybind.length;

    if(length === 0) {
        return;
    }

    const prefixID = charToPrefix(keybind[0]);
    const isPrefixed = length > 1 && prefixID !== -1;
    let key = keybind;

    if(isPrefixed) {
        key = keybind.slice(1);

        this.bindKey(prefixID, key, commandID);
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

InputRouter.prototype.bindKey = function(prefixID, key, commandID) {
    if(prefixID < 0 || prefixID >= InputRouter.PREFIX._COUNT) {
        return;
    }

    const bindsCategory = this.binds[prefixID];
    const commandList = bindsCategory.get(key);

    if(!commandList) {
        bindsCategory.set(key, [commandID]);
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

InputRouter.prototype.handleInput = function(prefixID, key) {
    if(prefixID < 0 || prefixID >= InputRouter.PREFIX._COUNT) {
        return;
    }

    const bindsCategory = this.binds[prefixID];
    const commandList = bindsCategory.get(key);

    if(!commandList) {
        return;
    }

    for(const commandID of commandList) {
        const command = this.commands.get(commandID);

        if(command) {
            command();
        }
    }
}