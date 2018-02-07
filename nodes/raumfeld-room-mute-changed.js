"use strict";

module.exports = function(RED) {
    function RaumfeldRoomMuteChangedNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.raumkernelNode = RED.nodes.getNode(config.raumkernel);

        function handleEvent(_mediaRenderer, _key, _oldValue, _newValue, _roomUdn) {
            var roomName = config.roomName;
            var msg = {};

            msg.roomName = roomName;

            if (!_roomUdn && _mediaRenderer.roomName() == roomName && _key == "Mute") {
                msg.oldMute = _oldValue;
                msg.newMute = _newValue;
                msg.payload = _newValue;

                node.send(msg);
            }
        }

        node.raumkernelNode.raumkernel.on("rendererStateKeyValueChanged", handleEvent);

        node.on("close", function() {
            node.raumkernelNode.removeListener("rendererStateKeyValueChanged", handleEvent);
        });
    }
    RED.nodes.registerType("raumfeld-room-mute-changed", RaumfeldRoomMuteChangedNode);
}