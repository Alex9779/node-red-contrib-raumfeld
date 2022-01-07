"use strict";

module.exports = function(RED) {
    function RaumfeldRoomSetMuteNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.raumkernelNode = RED.nodes.getNode(config.raumkernel);

        node.on("input", function(msg) {
            var roomName = config.roomName || msg.roomName;
            var mute = config.mute || Boolean(msg.mute) || Boolean(msg.payload);

            var roomMediaRenderer = node.raumkernelNode.deviceManager.getMediaRenderer(roomName);

            if (roomMediaRenderer) {
                roomMediaRenderer.setMute(mute);
            }
        });
    }
    RED.nodes.registerType("raumfeld-room-set-mute", RaumfeldRoomSetMuteNode);
}