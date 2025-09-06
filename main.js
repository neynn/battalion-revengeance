import { AssetLoader } from "./engine/resources/assetLoader.js";
import { ArmyContext } from "./game/armyContext.js";
import { generateAnimations, generateAutoSheet, makeProdFile, packerToJSONSprites, packerToJSONTiles, saveEntities, saveSprites2, saveSprites3 } from "./helpers.js";
import { PathHandler } from "./engine/resources/pathHandler.js";
import { BattalionContext } from "./src/battalionContext.js";

const assetLoader = new AssetLoader("assets/assets.json", "assets/assets_prod.json")
const resources = await assetLoader.loadResources(AssetLoader.MODE.DEVELOPER);

//saveSprites(resources.sprites);

const gameContext = new BattalionContext();

gameContext.loadResources(resources);
gameContext.init(resources);

console.log(assetLoader, gameContext);

/*["river"].forEach(name => {
	PathHandler.promiseJSON("export/" + name + ".json").then(f => packerToJSONSprites(name, f));
});*/

//create recolored textures as new texture objects with the scheme: tex_name:color. _:_ seperates the textures from their color.