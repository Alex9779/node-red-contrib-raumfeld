"use strict";
var RaumkernelLib = require("node-raumkernel");
var parseString = require("xml2js").parseString;

module.exports = function(RED) {
    function RaumfeldRoomLoadFavoriteNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.raumkernelNode = RED.nodes.getNode(config.raumkernel);

        node.on("input", function(msg) {
            var roomNames = config.roomNames || msg.roomNames;
            if (roomNames) roomNames = roomNames.split(",")
            else roomNames = [""];

            var favorite = config.favorite || msg.favorite || msg.payload;

            var volumes = config.volumes || msg.volumes;
            if (volumes) volumes = volumes.split(",");
            else volumes = [""];

            var overrideVolume = config.overrideVolume || msg.overrideVolume;

            var roomMediaRenderers = []

            roomNames.forEach(roomName => {
                roomMediaRenderers.push(node.raumkernelNode.deviceManager.getMediaRenderer(roomName));
            });

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
                });

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
                        if (overrideVolume && volumes[0]) {
                            roomMediaRenderers.forEach(function(roomMediaRenderer, i) {
                                var volume = volumes[i] ? volumes[i] : volumes[0];

                                roomMediaRenderer.setVolume(volume);
                            });
                        }

                        roomMediaRenderers.forEach(roomMediaRenderer, i => {
                            if (!mediaRendererVirtual.rendererState["rooms"][roomMediaRenderer.roomUdn()]) {
                                var volume = volumes[i] ? volumes[i] : volumes[0];

                                roomMediaRenderer.setVolume(volume);

                                node.raumkernelNode.zoneManager.connectRoomToZone(roomMediaRenderer.roomUdn(), mediaRendererVirtual.udn());
                            }
                        });
                    }
                    else {
                        mediaRendererVirtual = node.raumkernelNode.deviceManager.getVirtualMediaRenderer(roomNames[0]);

                        if (!mediaRendererVirtual) {
                            node.raumkernelNode.zoneManager.connectRoomToZone(roomMediaRenderers[0].roomUdn(), "", true).then(function() {
                                setTimeout(function () {
                                    mediaRendererVirtual = node.raumkernelNode.deviceManager.getVirtualMediaRenderer(roomNames[0]);

                                    for (let i = 1; i < roomMediaRenderers.length; i++) {
                                        if (!mediaRendererVirtual.rendererState["rooms"][roomMediaRenderers[i].roomUdn()]) {
                                            node.raumkernelNode.zoneManager.connectRoomToZone(roomMediaRenderers[i].roomUdn(), mediaRendererVirtual.udn());
                                        }
                                    }

                                    if (volumes[0]) {
                                        roomMediaRenderers.forEach(function(roomMediaRenderer, i) {
                                            var volume = volumes[i] ? volumes[i] : volumes[0];

                                            roomMediaRenderer.setVolume(volume);
                                        });
                                    }

                                    mediaRendererVirtual.loadSingle(favoriteXMLObject.$.id);
                                }, 1000);
                            });
                        }
                        else {
                            roomMediaRenderers[0].leaveStandby(true).then(function() {
                                for (let i = 1; i < roomMediaRenderers.length; i++) {
                                    if (!mediaRendererVirtual.rendererState["rooms"][roomMediaRenderers[i].roomUdn()]) {
                                        node.raumkernelNode.zoneManager.connectRoomToZone(roomMediaRenderers[i].roomUdn(), mediaRendererVirtual.udn());
                                    }
                                }

                                if (volumes[0]) {
                                    roomMediaRenderers.forEach(function(roomMediaRenderer, i) {
                                        var volume = volumes[i] ? volumes[i] : volumes[0];

                                        roomMediaRenderer.setVolume(volume);
                                    });
                                }

                                mediaRendererVirtual.loadSingle(favoriteXMLObject.$.id);
                            });
                        }
                    }
                }
            });
        });
    }
    RED.nodes.registerType("raumfeld-room-load-favorite", RaumfeldRoomLoadFavoriteNode);
}