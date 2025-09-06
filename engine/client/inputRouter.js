export const InputRouter = function() {
    this.binds = new Map();
    this.commands = new Map();
    this.keybinds = {};
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

InputRouter.prototype.clear = function(gameContext) {
    const { client } = gameContext;
    const { keyboard } = client;

    for(const [inputID, commandList] of this.binds) {
        const keyID = inputID.slice(1);

        if(InputRouter.CURSOR_INPUT[keyID] === undefined) {
            keyboard.free(keyID);
        }
    }

    this.binds.clear();
    this.commands.clear();
}

InputRouter.prototype.loadInput = function(keyboard, inputID, commandID) {
    if(inputID.length === 0) {
        return;
    }

    const prefixID = inputID[0];
    const isPrefixed = inputID.length > 1 && (prefixID === InputRouter.PREFIX.DOWN || prefixID === InputRouter.PREFIX.UP || prefixID === InputRouter.PREFIX.HOLD);

    if(isPrefixed) {
        const keyID = inputID.slice(1);

        this.bindInput(inputID, commandID);

        if(InputRouter.CURSOR_INPUT[keyID] === undefined) {
            keyboard.reserve(keyID);
        }
    } else {
        this.bindInput(InputRouter.PREFIX.DOWN + inputID, commandID);
        this.bindInput(InputRouter.PREFIX.UP + inputID, commandID);

        if(InputRouter.CURSOR_INPUT[inputID] === undefined) {
            keyboard.reserve(inputID);
        }
    }
}

InputRouter.prototype.load = function(keybinds) {
    if(keybinds) {
        this.keybinds = keybinds;
    }
}

InputRouter.prototype.bind = function(gameContext, id) {
    const binds = this.keybinds[id];

    if(binds) {
        const { client } = gameContext;
        const { keyboard } = client;

        for(const commandID in binds) {
            const input = binds[commandID];
            
            switch(typeof input) {
                case "object": {
                    for(let i = 0; i < input.length; i++) {
                        const inputID = input[i];

                        this.loadInput(keyboard, inputID, commandID);
                    }
                    break;
                }
                case "string": {
                    this.loadInput(keyboard, input, commandID);
                    break;
                }
                default: {
                    console.warn("Invalid input type!");
                    break;
                }
            }
        }
    }
}

InputRouter.prototype.bindInput = function(inputID, commandID) {
    const commandList = this.binds.get(inputID);

    if(!commandList) {
        this.binds.set(inputID, [commandID]);
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

        this.execute(commandID);
    }
}

InputRouter.prototype.execute = function(commandID) {
    const command = this.commands.get(commandID);

    if(command) {
        command();
    }
}