export const MOVE_STEP_SIZE = 6;
export const ENTITY_RESOLUTION_SIZE = 6;
export const ENTITY_SNAPSHOT_SIZE = 31;

const BIT_8 = 1;
const BIT_16 = 2;

export const packEntityResolution = function(resolution, view, byteOffset) {
    view.setInt16(byteOffset, resolution.entityID, true);
    byteOffset += BIT_16;
    view.setUint16(byteOffset, resolution.delta, true);
    byteOffset += BIT_16;
    view.setUint16(byteOffset, resolution.health, true);
    byteOffset += BIT_16;

    return byteOffset;
}

export const unpackEntityResolution = function(resolution, view, byteOffset) {
    resolution.entityID = view.getInt16(byteOffset, true);
    byteOffset += BIT_16;
    resolution.delta = view.getUint16(byteOffset, true);
    byteOffset += BIT_16;
    resolution.health = view.getUint16(byteOffset, true);
    byteOffset += BIT_16;

    return byteOffset;
}

export const packEntitySnapshot = function(snapshot, view, byteOffset) {
    view.setUint8(byteOffset, snapshot.direction);
    byteOffset += BIT_8;
    view.setUint8(byteOffset, snapshot.state);
    byteOffset += BIT_8;
    view.setUint8(byteOffset, snapshot.morale);
    byteOffset += BIT_8;
    view.setInt8(byteOffset, snapshot.moraleDelta);
    byteOffset += BIT_8;
    view.setInt8(byteOffset, snapshot.teamID);
    byteOffset += BIT_8;
    view.setUint16(byteOffset, snapshot.turns, true);
    byteOffset += BIT_16;
    view.setUint16(byteOffset, snapshot.cash, true);
    byteOffset += BIT_16;
    view.setUint16(byteOffset, snapshot.flags, true);
    byteOffset += BIT_16;
    view.setUint16(byteOffset, snapshot.health, true);
    byteOffset += BIT_16;
    view.setUint16(byteOffset, snapshot.maxHealth, true);
    byteOffset += BIT_16;
    view.setInt16(byteOffset, snapshot.type, true);
    byteOffset += BIT_16;
    view.setInt16(byteOffset, snapshot.tileX, true);
    byteOffset += BIT_16;
    view.setInt16(byteOffset, snapshot.tileY, true);
    byteOffset += BIT_16;
    view.setInt16(byteOffset, snapshot.tileZ, true);
    byteOffset += BIT_16;
    view.setInt16(byteOffset, snapshot.transport, true);
    byteOffset += BIT_16;
    view.setInt16(byteOffset, snapshot.id, true);
    byteOffset += BIT_16;
    view.setInt16(byteOffset, snapshot.name, true);
    byteOffset += BIT_16;
    view.setInt16(byteOffset, snapshot.desc, true);
    byteOffset += BIT_16;
    
    return byteOffset;
}

export const unpackEntitySnapshot = function(snapshot, view, byteOffset) {
    snapshot.direction = view.getUint8(byteOffset);
    byteOffset += BIT_8;
    snapshot.state = view.getUint8(byteOffset);
    byteOffset += BIT_8;
    snapshot.morale = view.getUint8(byteOffset);
    byteOffset += BIT_8;
    snapshot.moraleDelta = view.getInt8(byteOffset);
    byteOffset += BIT_8;
    snapshot.teamID = view.getInt8(byteOffset);
    byteOffset += BIT_8;
    snapshot.turns = view.getUint16(byteOffset, true);
    byteOffset += BIT_16;
    snapshot.cash = view.getUint16(byteOffset, true);
    byteOffset += BIT_16;
    snapshot.flags = view.getUint16(byteOffset, true);
    byteOffset += BIT_16;
    snapshot.health = view.getUint16(byteOffset, true);
    byteOffset += BIT_16;
    snapshot.maxHealth = view.getUint16(byteOffset, true);
    byteOffset += BIT_16;
    snapshot.type = view.getInt16(byteOffset, true);
    byteOffset += BIT_16;
    snapshot.tileX = view.getInt16(byteOffset, true);
    byteOffset += BIT_16;
    snapshot.tileY = view.getInt16(byteOffset, true);
    byteOffset += BIT_16;
    snapshot.tileZ = view.getInt16(byteOffset, true);
    byteOffset += BIT_16;
    snapshot.transport = view.getInt16(byteOffset, true);
    byteOffset += BIT_16;
    snapshot.id = view.getInt16(byteOffset, true);
    byteOffset += BIT_16;
    snapshot.name = view.getInt16(byteOffset, true);
    byteOffset += BIT_16;
    snapshot.desc = view.getInt16(byteOffset, true);
    byteOffset += BIT_16;

    return byteOffset;
}