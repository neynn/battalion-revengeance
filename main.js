import { LanguageHandler } from "./engine/language/languageHandler.js";
import { AssetLoader } from "./engine/resources/assetLoader.js";
import { generateAutoSheet, makeLanguageFile } from "./helpers.js";
import { BattalionContext } from "./src/battalionContext.js";
import { validateEntityTypes, validateTileTypes, validateTraitTypes } from "./src/type/validateTypes.js";
import { tAllNamesAndDescriptionsPresent } from "./test.js";

const DO_TEST = false;
const gameContext = new BattalionContext();
const assetLoader = new AssetLoader();
const resources = await assetLoader.loadResourcesDev(gameContext.pathHandler, "assets/assets.json");

gameContext.init(resources);

if(DO_TEST) {
    gameContext.language.events.on(LanguageHandler.EVENT.LANGUAGE_CHANGE, () => {
        validateTileTypes(gameContext);
        validateTraitTypes(resources.traitTypes);
        console.log("Missing entity translations:", tAllNamesAndDescriptionsPresent(gameContext, resources.entityTypes));
        console.log("Missing tile translations:", tAllNamesAndDescriptionsPresent(gameContext, resources.tileTypes));
        console.log("Missing faction translations:", tAllNamesAndDescriptionsPresent(gameContext, resources.factionTypes));
        console.log("Missing trait translations:", tAllNamesAndDescriptionsPresent(gameContext, resources.traitTypes));
    });
}

console.info(assetLoader, gameContext);