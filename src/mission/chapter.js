export const Chapter = function(id) {
    this.id = id;
    this.name = "";
    this.desc = "";
    this.missions = [];
}

Chapter.prototype.getMissionIndex = function(missionID) {
    for(let i = 0; i < this.missions.length; i++) {
        if(this.missions[i].id === missionID) {
            return i;
        }
    }

    return -1;
}

Chapter.prototype.hasMission = function(missionID) {
    return this.getMissionIndex(missionID) !== -1;
}