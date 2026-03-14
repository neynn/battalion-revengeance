import { EventEmitter } from "../../events/eventEmitter.js";
import { MouseClickEvent } from "./events/click.js";
import { MouseDownEvent } from "./events/down.js";
import { MouseDragEvent } from "./events/drag.js";
import { MouseScrollEvent } from "./events/scroll.js";
import { MouseUpEvent } from "./events/up.js";
import { MouseButton } from "./mouseButton.js";

export const Cursor = function() {
    this.positionX = 0;
    this.positionY = 0;
    this.radius = 0;
    this.isPointerLocked = false;
    this.buttons = [];

    for(let i = 0; i < Cursor.BUTTON._COUNT; i++) {
        this.buttons[i] = new MouseButton();
    }

    this.addEventHandler("mousedown", event => this.eventMouseDown(event));
    this.addEventHandler("mouseup", event => this.eventMouseUp(event));
    this.addEventHandler("mousemove", event => this.eventMouseMove(event)); 
    this.addEventHandler("wheel", event => this.eventMouseScroll(event));
    this.addEventHandler("contextmenu", event => event);

    this.events = new EventEmitter();
    this.events.register(Cursor.EVENT.BUTTON_UP);
    this.events.register(Cursor.EVENT.BUTTON_DOWN);
    this.events.register(Cursor.EVENT.BUTTON_CLICK);
    this.events.register(Cursor.EVENT.DRAG);
    this.events.register(Cursor.EVENT.SCROLL);

    this.dragEvent = new MouseDragEvent();
    this.clickEvent = new MouseClickEvent();
    this.downEvent = new MouseDownEvent();
    this.upEvent = new MouseUpEvent();
    this.scrollEvent = new MouseScrollEvent();
}

Cursor.EVENT = {
    BUTTON_UP: "BUTTON_UP",
    BUTTON_DOWN: "BUTTON_DOWN",
    BUTTON_CLICK: "BUTTON_CLICK",
    DRAG: "DRAG",
    SCROLL: "SCROLL"
};

Cursor.BUTTON = {
    _INVALID: -1,
    LEFT: 0,
    MIDDLE: 1,
    RIGHT: 2,
    MOUSE_4: 3,
    MOUSE_5: 4,
    _COUNT: 5
};

Cursor.SCROLL = {
    UP: 0,
    DOWN: 1
};

Cursor.prototype.getFlags = function(button) {
    if(index < 0 || index >= Cursor.BUTTON._COUNT) {
        return 0;
    } 

    return this.buttons[button].flags;
}

Cursor.prototype.addEventHandler = function(type, onEvent) {
    document.addEventListener(type, (event) => {
        event.preventDefault();
        onEvent(event);
    }, { passive: false });
}

Cursor.prototype.eventMouseMove = function(event) {
    const { pageX, pageY, movementX, movementY } = event;
    const deltaX = this.isPointerLocked ? - movementX : this.positionX - pageX;
    const deltaY = this.isPointerLocked ? - movementY : this.positionY - pageY;

    for(let i = 0; i < this.buttons.length; i++) {
        const button = this.buttons[i];

        button.onMouseMove(deltaX, deltaY);

        if(button.flags & MouseButton.FLAG.DRAG) {
            this.dragEvent.update(i, deltaX, deltaY);
            this.events.emit(Cursor.EVENT.DRAG, this.dragEvent);
        }
    }

    this.positionX = pageX;
    this.positionY = pageY;
}

Cursor.prototype.eventMouseDown = function(event) {
    const buttonID = event.button;

    if(buttonID < 0 || buttonID >= this.buttons.length) {
        return;
    }

    const button = this.buttons[buttonID];

    this.downEvent.update(buttonID, this.positionX, this.positionY, this.radius);
    this.events.emit(Cursor.EVENT.BUTTON_DOWN, this.downEvent);

    button.onMouseDown();
}   

Cursor.prototype.eventMouseUp = function(event) {
    const buttonID = event.button;

    if(buttonID < 0 || buttonID >= this.buttons.length) {
        return;
    }

    const button = this.buttons[buttonID];

    if(!(button.flags & MouseButton.FLAG.DRAG)) {
        this.clickEvent.update(buttonID, this.positionX, this.positionY, this.radius);
        this.events.emit(Cursor.EVENT.BUTTON_CLICK, this.clickEvent);
    }

    this.upEvent.update(buttonID, this.positionX, this.positionY, this.radius);
    this.events.emit(Cursor.EVENT.BUTTON_UP, this.upEvent);
    
    button.onMouseUp();
}

Cursor.prototype.eventMouseScroll = function(event) {
    const { deltaY } = event;
    const direction = deltaY < 0 ? Cursor.SCROLL.UP : Cursor.SCROLL.DOWN;

    this.scrollEvent.update(direction, deltaY);
    this.events.emit(Cursor.EVENT.SCROLL, this.scrollEvent);
}