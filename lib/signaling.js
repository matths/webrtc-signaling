const channel = require('./channel/channel');
const connections = require('./connection/connections');
const knownDevices = require('../config/knownDevices.js');
const uniqueId = require('./utils/uniqueId');

var availableChannels = {};

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

function messageToConnection (connection, message) {
	if (availableChannels[connection.channel]) {
		availableChannels[connection.channel].send(connection.sessionId, connection.gatewayId, message);
	}
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

function getConnectionByCallId (callId) {
	return connections.getAll().filter(function(connection) {
		return (connection.callId == callId);
	}).shift();
}

function signaling(server, options = {}) {
    var defaults = {
        xhr: true,
        ws: true
    };
    var actual = Object.assign({}, defaults, options);

    if (actual.xhr) {
		availableChannels['xhr'] = channel.getXhrChannel(server, connections, messageHandler);
	}
	if (actual.ws) {
		availableChannels['ws'] = channel.getWsChannel(server, connections, messageHandler);
    }
}

var exports = module.exports = signaling;
