"use strict";

module.exports = function(RED) {
    function RaumfeldRoomTitleChangedNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.raumkernelNode = RED.nodes.getNode(config.raumkernel);

        function handleEvent(_mediaRenderer, _mediaItemData) {
            var roomNames = config.roomNames || msg.roomNames || msg.payload;
            if (roomNames) roomNames = roomNames.split(",");

            var msg = {};

            var eventRoomNames = _mediaRenderer.roomName().split(",");

            eventRoomNames.forEach(eventRoomName => {
                msg.roomName = eventRoomName;

                if ((roomNames[0] == "" || roomNames.includes(eventRoomName))) {
                    msg.payload = _mediaItemData.title;
                    msg.title = _mediaItemData.title;
                    msg.parentId = _mediaItemData.parentId;

                    node.send(msg);
                }
            });
        }

        node.raumkernelNode.raumkernel.on("rendererMediaItemDataChanged", handleEvent);

        node.on("close", function() {
            node.raumkernelNode.removeListener("rendererMediaItemDataChanged", handleEvent);
        });
    }
    RED.nodes.registerType("raumfeld-room-title-changed", RaumfeldRoomTitleChangedNode);
}