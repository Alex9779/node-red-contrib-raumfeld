"use strict";

module.exports = function(RED) {
    function RaumfeldRoomLoadPlaylistNode(config) {
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
    RED.nodes.registerType("raumfeld-room-load-playlist", RaumfeldRoomLoadPlaylistNode);
}