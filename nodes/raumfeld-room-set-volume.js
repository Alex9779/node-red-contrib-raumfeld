"use strict";

module.exports = function(RED) {
    function RaumfeldRoomSetVolumeNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.raumkernelNode = RED.nodes.getNode(config.raumkernel);

        node.on("input", function(msg) {
            var roomName = config.roomName || msg.roomName;
            var volume = config.volume || msg.volume || msg.payload;
            var unmute = config.unmute || Boolean(msg.unmute);

            var roomMediaRenderer = node.raumkernelNode.deviceManager.getMediaRenderer(roomName);

            if (roomMediaRenderer) {
                roomMediaRenderer.setVolume(volume).then(function() {
                    if (unmute) {
                        roomMediaRenderer.setMute(0);
                    }
                });
            }
        });
    }
    RED.nodes.registerType("raumfeld-room-set-volume", RaumfeldRoomSetVolumeNode);
}