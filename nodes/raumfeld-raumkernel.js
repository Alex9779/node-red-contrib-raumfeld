"use strict";
var RaumkernelLib = require("node-raumkernel");

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
    RED.nodes.registerType("raumfeld-raumkernel", RaumfeldRaumkernelNode);
}