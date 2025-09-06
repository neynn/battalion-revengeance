import { EventEmitter } from "../events/eventEmitter.js";
import { MouseButton } from "./mouseButton.js";

export const Cursor = function() {
    this.positionX = 0;
    this.positionY = 0;
    this.radius = 0;
    this.isLocked = false;

    this.buttons = [];
    this.buttons[Cursor.BUTTON.LEFT] = new MouseButton();
    this.buttons[Cursor.BUTTON.MIDDLE] = new MouseButton();
    this.buttons[Cursor.BUTTON.RIGHT] = new MouseButton();

    this.addEventHandler("mousedown", event => this.eventMouseDown(event));
    this.addEventHandler("mouseup", event => this.eventMouseUp(event));
    this.addEventHandler("mousemove", event => this.eventMouseMove(event)); 
    this.addEventHandler("wheel", event => this.eventMouseScroll(event));
    this.addEventHandler("pointerlockchange", event => this.eventPointerLockChange(event));
    this.addEventHandler("contextmenu", event => event);

    this.events = new EventEmitter();
    this.events.listen(Cursor.EVENT.BUTTON_UP);
    this.events.listen(Cursor.EVENT.BUTTON_DOWN);
    this.events.listen(Cursor.EVENT.BUTTON_CLICK);
    this.events.listen(Cursor.EVENT.BUTTON_DRAG);
    this.events.listen(Cursor.EVENT.BUTTON_HOLD);
    this.events.listen(Cursor.EVENT.SCROLL);
    this.events.listen(Cursor.EVENT.MOVE);
}

Cursor.EVENT = {
    BUTTON_UP: "BUTTON_UP",
    BUTTON_DOWN: "BUTTON_DOWN",
    BUTTON_CLICK: "BUTTON_CLICK",
    BUTTON_DRAG: "BUTTON_DRAG",
    BUTTON_HOLD: "BUTTON_HOLD",
    SCROLL: "SCROLL",
    MOVE: "MOVE"
};

Cursor.BUTTON = {
    LEFT: 0,
    MIDDLE: 1,
    RIGHT: 2,
    MOUSE_4: 3,
    MOUSE_5: 4
};

Cursor.SCROLL = {
    UP: 0,
    DOWN: 1
};

Cursor.prototype.addEventHandler = function(type, onEvent) {
    document.addEventListener(type, (event) => {
        event.preventDefault();
        onEvent(event);
    });
}

Cursor.prototype.eventMouseMove = function(event) {
    const { pageX, pageY, movementX, movementY } = event;
    const deltaX = this.isLocked ? - movementX : this.positionX - pageX;
    const deltaY = this.isLocked ? - movementY : this.positionY - pageY;

    for(let i = 0; i < this.buttons.length; i++) {
        const button = this.buttons[i];

        button.onMouseMove(deltaX, deltaY);

        if(button.state === MouseButton.STATE.DRAG) {
            this.events.emit(Cursor.EVENT.BUTTON_DRAG, i, deltaX, deltaY);
        }
    }

    this.positionX = pageX;
    this.positionY = pageY;
    this.events.emit(Cursor.EVENT.MOVE, deltaX, deltaY);
}

Cursor.prototype.eventMouseDown = function(event) {
    const buttonID = event.button;

    if(buttonID < 0 || buttonID >= this.buttons.length) {
        return;
    }

    const button = this.buttons[buttonID];

    this.events.emit(Cursor.EVENT.BUTTON_DOWN, buttonID, this.positionX, this.positionY);

    button.onMouseDown();
}   

Cursor.prototype.eventMouseUp = function(event) {
    const buttonID = event.button;

    if(buttonID < 0 || buttonID >= this.buttons.length) {
        return;
    }

    const button = this.buttons[buttonID];

    if(button.state !== MouseButton.STATE.DRAG) {
        this.events.emit(Cursor.EVENT.BUTTON_CLICK, buttonID, this.positionX, this.positionY);
    }

    this.events.emit(Cursor.EVENT.BUTTON_UP, buttonID, this.positionX, this.positionY);
    
    button.onMouseUp();
}

Cursor.prototype.eventMouseScroll = function(event) {
    const { deltaY } = event;
    const direction = deltaY < 0 ? Cursor.SCROLL.UP : Cursor.SCROLL.DOWN;

    this.events.emit(Cursor.EVENT.SCROLL, direction, deltaY);
}

Cursor.prototype.eventPointerLockChange = function(event) {}

Cursor.prototype.lock = function(target) {
    if(!this.isLocked) {
        target.requestPointerLock();
        this.isLocked = true;
    }
}

Cursor.prototype.unlock = function() {
    if(this.isLocked) {
        document.exitPointerLock();
        this.isLocked = false;
    }
}

Cursor.prototype.update = function() {
    for(let i = 0; i < this.buttons.length; i++) {
        const button = this.buttons[i];

        if(button.state !== MouseButton.STATE.UP) {
            this.events.emit(Cursor.EVENT.BUTTON_HOLD, i);
        }
    }
}