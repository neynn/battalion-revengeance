import { LanguageHandler } from "./engine/language/languageHandler.js";
import { loadResourcesDev } from "./engine/resources/assetLoader.js";
import { PrettyJSON } from "./engine/resources/prettyJSON.js";
import { generateAutoSheet, makeLanguageFile } from "./helpers.js";
import { BattalionContext } from "./src/battalionContext.js";
import { validateTraitTypes } from "./test/types.js"
import { tAllNamesAndDescriptionsPresent } from "./test/language.js";
import { ClientPathHandler } from "./engine/resources/pathHandler.js";
import { Timer } from "./engine/timer.js";
import { KEY } from "./engine/client/keyboard.js";
import { GameWindow } from "./engine/gameWindow.js";
import { addDebugKeybinds, drawWindowDebug } from "./debug.js";

const gameTimer = new Timer();
const gameWindow = new GameWindow();
const gameContext = new BattalionContext(gameTimer, gameWindow);

const gameLoop = function(timestamp) {
    gameTimer.beginFrame(timestamp);

    //Work
    gameWindow.update(gameContext);
    gameContext.textureLoader.update();

    if(!gameContext.debugMode) {
        gameContext.debugMode = true;
        addDebugKeybinds(gameContext, gameWindow);
    }
    
    //Fixed Update
    while(gameTimer.shouldTick()) {
        gameTimer.doTick();
        gameContext.states.update(gameContext);
        gameContext.world.update(gameContext);
    }

    if(gameTimer.shouldRender()) {
        gameTimer.beginRender();

        //Input
        gameContext.client.update();
        gameContext.uiManager.update(gameContext);

        //Render
        gameContext.dialogueHandler.update(gameContext);
        gameContext.tweenManager.update(gameContext);
        gameContext.spriteManager.update(gameContext);
        gameContext.tileManager.update(gameContext);
        
        gameWindow.display.clear();
        gameWindow.display.save();
        gameContext.contextManager.draw(gameContext, gameWindow.display);
        gameWindow.display.reset();
        gameWindow.display.save();
        gameContext.uiManager.draw(gameContext, gameWindow.display);
        gameWindow.display.reset();

        if(gameWindow.debug) {
            drawWindowDebug(gameContext, gameTimer, gameWindow);
        }

        //Post-Input
        gameContext.client.updateLate();

        gameTimer.endRender();
    }
    
    gameTimer.endFrame();
    
    requestAnimationFrame(gameLoop);
}

loadResourcesDev(ClientPathHandler, "assets/assets.json")
.then(resources => {
    gameContext.init(resources);
    requestAnimationFrame(gameLoop);
    
    if(false) {
        gameContext.language.events.on(LanguageHandler.EVENT.LANGUAGE_CHANGE, () => {
            validateTraitTypes(resources.traitTypes);
            console.log("Missing entity translations:", tAllNamesAndDescriptionsPresent(gameContext, resources.entityTypes));
            console.log("Missing tile translations:", tAllNamesAndDescriptionsPresent(gameContext, resources.tileTypes));
            console.log("Missing faction translations:", tAllNamesAndDescriptionsPresent(gameContext, resources.factionTypes));
            console.log("Missing trait translations:", tAllNamesAndDescriptionsPresent(gameContext, resources.traitTypes));
        });
    }

    console.info(resources, gameContext);
});

