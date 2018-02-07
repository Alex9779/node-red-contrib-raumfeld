"use strict";

module.exports = function(RED) {
    function RaumfeldRoomDropFromZoneNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.raumkernelNode = RED.nodes.getNode(config.raumkernel);

        node.on("input", function(msg) {
            var roomNames = (config.roomNames || msg.roomNames || msg.payload).split(",");

            var roomMediaRenderers = []

            roomNames.forEach(roomName => {
                roomMediaRenderers.push(node.raumkernelNode.deviceManager.getMediaRenderer(roomName));
            });

            async function dropRoomsFromZone() {
                for (let roomMediaRenderer of roomMediaRenderers) {
                    await node.raumkernelNode.zoneManager.dropRoomFromZone(roomMediaRenderer.roomUdn(), true);
                }
            }

            dropRoomsFromZone();
        });
    }
    RED.nodes.registerType("raumfeld-room-drop-from-zone", RaumfeldRoomDropFromZoneNode);
}