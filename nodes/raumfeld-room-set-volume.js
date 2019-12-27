"use strict";

module.exports = function(RED) {
    function RaumfeldRoomSetVolumeNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.raumkernelNode = RED.nodes.getNode(config.raumkernel);

        node.on("input", function(msg) {
            var roomName        = config.roomName || msg.roomName;
            var volume          = config.volume || msg.volume || msg.payload;
            var unmute          = config.unmute || Boolean(msg.unmute);
            var relative        = config.relative;
            var useZoneRenderer = config.scope == "ZONE" ? true : false;

            // the volume may be set on the room itself or the zone where the room resides in
            // so for that we have to get the virtual mendia renderer or the room media renderer
            var renderer = useZoneRenderer ? node.raumkernelNode.deviceManager.getVirtualMediaRenderer(roomName) : node.raumkernelNode.deviceManager.getMediaRenderer(roomName);

            if (renderer) {

                // if we should do a relative change of the volume we have to know the current volume
                if(relative)
                {
                    renderer.getVolume().then(function(_volumeNow){
                        renderer.setVolume(parseInt(_volumeNow) + parseInt(volume)).then(function() {
                            if (unmute)
                                renderer.setMute(0);
                        });
                    });
                }
                // on a absolute set we can set the volume directly
                else
                {
                    renderer.setVolume(parseInt(volume)).then(function() {
                        if (unmute)
                            renderer.setMute(0);
                    });
                }
            }
            else
            {
                if(useZoneRenderer)
                    node.warn("Zone for room '" + roomName + "' not found");
                else
                    node.warn("Renderer for room '" + roomName + "' not found");

            }
        });
    }
    RED.nodes.registerType("raumfeld-room-set-volume", RaumfeldRoomSetVolumeNode);
}