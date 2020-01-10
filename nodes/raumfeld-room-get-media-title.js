"use strict";

module.exports = function(RED) {
    function RaumfeldRoomGetMediaTitleNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.raumkernelNode = RED.nodes.getNode(config.raumkernel);

        node.on("input", function(msg) {
            var roomName = config.roomName || msg.roomName || msg.payload;

            var mediaRendererVirtual = node.raumkernelNode.deviceManager.getVirtualMediaRenderer(roomName);

            msg.roomName = roomName;
            msg.payload = "No media!";

            if (mediaRendererVirtual) {
                msg.payload = mediaRendererVirtual.currentMediaItemData.title;
                msg.parentId = mediaRendererVirtual.currentMediaItemData.parentId;
            }

            node.send(msg);
        });
    }
    RED.nodes.registerType("raumfeld-room-get-media-title", RaumfeldRoomGetMediaTitleNode);
}