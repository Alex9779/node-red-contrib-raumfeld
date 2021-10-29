"use strict";
var RaumkernelLib = require("node-raumkernel");

module.exports = function(RED) {
    function RaumfeldRoomIsPlayingChangedNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.raumkernelNode = RED.nodes.getNode(config.raumkernel);

        function handleEvent(_mediaRenderer, _key, _oldValue, _newValue, _roomUdn) {
            var roomNames = config.roomNames;
            if (roomNames) roomNames = roomNames.split(",");
            else roomNames = [""];

            var msg = {};

            msg.roomName = _mediaRenderer.roomName();

            if (!(_mediaRenderer instanceof RaumkernelLib.MediaRendererRaumfeldVirtual)) {
                if ((roomNames[0] == "" || roomNames.includes(_mediaRenderer.roomName())) && _key == "TransportState") {
                    if (_newValue == "PLAYING") {
                        msg.payload = true;
                    }
                    else if (_newValue == "NO_MEDIA_PRESENT" || _newValue == "STOPPED" || _newValue == "PAUSED_PLAYBACK") {
                        msg.payload = false;
                    }

                    if (msg.hasOwnProperty("payload")) node.send(msg);
                }
            }
        }

        node.raumkernelNode.raumkernel.on("rendererStateKeyValueChanged", handleEvent);

        node.on("close", function() {
            node.raumkernelNode.raumkernel.removeListener("rendererStateKeyValueChanged", handleEvent);
        });
    }
    RED.nodes.registerType("raumfeld-room-is-playing-changed", RaumfeldRoomIsPlayingChangedNode);
}