'use strict'; 
var RaumkernelLib = require('node-raumkernel');

var raumkernel = new RaumkernelLib.Raumkernel();

raumkernel.createLogger(0);
raumkernel.init();

var zoneManager = raumkernel.managerDisposer.zoneManager;
var deviceManager = raumkernel.managerDisposer.deviceManager;

module.exports = function(RED) {
    function RaumfeldSetRoomVolumeNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.on('input', function(msg) {
            var roomName = config.roomName || msg.roomName;
            var volume = config.volume || msg.volume || msg.payload;

            msg.roomName = roomName;
            msg.volume = volume;

            var room = zoneManager.getRoomObjectFromMediaRendererUdnOrName(roomName);
            var roomUdn = room.$.udn;
            var mediaRendererUdn = zoneManager.getZoneUDNFromRoomUDN(roomUdn);

            if (mediaRendererUdn) {
                var mediaRenderer = deviceManager.getVirtualMediaRenderer(mediaRendererUdn);
                                
                mediaRenderer.setRoomVolume(roomUdn, volume).then(function() {                    
                    if (config.unmute) {
                        mediaRenderer.setRoomMute(roomUdn, 0).then(function() {
                            msg.payload = true;
                        }).catch(function() {
                            msg.payload = false;
                        });
                    }
                    else {
                        msg.payload = true;
                    }
                }).catch(function() {
                    msg.payload = false;
                });
            }
            else {
                msg.payload = false;
            }

            node.send(msg);
        });
    }
    RED.nodes.registerType("raumfeld set room volume", RaumfeldSetRoomVolumeNode);

    function RaumfeldRoomVolumeChanged(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        var roomName = config.roomName;

        raumkernel.on("rendererStateKeyValueChanged", function(_mediaRenderer, _key, _oldValue, _newValue) {
            var msg = {};
            msg.roomName = roomName;

            if (_mediaRenderer.roomName() == roomName && _key == "Volume") {
                msg.oldVolume = _oldValue;
                msg.newVolume = _newValue;
                msg.payload = _newValue;

                node.send(msg);
            }
            else if (config.mute && _mediaRenderer.roomName() == roomName && _key == "Mute") {
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
        });
    }
    RED.nodes.registerType("raumfeld room volume changed", RaumfeldRoomVolumeChanged);
}