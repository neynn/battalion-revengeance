import { LanguageHandler } from "./engine/language/languageHandler.js";
import { loadResourcesDev } from "./engine/resources/assetLoader.js";
import { PrettyJSON } from "./engine/resources/prettyJSON.js";
import { generateAutoSheet, makeLanguageFile } from "./helpers.js";
import { BattalionContext } from "./src/battalionContext.js";
import { validateTraitTypes } from "./src/type/validateTypes.js";
import { tAllNamesAndDescriptionsPresent } from "./test/language.js";

const gameContext = new BattalionContext();

loadResourcesDev(gameContext.pathHandler, "assets/assets.json")
.then(resources => {
    gameContext.init(resources);

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

