export const InputBind = function() {
    this.key = "";
    this.keyID = -1;
    this.type = InputBind.TYPE.KEY;
    this.condition = InputBind.CONDITION.DOWN;
    this.commandID = -1;
}

InputBind.TYPE = {
    KEY: 0,
    BUTTON: 1
};

InputBind.CONDITION = {
    _INVALID: -1,
    DOWN: 0,
    UP: 1,
    HOLD: 2,
    _COUNT: 3 
};