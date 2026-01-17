import { GenericMenu } from "../genericMenu.js";
import { createGenericButton } from "../uiHelper.js";

export const ArenaLobby = function() {
    GenericMenu.call(this, "ArenaLobby");

    this.button = createGenericButton();
    this.image = new Image();
    this.image.src = "assets/gui/background.png";
    this.image.onload = () => {
        this.element.style.width = this.image.width + "px";
        this.element.style.height = this.image.height + "px";
        this.element.style.top = `calc(50% - ${this.image.height / 2}px)`;
        this.element.style.left = `calc(50% - ${this.image.width / 2}px)`;
        this.element.appendChild(this.image);
    };

    this.addButton(this.button);
}

ArenaLobby.prototype = Object.create(GenericMenu.prototype);
ArenaLobby.prototype.constructor = ArenaLobby;