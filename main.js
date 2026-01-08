import { AssetLoader } from "./engine/resources/assetLoader.js";
import { BattalionContext } from "./src/battalionContext.js";

const gameContext = new BattalionContext();
const assetLoader = new AssetLoader();
const resources = await assetLoader.loadResourcesDev(gameContext.pathHandler, "assets/assets.json");

gameContext.loadResources(resources);
gameContext.init(resources);

console.info(assetLoader, gameContext);