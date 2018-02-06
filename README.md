node-red-contrib-raumfeld
===============================
Monitor and control your [Teufel Streaming](https://www.teufel.de/) (formerly known as Raumfeld) devices from [Node-RED](https://nodered.org).

[![npm version](https://badge.fury.io/js/node-red-contrib-raumfeld.svg)](http://badge.fury.io/js/node-red-contrib-raumfeld) [![Dependency Status](https://david-dm.org/alex9779/node-red-contrib-raumfeld.svg)](https://david-dm.org/alex9779/noder-red-contrib-raumfeld)

### Overview
node-red-contrib-raumfeld provides a bunch of nodes to control certain aspects of your Teufel Streaming (formerly known as Raumfeld) system.

The reason for development was to be able to control the system with Apple's Home app in connection with [homebridge](https://github.com/nfarina/homebridge), [homebdirge-mqtt](https://github.com/cflurin/homebridge-mqtt), [Mosquitto](https://mosquitto.org/) and of course [Node-RED](https://nodered.org/) which I already use to control my other home automation devices.

![Sample Node-RED setup - Home control](https://github.com/alex9779/node-red-contrib-raumfeld/raw/master/saple/sample1-1.png)

![Sample Node-RED setup - Monitoring external changes](https://github.com/alex9779/node-red-contrib-raumfeld/raw/master/saple/sample1-2.png)

### Installation
Per user:
```bash
cd ~/.node-red
npm install node-red-contrib-raumfeld
```

Globaly:
```bash
sudo npm install -g --unsafe-perms node-red-contrib-raumfeld
```

### TODOs ###

### Contributing ###

    1. Fork the project
    2. Create a feature branch
    3. Code
    4. Submit pull request to `develop`