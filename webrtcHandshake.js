const connections = require('./lib/connection/connections');
const uniqueId = require('./lib/utils/uniqueId');
const knownDevices = require('./config/knownDevices')

function webrtcHandshake(signaling) {
    signaling.addListener('message', function (connection, message) {
		if (message.introduction) {
			setConnectionName(connection, message.introduction);
			setConnectionCallId(connection);
			sendAvailableCallIdsToAll();
		} else {
			// WebRTC signaling
			// (message.candidate || message.sdp)
			if (message.to) {
				var clonedMessage = JSON.parse(JSON.stringify(message));
				delete clonedMessage.to;
				clonedMessage.from = connection.callId;
				messageToCallId(message.to, clonedMessage);
			}
		}
	});

	function setConnectionName (connection, name) {
		while (getConnectionByName(name)) {
			connections.removeConnection(getConnectionByName(name));
		}
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
		return connections.getAll()
		.filter(connection => {
			return connection.callId && connection.callId.length>0;
		})
		.map(connection => {
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
		return connections.getAll().filter(connection => (connection.callId == callId)).shift();
	}

	function getConnectionByName (name) {
		return connections.getAll().filter(connection => (connection.name == name)).shift();
	}
}

var exports = module.exports = webrtcHandshake;
