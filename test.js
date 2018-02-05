'use strict';
var RaumkernelLib = require('node-raumkernel');

var raumkernel = new RaumkernelLib.Raumkernel();

class EmptyLogger extends RaumkernelLib.Logger {
    initExternalLogger() { }
}

raumkernel.parmLogger(new EmptyLogger ())

raumkernel.init();

raumkernel.on("systemReady", function(_ready){

});