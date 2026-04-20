export const Tile = function(id, type, autotiler, category) {
    this.id = id;
    this.type = type;
    this.autotiler = autotiler;
    this.category = category;
}

export const TileCategory = function(id) {
    this.id = id;
    this.members = new Set();
}

TileCategory.prototype.addMember = function(id) {
    this.members.add(id);
}

TileCategory.prototype.hasMember = function(id) {
    return this.members.has(id);
}