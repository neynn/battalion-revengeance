import { Cursor, getButtonByCode } from "./cursor/cursor.js";
import { charToCondition, InputBind } from "./inputBind.js";
import { getKeyByCode, KEY } from "./keyboard.js";

const NOT_TRIGGERED = 0;
const TRIGGERED = 1;
const MAX_COMMANDS = 100;

export const InputRouter = function() {
    this.commandCallbacks = new Map();
    this.binds = [];
    this.keybinds = {};
    this.commands = new Uint8Array(MAX_COMMANDS);
    this.usedKeys = new Set();
}

InputRouter.prototype.triggerCommand = function(commandID) {
    if(commandID < 0 || commandID >= MAX_COMMANDS) {
        return;
    }

    this.commands[commandID] = TRIGGERED;

    const command = this.commandCallbacks.get(commandID);

    if(command) {
        command();
    }
}

InputRouter.prototype.updateTriggers = function(keyboard, cursor) {
    for(let i = 0; i < MAX_COMMANDS; i++) {
        this.commands[i] = NOT_TRIGGERED;
    } 

    for(let i = 0; i < this.binds.length; i++) {
        const { type, commandID, keyID, key, condition } = this.binds[i];

        switch(condition) {
            case InputBind.CONDITION.DOWN: {
                switch(type) {
                    case InputBind.TYPE.KEY: {
                        if(keyboard.isKeyPressed(keyID)) {
                            this.triggerCommand(commandID);
                        }
                        break;
                    }
                    case InputBind.TYPE.BUTTON: {
                        if(cursor.isButtonPressed(keyID)) {
                            this.triggerCommand(commandID);
                        }
                        break;
                    }
                }
                break;
            }
            case InputBind.CONDITION.UP: {
                switch(type) {
                    case InputBind.TYPE.KEY: {
                        if(keyboard.isKeyReleased(keyID)) {
                            this.triggerCommand(commandID);
                        }
                        break;
                    }
                    case InputBind.TYPE.BUTTON: {
                        if(cursor.isButtonReleased(keyID)) {
                            this.triggerCommand(commandID);
                        }
                        break;
                    }
                }
                break;
            }
            case InputBind.CONDITION.HOLD: {
                switch(type) {
                    case InputBind.TYPE.KEY: {
                        if(keyboard.isKeyHeld(keyID)) {
                            this.triggerCommand(commandID);
                        }
                        break;
                    }
                    case InputBind.TYPE.BUTTON: {
                        if(cursor.isButtonHeld(keyID)) {
                            this.triggerCommand(commandID);
                        }
                        break;
                    }
                }
                break;
            }
        }
    }
} 

InputRouter.prototype.isTriggered = function(commandID) {
    if(commandID < 0 || commandID >= MAX_COMMANDS) {
        return false;
    }

    return this.commands[commandID] === TRIGGERED;
}

InputRouter.prototype.clear = function(gameContext) {
    const { client } = gameContext;
    const { keyboard } = client;

    for(const key of this.usedKeys) {
        keyboard.free(key);
    }

    this.binds.length = 0;
    this.commandCallbacks.clear();
    this.usedKeys.clear();
}

InputRouter.prototype.useConfig = function(gameContext, tableID, commandTable) {
    const { client } = gameContext;
    const { keyboard } = client;
    const keybinds = this.keybinds[tableID];

    if(!keybinds) {
        return;
    }

    for(const commandName in keybinds) {
        const commandID = commandTable[commandName];
        
        //If the command is unknown to the engine, the registration gets skipped.
        if(commandID === undefined || commandID < 0 || commandID >= MAX_COMMANDS) {
            continue;
        }
        
        const keybind = keybinds[commandName];
        
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

InputRouter.prototype.createKeybind = function(keybind, commandID) {
    const length = keybind.length;

    if(length === 0) {
        return;
    }
    
    const condition = charToCondition(keybind[0]);
    const isPrefixed = length > 1 && condition !== -1;
    let key = keybind;

    if(isPrefixed) {
        key = keybind.slice(1);

        this.bindKey(condition, key, commandID);
    } else {
        this.bindKey(InputBind.CONDITION.DOWN, keybind, commandID);
        this.bindKey(InputBind.CONDITION.UP, keybind, commandID);
    }
}

InputRouter.prototype.bindKey = function(condition, key, commandID) {
    if(condition < 0 || condition >= InputBind.CONDITION._COUNT) {
        return;
    }

    let keyID = -1;
    let type = -1;
    const keyboardID = getKeyByCode(key);
    
    if(keyboardID !== KEY._INVALID) {
        keyID = keyboardID; 
        type = InputBind.TYPE.KEY;

        this.usedKeys.add(keyID);
    } else {
        const buttonID = getButtonByCode(key);
        
        //No valid binding found!
        if(buttonID === Cursor.BUTTON._INVALID) {
            return;
        }
        
        keyID = buttonID;
        type = InputBind.TYPE.BUTTON;
    }
    
    const inputBind = new InputBind();

    inputBind.keyID = keyID;
    inputBind.type = type;
    inputBind.key = key;
    inputBind.condition = condition;
    inputBind.commandID = commandID;

    this.binds.push(inputBind);
}

InputRouter.prototype.on = function(commandID, command) {
    if(this.commandCallbacks.has(commandID) || typeof command !== "function") {
        return;
    }

    this.commandCallbacks.set(commandID, command);
}

InputRouter.prototype.load = function(keybinds) {
    if(keybinds) {
        this.keybinds = keybinds;
    }
}
