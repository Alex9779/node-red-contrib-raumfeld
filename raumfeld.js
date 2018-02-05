'use strict';
var RaumkernelLib = require('node-raumkernel');

const MYPLAYLISTS = "0/Playlists/MyPlaylists/";

module.exports = function(RED) {
    function RaumfeldRaumkernelNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.raumfeldHost = config.raumfeldHost;

        node.raumkernel = new RaumkernelLib.Raumkernel();

        node.raumkernel.settings.raumfeldHost = node.raumfeldHost;

        class EmptyLogger extends RaumkernelLib.Logger {
            initExternalLogger() { }
        }

        node.raumkernel.parmLogger(new EmptyLogger ())

        node.raumkernel.init();

        node.zoneManager = node.raumkernel.managerDisposer.zoneManager;
        node.deviceManager = node.raumkernel.managerDisposer.deviceManager;
    }
    RED.nodes.registerType("raumfeld raumkernel", RaumfeldRaumkernelNode);

    function RaumfeldRoomVolumeChanged(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.raumkernelNode = RED.nodes.getNode(config.raumkernel);

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

        node.raumkernelNode.raumkernel.on("rendererStateKeyValueChanged", handleEvent);

        node.on('close', function() {
            node.raumkernelNode.removeListener("rendererStateKeyValueChanged", handleEvent);
        });
    }
    RED.nodes.registerType("raumfeld room volume changed", RaumfeldRoomVolumeChanged);

    function RaumfeldRoomMuteChanged(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.raumkernelNode = RED.nodes.getNode(config.raumkernel);

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

        node.raumkernelNode.raumkernel.on("rendererStateKeyValueChanged", handleEvent);

        node.on('close', function() {
            node.raumkernelNode.removeListener("rendererStateKeyValueChanged", handleEvent);
        });
    }
    RED.nodes.registerType("raumfeld room mute changed", RaumfeldRoomMuteChanged);

    function RaumfeldRoomTitleChanged(config) {
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

        node.on('close', function() {
            node.raumkernelNode.removeListener("rendererMediaItemDataChanged", handleEvent);
        });
    }
    RED.nodes.registerType("raumfeld room title changed", RaumfeldRoomTitleChanged);

    function RaumfeldRoomIsPlaying(config) {
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

        node.on('close', function() {
            node.raumkernelNode.removeListener("rendererStateKeyValueChanged", handleEvent);
        });
    }
    RED.nodes.registerType("raumfeld room is playing", RaumfeldRoomIsPlaying);

    function RaumfeldRoomSetVolumeNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.raumkernelNode = RED.nodes.getNode(config.raumkernel);

        node.on('input', function(msg) {
            var roomName = config.roomName || msg.roomName;
            var volume = config.volume || msg.payload;
            var unmute = config.unmute || Boolean(msg.unmute);

            var room = node.raumkernelNode.zoneManager.getRoomObjectFromMediaRendererUdnOrName(roomName);
            var roomUdn = room.$.udn;
            var mediaRendererVirtualUdn = node.raumkernelNode.zoneManager.getZoneUDNFromRoomUDN(roomUdn);

            if (mediaRendererVirtualUdn) {
                var mediaRendererVirtualUdn = node.raumkernelNode.deviceManager.getVirtualMediaRenderer(mediaRendererVirtualUdn);

                mediaRendererVirtualUdn.setRoomVolume(roomUdn, volume).then(function() {
                    if (unmute) {
                        mediaRenderer.setRoomMute(roomUdn, 0);
                    }
                });
            }
        });
    }
    RED.nodes.registerType("raumfeld room set volume", RaumfeldRoomSetVolumeNode);

    function RaumfeldRoomSetMuteNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.raumkernelNode = RED.nodes.getNode(config.raumkernel);

        node.on('input', function(msg) {
            var roomName = config.roomName || msg.roomName;
            var mute = Boolean(msg.payload);

            var room = node.raumkernelNode.zoneManager.getRoomObjectFromMediaRendererUdnOrName(roomName);
            var roomUdn = room.$.udn;
            var mediaRendererVirtualUdn = node.raumkernelNode.zoneManager.getZoneUDNFromRoomUDN(roomUdn);

            if (mediaRendererVirtualUdn) {
                var mediaRendererVirtual = node.raumkernelNode.deviceManager.getVirtualMediaRenderer(mediaRendererVirtualUdn);

                mediaRendererVirtual.setRoomMute(roomUdn, mute);
            }
        });
    }
    RED.nodes.registerType("raumfeld room set mute", RaumfeldRoomSetMuteNode);

    function RaumfeldRoomLoadPlaylist(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.raumkernelNode = RED.nodes.getNode(config.raumkernel);

        node.on('input', function(msg) {
            var roomName = config.roomName || msg.roomName;
            var playlist = config.playlist || msg.payload;
            var volume = config.volume || msg.volume;
            var overrideVolume = config.overrideVolume || msg.overrideVolume;

            var room = node.raumkernelNode.zoneManager.getRoomObjectFromMediaRendererUdnOrName(roomName);
            var roomUdn = room.$.udn;

            var alreadyPlaying = false;

            node.raumkernelNode.deviceManager.mediaRenderersVirtual.forEach(mediaRendererVirtual => {
                if (mediaRendererVirtual.mediaOriginData.containerId == MYPLAYLISTS + node.raumkernelNode.raumkernel.encodeString(playlist)
                        && mediaRendererVirtual.rendererState.TransportState == "PLAYING"
                        && !mediaRendererVirtual.rendererState["rooms"][roomUdn]) {
                    alreadyPlaying = true;

                    if (overrideVolume && volume) {
                        mediaRendererVirtual.setRoomVolume(roomUdn, volume)
                    }

                    node.raumkernelNode.zoneManager.connectRoomToZone(roomUdn, mediaRendererVirtual.udn(), true);
                }
                else if (mediaRendererVirtual.mediaOriginData.containerId == MYPLAYLISTS + node.raumkernelNode.raumkernel.encodeString(playlist)
                         && mediaRendererVirtual.rendererState.TransportState == "PLAYING"
                         && mediaRendererVirtual.rendererState["rooms"][roomUdn]) {
                    alreadyPlaying = true;

                    if (overrideVolume && volume) {
                        mediaRendererVirtual.setRoomVolume(roomUdn, volume)
                    }
                }
            });

            if (!alreadyPlaying)
            {
                var mediaRendererVirtual = node.raumkernelNode.deviceManager.getVirtualMediaRenderer(roomName);

                if (!mediaRendererVirtual) {
                    node.raumkernelNode.zoneManager.connectRoomToZone(roomUdn, "", true).then(function() {
                                mediaRendererVirtual = node.raumkernelNode.deviceManager.getVirtualMediaRenderer(roomName);

                                if (volume) {
                                    mediaRendererVirtual.setRoomVolume(roomUdn, volume)
                                }

                                mediaRendererVirtual.loadPlaylist(playlist);
                            });
                }
                else {
                    mediaRendererVirtual.leaveStandby(roomUdn, true).then(function() {
                            if (volume) {
                                mediaRendererVirtual.setRoomVolume(roomUdn, volume)
                            }

                            mediaRendererVirtual.loadPlaylist(playlist);
                    });
                }
            }
        });
    }
    RED.nodes.registerType("raumfeld room load playlist", RaumfeldRoomLoadPlaylist);
}