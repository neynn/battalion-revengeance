import { ClientAssetLoader } from "./engine/resources/clientAssetLoader.js";
import { BattalionContext } from "./src/battalionContext.js";

const gameContext = new BattalionContext();
const assetLoader = new ClientAssetLoader("assets/assets.json", "assets/assets_prod.json");
const resources = await assetLoader.loadResources(gameContext.pathHandler, ClientAssetLoader.MODE.DEVELOPER);

gameContext.loadResources(resources);
gameContext.init(resources);

console.info(assetLoader, gameContext);