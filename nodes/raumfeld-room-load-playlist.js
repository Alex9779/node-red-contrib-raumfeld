"use strict";

module.exports = function(RED) {
    function RaumfeldRoomLoadPlaylistNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.raumkernelNode = RED.nodes.getNode(config.raumkernel);

        node.on("input", function(msg) {
            var roomNames = config.roomNames || msg.roomNames || msg.payload;
            if (roomNames) roomNames = roomNames.split(",");

            var playlist = config.playlist || msg.playlist || msg.payload;
            var volumes = (config.volumes || msg.volumes || "").split(",");
            if (volumes) volumes = volumes.split(",");

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
                    if (existingMediaRendererVirtual.currentMediaItemData.containerId == MYPLAYLISTS + es(playlist)
                            && existingMediaRendererVirtual.rendererState.TransportState == "PLAYING") {
                        mediaRendererVirtual = existingMediaRendererVirtual;
                        alreadyPlaying = true;
                    }
                }
            });

            if (alreadyPlaying)  {
                if (overrideVolume && volumes[0]) {
                    roomMediaRenderers.forEach(function(roomMediaRenderer, i) {
                        var volume = volumes[i] ? volumes[i] : volumes[0];

                        roomMediaRenderer.setVolume(volume);
                    });
                }

                roomMediaRenderers.forEach(roomMediaRenderer => {
                    if (!mediaRendererVirtual.rendererState["rooms"][roomMediaRenderer.roomUdn()]) {
                        node.raumkernelNode.zoneManager.connectRoomToZone(roomMediaRenderer.roomUdn(), mediaRendererVirtual.udn());
                    }
                });
            }
            else {
                mediaRendererVirtual = node.raumkernelNode.deviceManager.getVirtualMediaRenderer(roomNames[0]);

                if (!mediaRendererVirtual) {
                    node.raumkernelNode.zoneManager.connectRoomToZone(roomMediaRenderers[0].roomUdn(), "", true).then(function() {
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

                        mediaRendererVirtual.loadPlaylist(playlist);
                    });
                }
                else {
                    roomMediaRenderer.leaveStandby(true).then(function() {
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

                        mediaRendererVirtual.loadPlaylist(playlist);
                    });
                }
            }
        });
    }
    RED.nodes.registerType("raumfeld-room-load-playlist", RaumfeldRoomLoadPlaylistNode);
}