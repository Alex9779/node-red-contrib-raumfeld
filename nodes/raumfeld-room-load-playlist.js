"use strict";

module.exports = function(RED) {
    function RaumfeldRoomLoadPlaylistNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.raumkernelNode = RED.nodes.getNode(config.raumkernel);

        node.on("input", function(msg) {
            var roomNames = config.roomNames || msg.roomNames;
            if (roomNames) roomNames = roomNames.split(",");
            else roomNames = [""];

            var groupIfPlaying = config.groupIfPlaying;

            var playlist = config.playlist || msg.playlist || msg.payload;

            var volumes = config.volumes || msg.volumes;
            if (volumes) volumes = volumes.split(",");
            else volumes = [""];

            var overrideVolume = config.overrideVolume || msg.overrideVolume;

            var roomMediaRenderers = []

            roomNames.forEach(roomName => {
                roomMediaRenderers.push(node.raumkernelNode.deviceManager.getMediaRenderer(roomName));
            });

            var mediaRendererVirtual;
            var alreadyPlaying = false;

            var es = node.raumkernelNode.raumkernel.encodeString;

            node.raumkernelNode.deviceManager.mediaRenderersVirtual.forEach(existingMediaRendererVirtual => {
                if (existingMediaRendererVirtual.currentMediaItemData) {
                    if (existingMediaRendererVirtual.currentMediaItemData.parentID == "0/Playlists/MyPlaylists/" + es(playlist)
                            && existingMediaRendererVirtual.rendererState.TransportState == "PLAYING") {
                        mediaRendererVirtual = existingMediaRendererVirtual;
                        alreadyPlaying = true;
                    }
                }
            });

            if (alreadyPlaying && !groupIfPlaying)  {
                if (overrideVolume && volumes[0]) {
                    roomMediaRenderers.forEach((roomMediaRenderer, i) => {
                        var volume = volumes[i] ? volumes[i] : volumes[0];

                        roomMediaRenderer.setVolume(volume);
                    });
                }

                roomMediaRenderers.forEach((roomMediaRenderer, i) => {
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
                                roomMediaRenderers.forEach((roomMediaRenderer, i) => {
                                    var volume = volumes[i] ? volumes[i] : volumes[0];

                                    roomMediaRenderer.setVolume(volume);
                                });
                            }

                            mediaRendererVirtual.loadPlaylist(playlist);
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
                            roomMediaRenderers.forEach((roomMediaRenderer, i) => {
                                var volume = volumes[i] ? volumes[i] : volumes[0];

                                roomMediaRenderer.setVolume(volume);
                            });
                        }

                        mediaRendererVirtual.loadPlaylist(playlist);
                    });
                }
            }
        });
    }
    RED.nodes.registerType("raumfeld-room-load-playlist", RaumfeldRoomLoadPlaylistNode);
}