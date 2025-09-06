export const Sound = function(buffer, volume) {
    this.instanceID = 0;
    this.buffer = buffer;
    this.volume = volume;
    this.instances = new Map();
}

Sound.prototype.onInstanceStart = function(instanceID) {}

Sound.prototype.onInstanceEnd = function(instanceID) {}

Sound.prototype.clearInstances = function() {
    this.instances.forEach(instance => instance.stop());
}

Sound.prototype.play = function(context) {
    const { destination, currentTime } = context;
    const gainNode = context.createGain();
    const sourceNode = context.createBufferSource();
    const sourceID = this.instanceID++;

    sourceNode.connect(gainNode);
    gainNode.connect(destination);
    gainNode.gain.setValueAtTime(this.volume, currentTime);
    sourceNode.buffer = this.buffer;
    sourceNode.onended = () => {
        this.instances.delete(sourceID);
        this.onInstanceEnd(sourceID);
    }
    sourceNode.start(0);

    this.instances.set(sourceID, sourceNode);
    this.onInstanceStart(sourceID);
}