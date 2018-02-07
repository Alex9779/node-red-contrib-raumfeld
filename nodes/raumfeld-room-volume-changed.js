"use strict";
var RaumkernelLib = require("node-raumkernel");

module.exports = function(RED) {
    function RaumfeldRoomVolumeChangedNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.raumkernelNode = RED.nodes.getNode(config.raumkernel);

        function handleEvent(_mediaRenderer, _key, _oldValue, _newValue, _roomUdn) {
            var roomNames = (config.roomNames).split(",");
            var mute = config.mute;
            var msg = {};

            msg.roomName = _mediaRenderer.roomName();

            if (!(_mediaRenderer instanceof RaumkernelLib.MediaRendererRaumfeldVirtual)) {
                if ((roomNames[0] == "" || roomNames.includes(_mediaRenderer.roomName())) && _key == "Volume") {
                    msg.oldVolume = _oldValue;
                    msg.newVolume = _newValue;
                    msg.payload = _newValue;

                    node.send(msg);
                }
                else if (mute && (roomNames[0] == "" || roomNames.includes(_mediaRenderer.roomName())) && _key == "Mute") {
                    if (_newValue == "1") {
                        msg.newVolume = "0";
                        msg.payload = "0";
                    }
                    else if (_newValue == "0") {
                        msg.newVolume = _mediaRenderer.rendererState.Volume;
                        msg.payload = _mediaRenderer.rendererState.Volume;
                    }

                    node.send(msg);
                }
            }
        }

        node.raumkernelNode.raumkernel.on("rendererStateKeyValueChanged", handleEvent);

        node.on("close", function() {
            node.raumkernelNode.removeListener("rendererStateKeyValueChanged", handleEvent);
        });
    }
    RED.nodes.registerType("raumfeld-room-volume-changed", RaumfeldRoomVolumeChangedNode);
}