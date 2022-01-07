"use strict";

module.exports = function(RED) {
    function RaumfeldRoomGetVolumeNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.raumkernelNode = RED.nodes.getNode(config.raumkernel);

        node.on("input", function(msg) {
            var roomName = config.roomName || msg.roomName || msg.payload;

            var roomMediaRenderer = node.raumkernelNode.deviceManager.getMediaRenderer(roomName);

            msg.roomName = roomName;

            if (roomMediaRenderer) {
                msg.payload = roomMediaRenderer.rendererState.Volume;
            }

            if (msg.hasOwnProperty("payload")) node.send(msg);
        });
    }
    RED.nodes.registerType("raumfeld-room-get-volume", RaumfeldRoomGetVolumeNode);
}