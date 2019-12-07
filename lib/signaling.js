const channel = require('./channel/channel');
const sessions = require('./session/sessions');
const knownDevices = require('../config/knownDevices.js');
const uniqueId = require('./utils/uniqueId');

var availableChannels = {};

function messageHandler (session, message) {
	if (message.introduction) {
		setSessionName(session, message.introduction);
		setSessionCallId(session);
		sendAvailableCallIdsToAll();
	} else {
		// WebRTC signaling
		// (message.candidate || message.sdp)
		if (message.to) {
			var copyMessage = JSON.parse(JSON.stringify(message));
			delete copyMessage.to;
			copyMessage.from = session.callId;
			messageToCallId(message.to, copyMessage);
		}
	}
}

function sendAvailableCallIdsToAll () {
	var message = {
		"availableCallIds": getAvailableCallIds()
	};

	var messageFunction = function (session) {
		message.availableCallIds.forEach(function (availableCallId) {
			availableCallId.self = (availableCallId.callId == session.callId) ? 1 : 0;
		});
		return message;
	};

	messageToAll(messageFunction);
}

function getAvailableCallIds () {
	return sessions.getAll().map(function(session) {
		return {
			callId: session.callId,
			name: session.name
		};
	});
}

function setSessionName (session, name) {
	session.name = name;

	var ipv4 = session.ipv4;
	var knownDevice = knownDevices.filter(function (device) {
		return (device.ipv4 == ipv4);
	}).shift();

	if (knownDevice) {
		session.name  = knownDevice.name;
	}
}

function setSessionCallId (session) {
	session.callId = uniqueId();
}

function messageToSession (session, message) {
	availableChannels[session.channel].send(session.id, message);
}

function messageToAll (message) {
	sessions.getAll().forEach(function(session) {
		messageToSession(session, message);
	});
}

function messageToOther (message) {
	sessions.getOther().forEach(function(session) {
		messageToSession(session, message);
	});
}

function messageToCallId (callId, message) {
	var session = getSessionByCallId(callId);
	if (session) {
		messageToSession(session, message);
	}
}

function getSessionByCallId (callId) {
	return sessions.getAll().filter(function(session) {
		return (session.callId == callId);
	}).shift();
}

function signaling(server, options = {}) {
    var defaults = {
        xhr: true,
        ws: true
    };
    var actual = Object.assign({}, defaults, options);

    if (actual.xhr) {
		availableChannels['xhr'] = channel.getXhrChannel(server, sessions, messageHandler);
	}
	if (actual.ws) {
		availableChannels['ws'] = channel.getWsChannel(server, sessions, messageHandler);
    }
}

var exports = module.exports = signaling;
