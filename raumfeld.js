'use strict';

var RaumkernelLib = require('node-raumkernel');
var raumkernel = new RaumkernelLib.Raumkernel();

class MyNewLogger extends RaumkernelLib.Logger {
    initExternalLogger() { }
}

raumkernel.parmLogger(new MyNewLogger ())

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

                            node.send(msg);
                        }).catch(function() {
                            msg.payload = false;

                            node.send(msg);
                        });
                    }
                    else {
                        msg.payload = true;

                        node.send(msg);
                    }
                }).catch(function() {
                    msg.payload = false;

                    node.send(msg);
                });
            }
            else {
                msg.payload = false;

                node.send(msg);
            }
        });
    }
    RED.nodes.registerType("raumfeld set room volume", RaumfeldSetRoomVolumeNode);

    function RaumfeldRoomVolumeChanged(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        var roomName = config.roomName;
        var mute = config.mute;

        function handleEvent(_mediaRenderer, _key, _oldValue, _newValue, _roomUdn) {
            var msg = {};
            msg.roomName = roomName;

            if (!_roomUdn && _mediaRenderer.roomName() == roomName && _key == "Volume") {
                msg.oldVolume = _oldValue;
                msg.newVolume = _newValue;
                msg.payload = _newValue;

                node.send(msg);
            }
            else if (!_roomUdn && mute && _mediaRenderer.roomName() == roomName && _key == "Mute") {
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

        raumkernel.on("rendererStateKeyValueChanged", handleEvent);

        this.on('close', function() {
            raumkernel.removeListener("rendererStateKeyValueChanged", handleEvent);
        });
    }
    RED.nodes.registerType("raumfeld room volume changed", RaumfeldRoomVolumeChanged);

    function RaumfeldSetRoomMuteNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.on('input', function(msg) {
            var roomName = config.roomName || msg.roomName;
            var mute = config.mute || msg.mute || msg.payload;

            msg.roomName = roomName;
            msg.mute = mute;

            var room = zoneManager.getRoomObjectFromMediaRendererUdnOrName(roomName);
            var roomUdn = room.$.udn;
            var mediaRendererUdn = zoneManager.getZoneUDNFromRoomUDN(roomUdn);

            if (mediaRendererUdn) {
                var mediaRenderer = deviceManager.getVirtualMediaRenderer(mediaRendererUdn);

                mediaRenderer.setRoomMute(roomUdn, mute).then(function() {
                    msg.payload = true;

                    node.send(msg);
                }).catch(function() {
                    msg.payload = false;

                    node.send(msg);
                });
            }
            else {
                msg.payload = false;

                node.send(msg);
            }
        });
    }
    RED.nodes.registerType("raumfeld set room mute", RaumfeldSetRoomMuteNode);

    function RaumfeldRoomMuteChanged(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        var roomName = config.roomName;

        function handleEvent(_mediaRenderer, _key, _oldValue, _newValue, _roomUdn) {
            var msg = {};
            msg.roomName = roomName;

            if (!_roomUdn && _mediaRenderer.roomName() == roomName && _key == "Mute") {
                msg.oldMute = _oldValue;
                msg.newMute = _newValue;
                msg.payload = _newValue;

                node.send(msg);
            }
        }

        raumkernel.on("rendererStateKeyValueChanged", handleEvent);

        this.on('close', function() {
            raumkernel.removeListener("rendererStateKeyValueChanged", handleEvent);
        });
    }
    RED.nodes.registerType("raumfeld room mute changed", RaumfeldRoomMuteChanged);

    function RaumfeldRoomPlayPlaylist(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.on('input', function(msg) {
            var roomName = config.roomName || msg.roomName;
            var playlist = config.playlist || msg.playlist || msg.payload;

            msg.roomName = roomName;
            msg.playlist = playlist;

            var room = zoneManager.getRoomObjectFromMediaRendererUdnOrName(roomName);
            var roomUdn = room.$.udn;

            deviceManager.mediaRenderersVirtual.forEach(mediaRendererVirtual => {
                if (mediaRendererVirtual.mediaOriginData.containerId == "0/Playlists/MyPlaylists/" + encodeURI(playlist)
                        && mediaRendererVirtual.rendererState.TransportState == "PLAYING"
                        && !mediaRendererVirtual.rendererState["rooms"][roomUdn]) {
                    zoneManager.connectRoomToZone(roomUdn, mediaRendererVirtual.udn(), true).then(function() {
                        msg.payload = true;

                        node.send(msg);
                    }).catch(function() {
                        msg.payload = false;

                        node.send(msg);
                    });
                }
                else if (mediaRendererVirtual.mediaOriginData.containerId == "0/Playlists/MyPlaylists/" + encodeURI(playlist)
                         && mediaRendererVirtual.rendererState.TransportState == "PLAYING"
                         && mediaRendererVirtual.rendererState["rooms"][roomUdn]) {
                    msg.payload = true;

                    node.send(msg);
                }
            });
        });
    }
    RED.nodes.registerType("raumfeld room play playlist", RaumfeldRoomPlayPlaylist);
}