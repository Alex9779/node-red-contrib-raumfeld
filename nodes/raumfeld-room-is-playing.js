"use strict";

module.exports = function(RED) {
    function RaumfeldRoomIsPlayingNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.raumkernelNode = RED.nodes.getNode(config.raumkernel);

        node.on("input", function(msg) {
            var roomName = config.roomName || msg.roomName || msg.payload;

            var mediaRendererVirtual = node.raumkernelNode.deviceManager.getVirtualMediaRenderer(roomName);

            var msg = {};

            msg.roomName = roomName;

            if (mediaRendererVirtual) {
                if (mediaRendererVirtual.rendererState.TransportState == "PLAYING") {
                    msg.payload = true;
                }
                else if (mediaRendererVirtual.rendererState.TransportState == "NO_MEDIA_PRESENT" ||
                         mediaRendererVirtual.rendererState.TransportState == "STOPPED") {
                    msg.payload = false;
                }

            }
            else {
                msg.payload = false;
            }

            if (msg.hasOwnProperty("payload")) node.send(msg);
        });
    }
    RED.nodes.registerType("raumfeld-room-is-playing", RaumfeldRoomIsPlayingNode);
}