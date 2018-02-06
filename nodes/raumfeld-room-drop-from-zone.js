"use strict";

module.exports = function(RED) {
    function RaumfeldRoomDropFromZoneNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.raumkernelNode = RED.nodes.getNode(config.raumkernel);

        node.on("input", function(msg) {
            var roomName = config.roomName || msg.roomName || msg.payload;

            var roomMediaRenderer = node.raumkernelNode.deviceManager.getMediaRenderer(roomName);

            node.raumkernelNode.zoneManager.dropRoomFromZone(roomMediaRenderer.roomUdn());
        });
    }
    RED.nodes.registerType("raumfeld-room-drop-from-zone", RaumfeldRoomDropFromZoneNode);
}