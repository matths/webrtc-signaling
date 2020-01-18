const channels = require('./channel/channels');
const connections = require('./connection/connections');
const knownDevices = require('../config/knownDevices.js');
const uniqueId = require('./utils/uniqueId');

var availableChannels = {};

function signaling(server, options = {}) {
    var defaults = {
        xhr: true,
        ws: true
    };
    var actual = Object.assign({}, defaults, options);

	makeExistingListenersIgnoreSignaling(server);

	if (actual.xhr) {
		availableChannels['xhr'] = channels.getXhrChannel(server, connections, messageHandler);
	}
	if (actual.ws) {
		availableChannels['ws'] = channels.getWsChannel(server, connections, messageHandler);
    }

	prependSignalingListener(server);
}

function makeExistingListenersIgnoreSignaling (server) {
	const listeners = server.rawListeners('request').map(listener => {
		return (req, res) => {
			if (req.signaling) {
				return; // ignore signaling requests
			}
			return listener(req, res);
		}
	});
	server.removeAllListeners('request');
	listeners.forEach(listener => {
		server.addListener('request', listener);
	});
}

function prependSignalingListener (server) {
	server.prependListener('request', function (req, res) {
		req.signaling = (req.url.indexOf('signaling') !== -1);
	});
};

function messageHandler (connection, message) {
	if (message.type == 'chat') {
		messageToAll(message); // just echo
	} else if (message.introduction) {
		setConnectionName(connection, message.introduction);
		setConnectionCallId(connection);
		sendAvailableCallIdsToAll();
	} else {
		// WebRTC signaling
		// (message.candidate || message.sdp)
		if (message.to) {
			var copyMessage = JSON.parse(JSON.stringify(message));
			delete copyMessage.to;
			copyMessage.from = connection.callId;
			messageToCallId(message.to, copyMessage);
		}
	}
}

function setConnectionName (connection, name) {
	connection.name = name;

	var ipv4 = connection.ipv4;
	var knownDevice = knownDevices.filter(function (device) {
		return (device.ipv4 == ipv4);
	}).shift();

	if (knownDevice) {
		connection.name  = knownDevice.name;
	}
}

function sendAvailableCallIdsToAll () {
	var message = {
		"availableCallIds": getAvailableCallIds()
	};

	var messageFunction = function (connection) {
		message.availableCallIds.forEach(function (availableCallId) {
			availableCallId.self = (availableCallId.callId == connection.callId) ? 1 : 0;
		});
		return message;
	};

	messageToAll(messageFunction);
}

function getAvailableCallIds () {
	return connections.getAll().map(function(connection) {
		return {
			callId: connection.callId,
			name: connection.name
		};
	});
}

function setConnectionCallId (connection) {
	connection.callId = uniqueId();
}

function messageToAll (message) {
	connections.getAll().forEach(function(connection) {
		messageToConnection(connection, message);
	});
}

function messageToOther (message) {
	connections.getOther().forEach(function(connection) {
		messageToConnection(connection, message);
	});
}

function messageToCallId (callId, message) {
	var connection = getConnectionByCallId(callId);
	if (connection) {
		messageToConnection(connection, message);
	}
}

function messageToConnection (connection, message) {
	if (availableChannels[connection.channel]) {
		availableChannels[connection.channel].send(connection.sessionId, connection.gatewayId, message);
	}
}

function getConnectionByCallId (callId) {
	return connections.getAll().filter(function(connection) {
		return (connection.callId == callId);
	}).shift();
}

var exports = module.exports = signaling;
