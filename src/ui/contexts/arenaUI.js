import { TextStyle } from "../../../engine/graphics/textStyle.js";
import { IM_FLAG, UIContext } from "../../../engine/ui/uiContext.js";
import { BattalionContext } from "../../battalionContext.js";
import { GAME_EVENT } from "../../enums.js";
import { UI_TEXTURE, GENERIC_BUTTON_STYLE } from "../constants.js";

const BUTTON_ID_REGION = 100;

export const ArenaUI = function() {
    UIContext.call(this);

    this.doImmediate = true;

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
    const backFlags = this.doButton(gameContext, backID, backX, backY, GENERIC_BUTTON_STYLE.width, GENERIC_BUTTON_STYLE.height);
    
    const connectX = 0;
    const connectY = GENERIC_BUTTON_STYLE.height;
    const connectID = BUTTON_ID_REGION + 1;
    const connectFlags = this.doButton(gameContext, connectID, connectX, connectY, GENERIC_BUTTON_STYLE.width, GENERIC_BUTTON_STYLE.height);
  
    const joinX = 0;
    const joinY = GENERIC_BUTTON_STYLE.height * 2;
    const joinID = BUTTON_ID_REGION + 2;
    const joinFlags = this.doButton(gameContext, joinID, joinX, joinY, GENERIC_BUTTON_STYLE.width, GENERIC_BUTTON_STYLE.height);
  
    const createX = 0;
    const createY = GENERIC_BUTTON_STYLE.height * 3;
    const createID = BUTTON_ID_REGION + 3;
    const createFlags = this.doButton(gameContext, createID, createX, createY, GENERIC_BUTTON_STYLE.width, GENERIC_BUTTON_STYLE.height);
  
    const leaveX = 0;
    const leaveY = GENERIC_BUTTON_STYLE.height * 4;
    const leaveID = BUTTON_ID_REGION + 4;
    const leaveFlags = this.doButton(gameContext, leaveID, leaveX, leaveY, GENERIC_BUTTON_STYLE.width, GENERIC_BUTTON_STYLE.height);
  
    const startX = 0;
    const startY = GENERIC_BUTTON_STYLE.height * 5;
    const startID = BUTTON_ID_REGION + 5;
    const startFlags = this.doButton(gameContext, startID, startX, startY, GENERIC_BUTTON_STYLE.width, GENERIC_BUTTON_STYLE.height);
  
    let backButton = GENERIC_BUTTON_STYLE.enabled;
    let connectButton = GENERIC_BUTTON_STYLE.enabled;
    let joinButton = GENERIC_BUTTON_STYLE.enabled;
    let createButton = GENERIC_BUTTON_STYLE.enabled;
    let leaveButton = GENERIC_BUTTON_STYLE.enabled;
    let startButton = GENERIC_BUTTON_STYLE.enabled;

    if(isConnected) {
        connectButton = GENERIC_BUTTON_STYLE.disabled;

        switch(this.hotWidget) {
            case backID: {
                backButton = GENERIC_BUTTON_STYLE.hot;
                break;
            }
            case joinID: {
                joinButton = GENERIC_BUTTON_STYLE.hot;
                break;
            }
            case createID: {
                createButton = GENERIC_BUTTON_STYLE.hot;
                break;
            }
            case leaveID: {
                leaveButton = GENERIC_BUTTON_STYLE.hot;
                break;
            }
            case startID: {
                startButton = GENERIC_BUTTON_STYLE.hot;
                break;
            }
        }

        switch(this.activeWidget) {
            case backID: {
                backButton = GENERIC_BUTTON_STYLE.active;
                break;
            }
            case joinID: {
                joinButton = GENERIC_BUTTON_STYLE.active;
                break;
            }
            case createID: {
                createButton = GENERIC_BUTTON_STYLE.active;
                break;
            }
            case leaveID: {
                leaveButton = GENERIC_BUTTON_STYLE.active;
                break;
            }
            case startID: {
                startButton = GENERIC_BUTTON_STYLE.active;
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
        joinButton = GENERIC_BUTTON_STYLE.disabled;
        createButton = GENERIC_BUTTON_STYLE.disabled;
        leaveButton = GENERIC_BUTTON_STYLE.disabled;
        startButton = GENERIC_BUTTON_STYLE.disabled;

        switch(this.hotWidget) {
            case backID: {
                backButton = GENERIC_BUTTON_STYLE.hot;
                break;
            }
            case connectID: {
                connectButton = GENERIC_BUTTON_STYLE.hot;
                break;
            }
        }

        switch(this.activeWidget) {
            case backID: {
                backButton = GENERIC_BUTTON_STYLE.active;
                break;
            }
            case connectID: {
                connectButton = GENERIC_BUTTON_STYLE.active;
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

    context.fillText("BACK", backX + GENERIC_BUTTON_STYLE.halfWidth, backY + 34);
    context.fillText("CONNECT", connectX + GENERIC_BUTTON_STYLE.halfWidth, connectY + 34);
    context.fillText("JOIN", joinX + GENERIC_BUTTON_STYLE.halfWidth, joinY + 34);
    context.fillText("CREATE", createX + GENERIC_BUTTON_STYLE.halfWidth, createY + 34);
    context.fillText("LEAVE", leaveX + GENERIC_BUTTON_STYLE.halfWidth, leaveY + 34);
    context.fillText("START", startX + GENERIC_BUTTON_STYLE.halfWidth, startY + 34);
}