"use strict";
var RaumkernelLib = require("node-raumkernel");
var parseString = require("xml2js").parseString;

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

        node.on("close", function() {
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

        node.on("close", function() {
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

        node.on("close", function() {
            node.raumkernelNode.removeListener("rendererMediaItemDataChanged", handleEvent);
        });
    }
    RED.nodes.registerType("raumfeld room title changed", RaumfeldRoomTitleChanged);

    function RaumfeldRoomPlayStateChanged(config) {
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
    RED.nodes.registerType("raumfeld room play state changed", RaumfeldRoomPlayStateChanged);

    function RaumfeldRoomSetVolumeNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.raumkernelNode = RED.nodes.getNode(config.raumkernel);

        node.on("input", function(msg) {
            var roomName = config.roomName || msg.roomName;
            var volume = config.volume || msg.volume || msg.payload;
            var unmute = config.unmute || Boolean(msg.unmute);

            var roomMediaRenderer = node.raumkernelNode.deviceManager.getMediaRenderer(roomName);

            if (roomMediaRenderer) {
                roomMediaRenderer.setVolume(volume).then(function() {
                    if (unmute) {
                        roomMediaRenderer.setMute(0);
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

        node.on("input", function(msg) {
            var roomName = config.roomName || msg.roomName;
            var mute = Boolean(msg.mute) || Boolean(msg.payload);

            var roomMediaRenderer = node.raumkernelNode.deviceManager.getMediaRenderer(roomName);

            if (roomMediaRenderer) {
                roomMediaRenderer.setMute(mute);
            }
        });
    }
    RED.nodes.registerType("raumfeld room set mute", RaumfeldRoomSetMuteNode);

    function RaumfeldRoomLoadPlaylist(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.raumkernelNode = RED.nodes.getNode(config.raumkernel);

        node.on("input", function(msg) {
            var roomName = config.roomName || msg.roomName;
            var playlist = config.playlist || msg.playlist || msg.payload;
            var volume = config.volume || msg.volume;
            var overrideVolume = config.overrideVolume || msg.overrideVolume;

            var roomMediaRenderer = node.raumkernelNode.deviceManager.getMediaRenderer(roomName);

            var mediaRendererVirtual;
            var alreadyPlaying = false;

            var es = node.raumkernelNode.raumkernel.encodeString;

            node.raumkernelNode.deviceManager.mediaRenderersVirtual.forEach(existingMediaRendererVirtual => {
                if (existingMediaRendererVirtual.currentMediaItemData) {
                    if (existingMediaRendererVirtual.currentMediaItemData.containerId == MYPLAYLISTS + es(playlist)
                            && existingMediaRendererVirtual.rendererState.TransportState == "PLAYING") {
                        mediaRendererVirtual = existingMediaRendererVirtual;
                        alreadyPlaying = true;
                    }
                }
            });

            if (alreadyPlaying)  {
                if (overrideVolume && volume) {
                    roomMediaRenderer.setVolume(volume);
                }

                if (!mediaRendererVirtual.rendererState["rooms"][roomMediaRenderer.roomUdn()]) {
                    node.raumkernelNode.zoneManager.connectRoomToZone(roomMediaRenderer.roomUdn(), mediaRendererVirtual.udn(), true);
                }
            }
            else {
                mediaRendererVirtual = node.raumkernelNode.deviceManager.getVirtualMediaRenderer(roomName);

                if (!mediaRendererVirtual) {
                    node.raumkernelNode.zoneManager.connectRoomToZone(roomMediaRenderer.roomUdn(), "", true).then(function() {
                        mediaRendererVirtual = node.raumkernelNode.deviceManager.getVirtualMediaRenderer(roomName);

                        if (volume) {
                            roomMediaRenderer.setVolume(volume);
                        }

                        mediaRendererVirtual.loadPlaylist(playlist);
                    });
                }
                else {
                    roomMediaRenderer.leaveStandby(true).then(function() {
                            if (volume) {
                                roomMediaRenderer.setVolume(volume);
                            }

                            mediaRendererVirtual.loadPlaylist(playlist);
                    });
                }
            }
        });
    }
    RED.nodes.registerType("raumfeld room load playlist", RaumfeldRoomLoadPlaylist);

    function RaumfeldRoomLoadFavorite(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.raumkernelNode = RED.nodes.getNode(config.raumkernel);

        node.on("input", function(msg) {
            var roomName = config.roomName || msg.roomName;
            var favorite = config.favorite || msg.favorite || msg.payload;
            var volume = config.volume || msg.volume;
            var overrideVolume = config.overrideVolume || msg.overrideVolume;

            var roomMediaRenderer = node.raumkernelNode.deviceManager.getMediaRenderer(roomName);

            var mediaRendererVirtual;
            var favoriteXMLObject;
            var favoriteType;
            var alreadyPlaying = false;

            var mediaServer = node.raumkernelNode.deviceManager.getRaumfeldMediaServer();

            mediaServer.browse("0/Favorites/MyFavorites").then(function(_data){
                var parseString = require("xml2js").parseString;
                var xml = _data;

                parseString(xml, function (err, result) {
                    result["DIDL-Lite"].container.forEach(container => {
                        if (container["dc:title"][0] == favorite)
                        {
                            favoriteXMLObject = container;
                            favoriteType = "container";
                        }
                    });

                    if (!favoriteXMLObject) {
                        result["DIDL-Lite"].item.forEach(item => {
                            if (item["dc:title"][0] == favorite)
                            {
                                favoriteXMLObject = item;
                                favoriteType = "item";
                            }
                        });
                    }

                    var es = node.raumkernelNode.raumkernel.encodeString;

                    if (favoriteXMLObject) {
                        switch (favoriteXMLObject["upnp:class"][0]) {
                            case "object.container.person.musicArtist":
                                node.raumkernelNode.deviceManager.mediaRenderersVirtual.forEach(existingMediaRendererVirtual => {
                                    if (existingMediaRendererVirtual.currentMediaItemData) {
                                        if (existingMediaRendererVirtual.currentMediaItemData.parentID.endsWith(es(favoriteXMLObject["upnp:artist"]["0"]) + "/AllTracks")
                                                && existingMediaRendererVirtual.rendererState.TransportState == "PLAYING") {
                                            mediaRendererVirtual = existingMediaRendererVirtual;
                                            alreadyPlaying = true;
                                        }
                                    }
                                });
                                break;

                            case "object.container.album.musicAlbum":
                                node.raumkernelNode.deviceManager.mediaRenderersVirtual.forEach(existingMediaRendererVirtual => {
                                    if (existingMediaRendererVirtual.currentMediaItemData) {
                                        if (existingMediaRendererVirtual.currentMediaItemData.artist == favoriteXMLObject["upnp:artist"]["0"]
                                                && existingMediaRendererVirtual.currentMediaItemData.album == favoriteXMLObject["upnp:album"]["0"]
                                                && existingMediaRendererVirtual.rendererState.TransportState == "PLAYING") {
                                            mediaRendererVirtual = existingMediaRendererVirtual;
                                            alreadyPlaying = true;
                                        }
                                    }
                                });
                                break;

                            case "object.item.audioItem.musicTrack":
                                node.raumkernelNode.deviceManager.mediaRenderersVirtual.forEach(existingMediaRendererVirtual => {
                                    if (existingMediaRendererVirtual.currentMediaItemData) {
                                        if (mediaRendererVirtual.currentMediaItemData.artist == favoriteXMLObject["upnp:artist"]["0"]
                                                && existingMediaRendererVirtual.currentMediaItemData.album == favoriteXMLObject["upnp:album"]["0"]
                                                && existingMediaRendererVirtual.currentMediaItemData.title == favoriteXMLObject["dc:title"]["0"]
                                                && existingMediaRendererVirtual.rendererState.TransportState == "PLAYING") {
                                            mediaRendererVirtual = existingMediaRendererVirtual;
                                            alreadyPlaying = true;
                                        }
                                    }
                                });
                                break;

                            case "object.item.audioItem.audioBroadcast.radio":
                                node.raumkernelNode.deviceManager.mediaRenderersVirtual.forEach(existingMediaRendererVirtual => {
                                    if (existingMediaRendererVirtual.currentMediaItemData) {
                                        if (existingMediaRendererVirtual.currentMediaItemData.title == favoriteXMLObject["dc:title"]["0"]
                                                && existingMediaRendererVirtual.rendererState.TransportState == "PLAYING") {
                                            mediaRendererVirtual = existingMediaRendererVirtual;
                                            alreadyPlaying = true;
                                        }
                                    }
                                });
                                break;
                        }

                        if (alreadyPlaying)  {
                            if (overrideVolume && volume) {
                                roomMediaRenderer.setVolume(volume);
                            }

                            if (!mediaRendererVirtual.rendererState["rooms"][roomMediaRenderer.roomUdn()]) {
                                node.raumkernelNode.zoneManager.connectRoomToZone(roomMediaRenderer.roomUdn(), mediaRendererVirtual.udn(), true);
                            }
                        }
                        else {
                            mediaRendererVirtual = node.raumkernelNode.deviceManager.getVirtualMediaRenderer(roomName);

                            if (!mediaRendererVirtual) {
                                node.raumkernelNode.zoneManager.connectRoomToZone(roomMediaRenderer.roomUdn(), "", true).then(function() {
                                    mediaRendererVirtual = node.raumkernelNode.deviceManager.getVirtualMediaRenderer(roomName);

                                    if (volume) {
                                        roomMediaRenderer.setVolume(volume);
                                    }

                                    mediaRendererVirtual.loadSingle(favoriteId);
                                });
                            }
                            else {
                                roomMediaRenderer.leaveStandby(true).then(function() {
                                        if (volume) {
                                            roomMediaRenderer.setVolume(volume);
                                        }

                                        mediaRendererVirtual.loadSingle(favoriteId);
                                });
                            }
                        }
                    }
                });
            });
        });
    }
    RED.nodes.registerType("raumfeld room load favorite", RaumfeldRoomLoadFavorite);

    function RaumfeldRoomDropFromZone(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.raumkernelNode = RED.nodes.getNode(config.raumkernel);

        node.on("input", function(msg) {
            var roomName = config.roomName || msg.roomName || msg.payload;

            var roomMediaRenderer = node.raumkernelNode.deviceManager.getMediaRenderer(roomName);

            node.raumkernelNode.zoneManager.dropRoomFromZone(roomMediaRenderer.roomUdn());
        });
    }
    RED.nodes.registerType("raumfeld room drop from zone", RaumfeldRoomDropFromZone);

    function RaumfeldRoomGetMediaTitle(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.raumkernelNode = RED.nodes.getNode(config.raumkernel);

        node.on("input", function(msg) {
            var roomName = config.roomName || msg.roomName || msg.payload;

            var mediaRendererVirtual = node.raumkernelNode.deviceManager.getVirtualMediaRenderer(roomName);

            var msg = {};

            msg.roomName = roomName;
            msg.payload = "No media!";

            if (mediaRendererVirtual) {
                msg.payload = mediaRendererVirtual.currentMediaItemData.title;
                msg.parentId = mediaRendererVirtual.currentMediaItemData.parentId;
            }

            node.send(msg);
        });
    }
    RED.nodes.registerType("raumfeld room get media title", RaumfeldRoomGetMediaTitle);

    function RaumfeldRoomGetPlayState(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.raumkernelNode = RED.nodes.getNode(config.raumkernel);

        node.on("input", function(msg) {
            var roomName = config.roomName || msg.roomName || msg.payload;

            var mediaRendererVirtual = node.raumkernelNode.deviceManager.getVirtualMediaRenderer(roomName);

            var msg = {};

            msg.roomName = roomName;

            if (mediaRendererVirtual) {
                if (mediaRendererVirtual.rendererState.TransportState == "PLAYING") {
                    msg.payload = true;
                }
                else if (mediaRendererVirtual.rendererState.TransportState == "NO_MEDIA_PRESENT") {
                    msg.payload = false;
                }

                if (msg.hasOwnProperty("payload")) node.send(msg);
            }
        });
    }
    RED.nodes.registerType("raumfeld room get play state", RaumfeldRoomGetPlayState);
}