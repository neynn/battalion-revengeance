import { LanguageHandler } from "./engine/language/languageHandler.js";
import { AssetLoader } from "./engine/resources/assetLoader.js";
import { BattalionContext } from "./src/battalionContext.js";
import { validateEntityTypes, validateTileTypes, validateTraitTypes } from "./src/type/validateTypes.js";

const gameContext = new BattalionContext();
const assetLoader = new AssetLoader();
const resources = await assetLoader.loadResourcesDev(gameContext.pathHandler, "assets/assets.json");

gameContext.loadResources(resources);
gameContext.init(resources);

//gameContext.language.events.on(LanguageHandler.EVENT.LANGUAGE_CHANGE, () => {
//    validateTileTypes(gameContext);
//});

console.info(assetLoader, gameContext);