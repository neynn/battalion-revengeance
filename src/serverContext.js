import { ActionRouter } from "../engine/client/actionRouter.js";
import { StateMachine } from "../engine/state/stateMachine.js";
import { TurnManager } from "../engine/world/turn/turnManager.js";
import { World } from "../engine/world/world.js";
import { AttackAction } from "./action/types/attack.js";
import { CaptureAction } from "./action/types/capture.js";
import { CloakAction } from "./action/types/cloak.js";
import { DeathAction } from "./action/types/death.js";
import { EndTurnAction } from "./action/types/endTurn.js";
import { HealAction } from "./action/types/heal.js";
import { MoveAction } from "./action/types/move.js";
import { UncloakAction } from "./action/types/uncloak.js";
import { TeamManager } from "./team/teamManager.js";
import { TypeRegistry } from "./type/typeRegistry.js";

export const ServerGameContext = function(serverApplication) {
    const { 
        typeRegistry,
        tileManager,
        transform2D,
        pathHandler
    } = serverApplication;

    this.pathHandler = pathHandler;
    this.typeRegistry = typeRegistry;
    this.tileManager = tileManager;
    this.transform2D = transform2D;

    this.world = new World();
    this.teamManager = new TeamManager();
    this.states = new StateMachine(this);
    this.actionRouter = new ActionRouter();
}

ServerGameContext.prototype.init = function() {
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.CAPTURE, new CaptureAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.MOVE, new MoveAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.HEAL, new HealAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.ATTACK, new AttackAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.CLOAK, new CloakAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.DEATH, new DeathAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.UNCLOAK, new UncloakAction());
    this.world.actionQueue.registerAction(TypeRegistry.ACTION_TYPE.END_TURN, new EndTurnAction());

    this.world.turnManager.events.on(TurnManager.EVENT.NEXT_TURN, ({ turn }) => {
        this.world.eventHandler.onTurnChange(this, turn);
    }, { permanent: true });

    this.world.turnManager.events.on(TurnManager.EVENT.NEXT_ROUND, ({ round }) => {
        this.world.eventHandler.onRoundChange(this, round);
    }, { permanent: true });
}

