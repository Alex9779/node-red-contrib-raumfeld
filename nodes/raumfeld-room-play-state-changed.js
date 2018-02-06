"use strict";
var RaumkernelLib = require("node-raumkernel");

module.exports = function(RED) {
    function RaumfeldRoomPlayStateChangedNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.raumkernelNode = RED.nodes.getNode(config.raumkernel);

        var roomName = config.roomName;

        function handleEvent(_mediaRenderer, _key, _oldValue, _newValue, _roomUdn) {
            var msg = {};
            msg.roomName = roomName;

            if (!(_mediaRenderer instanceof RaumkernelLib.MediaRendererRaumfeldVirtual)) {
                if (_mediaRenderer.roomName() == roomName && _key == "TransportState") {
                    if (_newValue == "PLAYING") {
                        msg.payload = true;
                    }
                    else if (_newValue == "NO_MEDIA_PRESENT") {
                        msg.payload = false;
                    }

                    if (msg.hasOwnProperty("payload")) node.send(msg);
                }
            }
        }

        node.raumkernelNode.raumkernel.on("rendererStateKeyValueChanged", handleEvent);

        node.on("close", function() {
            node.raumkernelNode.removeListener("rendererStateKeyValueChanged", handleEvent);
        });
    }
    RED.nodes.registerType("raumfeld-room-play-state-changed", RaumfeldRoomPlayStateChangedNode);
}