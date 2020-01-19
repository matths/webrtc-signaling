const connections = require('./lib/connection/connections');
let signaling;

function webrtcHandshake(_signaling) {
    signaling = _signaling;
    signaling.addListener('message', function (connection, message) {
		if (message.introduction) {
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
	});    
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
		signaling.send(connection, message);
	});
}

function messageToOther (message) {
	connections.getOther().forEach(function(connection) {
		signaling.send(connection, message);
	});
}

function messageToCallId (callId, message) {
	var connection = getConnectionByCallId(callId);
	if (connection) {
		signaling.send(connection, message);
	}
}

function getConnectionByCallId (callId) {
	return connections.getAll().filter(function(connection) {
		return (connection.callId == callId);
	}).shift();
}

var exports = module.exports = webrtcHandshake;
