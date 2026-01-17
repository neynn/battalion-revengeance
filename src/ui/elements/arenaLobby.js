import { Socket } from "../../../engine/network/socket.js";
import { BattalionContext } from "../../battalionContext.js";
import { GAME_EVENT } from "../../enums.js";
import { GenericMenu } from "../genericMenu.js";
import { createGenericButton, getNextX, placeButton } from "../uiHelper.js";

export const ArenaLobby = function() {
    GenericMenu.call(this, "ArenaLobby");

    this.background = new Image();
    this.element.appendChild(this.background);
    this.buttons = [];

    for(let i = 0; i < ArenaLobby.BUTTON.COUNT; i++) {
        const button = createGenericButton();

        this.buttons.push(button);
        this.element.appendChild(button.element);
    }
}

ArenaLobby.BUTTON = {
    BACK: 0,
    CREATE: 1,
    JOIN: 2,
    CONNECT: 3,
    LEAVE: 4,
    START: 5,
    COUNT: 6
};

ArenaLobby.prototype = Object.create(GenericMenu.prototype);
ArenaLobby.prototype.constructor = ArenaLobby;

ArenaLobby.prototype.loadEvents = function(gameContext) {
    const { client } = gameContext;
    const { socket } = client;

    socket.events.on(Socket.EVENT.CONNECTED_TO_SERVER, ({ id }) => {
        this.buttons[ArenaLobby.BUTTON.LEAVE].enable();
        this.buttons[ArenaLobby.BUTTON.JOIN].enable();
        this.buttons[ArenaLobby.BUTTON.CREATE].enable();
        this.buttons[ArenaLobby.BUTTON.START].enable();
        this.buttons[ArenaLobby.BUTTON.CONNECT].disable();
    });

    socket.events.on(Socket.EVENT.DISCONNECTED_FROM_SERVER, ({ id }) => {
        this.buttons[ArenaLobby.BUTTON.LEAVE].disable();
        this.buttons[ArenaLobby.BUTTON.JOIN].disable();
        this.buttons[ArenaLobby.BUTTON.CREATE].disable();
        this.buttons[ArenaLobby.BUTTON.START].disable();
        this.buttons[ArenaLobby.BUTTON.CONNECT].enable();
    });
}

ArenaLobby.prototype.init = function(gameContext) {
    const { client } = gameContext;
    const { socket } = client;
    const backButton = this.buttons[ArenaLobby.BUTTON.BACK];
    const createButton = this.buttons[ArenaLobby.BUTTON.CREATE];
    const joinButton = this.buttons[ArenaLobby.BUTTON.JOIN];
    const leaveButton = this.buttons[ArenaLobby.BUTTON.LEAVE];
    const connectButton = this.buttons[ArenaLobby.BUTTON.CONNECT];
    const startButton = this.buttons[ArenaLobby.BUTTON.START];

    this.background.src = "assets/gui/background.png";
    this.background.style.position = "relative";

    this.background.onload = () => {
        this.element.style.width = this.background.width + "px";
        this.element.style.height = this.background.height + "px";
        this.element.style.top = `calc(50% - ${this.background.height / 2}px)`;
        this.element.style.left = `calc(50% - ${this.background.width / 2}px)`;

        const padding = 10;

        placeButton(backButton, padding, padding);
        placeButton(joinButton, getNextX(joinButton, 1, padding), this.background.height - joinButton.height - padding);
        placeButton(connectButton, this.background.width - connectButton.width - padding, padding);
        placeButton(createButton, this.background.width - createButton.width - padding, this.background.height - createButton.height - padding);
        placeButton(leaveButton, getNextX(leaveButton, 2, padding), this.background.height - leaveButton.height - padding);
        placeButton(startButton, getNextX(startButton, 3, padding), this.background.height - leaveButton.height - padding);
    };

    leaveButton.disable();
    joinButton.disable();
    createButton.disable();
    startButton.disable();

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
}