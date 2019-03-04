"use strict";

module.exports = function(RED) {
    function RaumfeldRoomActionNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.raumkernelNode = RED.nodes.getNode(config.raumkernel);

        node.on("input", function(msg) {
            var roomName = config.roomName || msg.roomName;
            var action = config.action || msg.action || msg.payload;

            var roomMediaRenderer = node.raumkernelNode.deviceManager.getVirtualMediaRenderer(roomName);

            if (roomMediaRenderer) {
                roomMediaRenderer[action]().then(function() {
                    // nothing to do after this
                });
            }
        });
    }
    RED.nodes.registerType("raumfeld-room-action", RaumfeldRoomActionNode);
}
