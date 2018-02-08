"use strict";

module.exports = function(RED) {
    function RaumfeldRoomGetVolumeNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.raumkernelNode = RED.nodes.getNode(config.raumkernel);

        node.on("input", function(msg) {
            var roomName = config.roomName || msg.roomName || msg.payload;

            var mediaRenderer = node.raumkernelNode.deviceManager.getMediaRenderer(roomName);

            var msg = {};

            msg.roomName = roomName;

            if (mediaRenderer) {
                msg.payload = mediaRenderer.rendererState.Volume;
            }

            if (msg.hasOwnProperty("payload")) node.send(msg);
        });
    }
    RED.nodes.registerType("raumfeld-room-get-volume", RaumfeldRoomGetVolumeNode);
}