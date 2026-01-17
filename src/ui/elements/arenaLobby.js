import { BattalionContext } from "../../battalionContext.js";
import { GAME_EVENT } from "../../enums.js";
import { GenericMenu } from "../genericMenu.js";
import { createGenericButton } from "../uiHelper.js";

export const ArenaLobby = function() {
    GenericMenu.call(this, "ArenaLobby");

    this.background = new Image();
    this.element.appendChild(this.background);
    this.buttons = [];
}

ArenaLobby.prototype = Object.create(GenericMenu.prototype);
ArenaLobby.prototype.constructor = ArenaLobby;

ArenaLobby.prototype.addButton = function(button) {
    this.buttons.push(button);
    this.element.appendChild(button.element);
}

ArenaLobby.prototype.init = function(gameContext) {
    const { client } = gameContext;
    const { socket } = client;

    const backButton = createGenericButton();
    const createButton = createGenericButton();
    const joinButton = createGenericButton();
    const leaveButton = createGenericButton();
    const connectButton = createGenericButton();
    const startButton = createGenericButton();

    this.background.src = "assets/gui/background.png";
    this.background.style.position = "relative";

    this.background.onload = () => {
        this.element.style.width = this.background.width + "px";
        this.element.style.height = this.background.height + "px";
        this.element.style.top = `calc(50% - ${this.background.height / 2}px)`;
        this.element.style.left = `calc(50% - ${this.background.width / 2}px)`;

        const padding = 10;
        let step = 1;

        backButton.element.style.position = "absolute";
        backButton.element.style.left = `${padding}px`;
        backButton.element.style.top = `${padding}px`; 

        joinButton.element.style.position = "absolute";
        joinButton.element.style.left = `${padding * step + joinButton.width * (step - 1)}px`;
        joinButton.element.style.top = `${this.background.height - joinButton.height - padding}px`; 

        connectButton.element.style.position = "absolute";
        connectButton.element.style .left = `${this.background.width - connectButton.width - padding}px`;
        connectButton.element.style.top = `${padding}px`;

        createButton.element.style.position = "absolute";
        createButton.element.style.left = `${this.background.width - createButton.width - padding}px`;
        createButton.element.style.top = `${this.background.height - createButton.height - padding}px`; 

        step++;
    
        leaveButton.element.style.position = "absolute";
        leaveButton.element.style.left = `${padding * step + leaveButton.width * (step - 1)}px`;
        leaveButton.element.style.top = `${this.background.height - leaveButton.height - padding}px`; 

        step++;

        startButton.element.style.position = "absolute";
        startButton.element.style.left = `${padding * step + startButton.width * (step - 1)}px`;
        startButton.element.style.top = `${this.background.height - leaveButton.height - padding}px`; 

        step++;
    };

    //startButton.disable();

    backButton.setText("BACK");
    createButton.setText("CREATE");
    joinButton.setText("JOIN");
    connectButton.setText("CONNECT");
    leaveButton.setText("LEAVE");
    startButton.setText("START");

    backButton.addClick((btn) => {
        gameContext.states.setNextState(gameContext, BattalionContext.STATE.MAIN_MENU);
        this.hide();
    });

    createButton.addClick((btn) => {
        socket.createRoom(0);
    });

    joinButton.addClick((btn) => {
        const roomID = parseInt(prompt("Room-ID?", 0));

        socket.joinRoom(roomID);
    });

    connectButton.addClick((btn) => {
        const address = prompt("TO?", "http://localhost:3000");

        socket.connect(address);
    });

    leaveButton.addClick((brn) => {
        socket.leaveRoom();
    });

    startButton.addClick((btn) => {
        socket.messageRoom(GAME_EVENT.MP_CLIENT_START_MATCH, {});
    });

    this.addButton(backButton);
    this.addButton(createButton);
    this.addButton(joinButton);
    this.addButton(connectButton);
    this.addButton(leaveButton);
    this.addButton(startButton);
}