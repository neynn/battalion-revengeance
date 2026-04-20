export const Tile = function(id, type, autotiler) {
    this.id = id;
    this.type = type;
    this.autotiler = autotiler;
}

export const TileCategory = function(name) {
    this.name = name;
    this.members = new Set();
}

TileCategory.prototype.addMember = function(id) {
    this.members.add(id);
}

TileCategory.prototype.hasMember = function(id) {
    return this.members.has(id);
}