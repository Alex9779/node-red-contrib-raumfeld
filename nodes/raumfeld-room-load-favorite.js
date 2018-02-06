"use strict";
var RaumkernelLib = require("node-raumkernel");
var parseString = require("xml2js").parseString;

module.exports = function(RED) {
    function RaumfeldRoomLoadFavoriteNode(config) {
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
    RED.nodes.registerType("raumfeld-room-load-favorite", RaumfeldRoomLoadFavoriteNode);
}