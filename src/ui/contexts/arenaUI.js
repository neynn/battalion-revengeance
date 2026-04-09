import { TextStyle } from "../../../engine/graphics/textStyle.js";
import { IM_FLAG, UIContext } from "../../../engine/ui/uiContext.js";
import { BattalionContext } from "../../battalionContext.js";
import { GAME_EVENT } from "../../enums.js";
import { UI_TEXTURE, GENERIC_BUTTON, GENERIC_BUTTON_HEIGHT, GENERIC_BUTTON_WIDTH, GENERIC_BUTTON_TEXT_OFFSET_X } from "../constants.js";

const BUTTON_ID_REGION = 100;

export const ArenaUI = function() {
    UIContext.call(this);

    this.isImmediate = true;

    this.style = new TextStyle();
    this.style.setAlignment(TextStyle.ALIGN.MIDDLE);
    this.style.font = "16px Times New Roman";
}

ArenaUI.prototype = Object.create(UIContext.prototype);
ArenaUI.prototype.constructor = ArenaUI;

ArenaUI.prototype.load = function(gameContext) {
    const { uiData, uiManager } = gameContext;

    uiData.loadGenericTextures();
    uiManager.addContext(this);
}

ArenaUI.prototype.onImmediate = function(gameContext, display) {
    const { uiData, client } = gameContext;
    const { socket } = client;
    const { context } = display;
    const isConnected = socket.isConnected;
    const buttonTexture = uiData.getTexture(UI_TEXTURE.GENERIC_BUTTON);

    const backX = 0;
    const backY = 0;
    const backID = BUTTON_ID_REGION;
    const backFlags = this.doButton(gameContext, backID, backX, backY, GENERIC_BUTTON_WIDTH, GENERIC_BUTTON_HEIGHT);
    
    const connectX = 0;
    const connectY = GENERIC_BUTTON_HEIGHT;
    const connectID = BUTTON_ID_REGION + 1;
    const connectFlags = this.doButton(gameContext, connectID, connectX, connectY, GENERIC_BUTTON_WIDTH, GENERIC_BUTTON_HEIGHT);
  
    const joinX = 0;
    const joinY = GENERIC_BUTTON_HEIGHT * 2;
    const joinID = BUTTON_ID_REGION + 2;
    const joinFlags = this.doButton(gameContext, joinID, joinX, joinY, GENERIC_BUTTON_WIDTH, GENERIC_BUTTON_HEIGHT);
  
    const createX = 0;
    const createY = GENERIC_BUTTON_HEIGHT * 3;
    const createID = BUTTON_ID_REGION + 3;
    const createFlags = this.doButton(gameContext, createID, createX, createY, GENERIC_BUTTON_WIDTH, GENERIC_BUTTON_HEIGHT);
  
    const leaveX = 0;
    const leaveY = GENERIC_BUTTON_HEIGHT * 4;
    const leaveID = BUTTON_ID_REGION + 4;
    const leaveFlags = this.doButton(gameContext, leaveID, leaveX, leaveY, GENERIC_BUTTON_WIDTH, GENERIC_BUTTON_HEIGHT);
  
    const startX = 0;
    const startY = GENERIC_BUTTON_HEIGHT * 5;
    const startID = BUTTON_ID_REGION + 5;
    const startFlags = this.doButton(gameContext, startID, startX, startY, GENERIC_BUTTON_WIDTH, GENERIC_BUTTON_HEIGHT);
  
    let backButton = GENERIC_BUTTON.ENABLED;
    let connectButton = GENERIC_BUTTON.ENABLED;
    let joinButton = GENERIC_BUTTON.ENABLED;
    let createButton = GENERIC_BUTTON.ENABLED;
    let leaveButton = GENERIC_BUTTON.ENABLED;
    let startButton = GENERIC_BUTTON.ENABLED;

    if(isConnected) {
        connectButton = GENERIC_BUTTON.DISABLED;

        switch(this.hotWidget) {
            case backID: {
                backButton = GENERIC_BUTTON.HOT;
                break;
            }
            case joinID: {
                joinButton = GENERIC_BUTTON.HOT;
                break;
            }
            case createID: {
                createButton = GENERIC_BUTTON.HOT;
                break;
            }
            case leaveID: {
                leaveButton = GENERIC_BUTTON.HOT;
                break;
            }
            case startID: {
                startButton = GENERIC_BUTTON.HOT;
                break;
            }
        }

        switch(this.activeWidget) {
            case backID: {
                backButton = GENERIC_BUTTON.ACTIVE;
                break;
            }
            case joinID: {
                joinButton = GENERIC_BUTTON.ACTIVE;
                break;
            }
            case createID: {
                createButton = GENERIC_BUTTON.ACTIVE;
                break;
            }
            case leaveID: {
                leaveButton = GENERIC_BUTTON.ACTIVE;
                break;
            }
            case startID: {
                startButton = GENERIC_BUTTON.ACTIVE;
                break;
            }
        }

        if(joinFlags & IM_FLAG.CLICKED) {
            const roomID = parseInt(prompt("Room-ID?", 0));

            socket.joinRoom(roomID);
        }
           
        if(createFlags & IM_FLAG.CLICKED) {
            socket.createRoom(0);
        }

        if(leaveFlags & IM_FLAG.CLICKED) {
            socket.leaveRoom();
        }

        if(startFlags & IM_FLAG.CLICKED) {
            socket.messageRoom(GAME_EVENT.MP_CLIENT_START_MATCH, {});
        }
    } else {
        joinButton = GENERIC_BUTTON.DISABLED;
        createButton = GENERIC_BUTTON.DISABLED;
        leaveButton = GENERIC_BUTTON.DISABLED;
        startButton = GENERIC_BUTTON.DISABLED;

        switch(this.hotWidget) {
            case backID: {
                backButton = GENERIC_BUTTON.HOT;
                break;
            }
            case connectID: {
                connectButton = GENERIC_BUTTON.HOT;
                break;
            }
        }

        switch(this.activeWidget) {
            case backID: {
                backButton = GENERIC_BUTTON.ACTIVE;
                break;
            }
            case connectID: {
                connectButton = GENERIC_BUTTON.ACTIVE;
                break;
            }
        }

        if(connectFlags & IM_FLAG.CLICKED) {
            const address = prompt("TO?", "http://localhost:3000");

            socket.connect(address);
        }
    }

    if(backFlags & IM_FLAG.CLICKED) {
        this.hide();
        gameContext.states.setNextState(gameContext, BattalionContext.STATE.MAIN_MENU);
    }

    this.style.apply(context);

    buttonTexture.drawRegion(display, backButton, backX, backY);
    buttonTexture.drawRegion(display, connectButton, connectX, connectY);
    buttonTexture.drawRegion(display, joinButton, joinX, joinY);
    buttonTexture.drawRegion(display, createButton, createX, createY);
    buttonTexture.drawRegion(display, leaveButton, leaveX, leaveY);
    buttonTexture.drawRegion(display, startButton, startX, startY);

    context.fillText("BACK", backX + GENERIC_BUTTON_TEXT_OFFSET_X, backY + 34);
    context.fillText("CONNECT", connectX + GENERIC_BUTTON_TEXT_OFFSET_X, connectY + 34);
    context.fillText("JOIN", joinX + GENERIC_BUTTON_TEXT_OFFSET_X, joinY + 34);
    context.fillText("CREATE", createX + GENERIC_BUTTON_TEXT_OFFSET_X, createY + 34);
    context.fillText("LEAVE", leaveX + GENERIC_BUTTON_TEXT_OFFSET_X, leaveY + 34);
    context.fillText("START", startX + GENERIC_BUTTON_TEXT_OFFSET_X, startY + 34);
}