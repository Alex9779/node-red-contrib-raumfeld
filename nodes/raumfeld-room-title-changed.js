"use strict";

module.exports = function(RED) {
    function RaumfeldRoomTitleChangedNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.raumkernelNode = RED.nodes.getNode(config.raumkernel);

        var roomName = config.roomName;

        function handleEvent(_mediaRenderer, _mediaItemData) {
            var msg = {};

            msg.roomName = roomName;

            if (_mediaRenderer.roomName().search(roomName) >= 0) {
                msg.payload = _mediaItemData.title;
                msg.title = _mediaItemData.title;
                msg.parentId = _mediaItemData.parentId;

                node.send(msg);
            }
        }

        node.raumkernelNode.raumkernel.on("rendererMediaItemDataChanged", handleEvent);

        node.on("close", function() {
            node.raumkernelNode.removeListener("rendererMediaItemDataChanged", handleEvent);
        });
    }
    RED.nodes.registerType("raumfeld-room-title-changed", RaumfeldRoomTitleChangedNode);
}