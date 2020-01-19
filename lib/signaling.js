const EventEmitter = require('events');

const channels = require('./channel/channels');
const connections = require('./connection/connections');
const knownDevices = require('../config/knownDevices.js');
const uniqueId = require('./utils/uniqueId');

var availableChannels = {};

class Signaling extends EventEmitter {

	constructor (server, options = {}) {
		super();

		var defaults = {
			xhr: true,
			jsonp: true,
			ws: true
		};
		var actual = Object.assign({}, defaults, options);
	
		this.makeExistingListenersIgnoreSignaling(server);
	
		if (actual.xhr) {
			availableChannels['xhr'] = channels.getXhrChannel(server, connections, this.messageHandler.bind(this));
		}
		if (actual.jsonp) {
			availableChannels['jsonp'] = channels.getJsonpChannel(server, connections, this.messageHandler.bind(this));
		}
		if (actual.ws) {
			availableChannels['ws'] = channels.getWsChannel(server, connections, this.messageHandler.bind(this));
		}
	
		this.prependSignalingListener(server);
	}

	makeExistingListenersIgnoreSignaling (server) {
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
	
	prependSignalingListener (server) {
		server.prependListener('request', function (req, res) {
			req.signaling = (req.url.indexOf('signaling') !== -1);
		});
	}

	messageHandler (connection, message) {
		this.emit('message', connection, message);
	}

	send (connection, message) {
		if (availableChannels[connection.channel]) {
			availableChannels[connection.channel].send(connection.sessionId, connection.gatewayId, message);
		}	
	}
}

var exports = module.exports = Signaling;
