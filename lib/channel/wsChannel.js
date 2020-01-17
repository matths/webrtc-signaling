const ws = require ('ws');
const log = require('../utils/log');

// channel using WebSockets (WS)
var exports = module.exports = function getChannel (server, connections, messageHandler) {

	function init (server) {
		const wss = new ws.Server({server});
		wss.on('headers', wsHeaders);
		wss.on('connection', wsConnection);
	};

	function wsHeaders (headers, req) {
		connections.identifyConnection(req);
		var connection = connections.getByIds(req.sessionId, req.gatewayId);
		if (connection.isNew) {
			delete connection.isNew;
			log.write('wsChannel', 'WS set cookie', log.bright, log.red, connection.sessionId, connection.gatewayId, log.reset);
			headers.push('Set-Cookie: session='+connection.sessionId);
		}
	};

	function wsConnection (ws, req) {
		var connection = connections.getByIds(req.sessionId, req.gatewayId);
		connection.ws = ws;
		connection.channel = 'ws';

		ws.on('close', function () {
			connection.ws = false;
			connection.channel = false;
			connections.removeConnection(connection);
		});

		ws.on('message', function (rawMessage) {
			var message = JSON.parse(rawMessage);
			log.write('wsChannel', 'WS receive', connection.sessionId, connection.gatewayId, log.yellow, JSON.stringify(message), log.reset);
			messageHandler(connection, message);
		});
	};

	function send (sessionId, gatewayId, message) {
		var connection = connections.getByIds(sessionId, gatewayId);

		var readyStates = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
		if (connection.ws && connection.ws.readyState==readyStates.indexOf('OPEN')) {

			if (typeof(message) == 'function') {
				message = message(connection);
			}

			var rawMessage = JSON.stringify(message);
			log.write('wsChannel', 'WS send', connection.sessionId, connection.gatewayId, log.bright, log.blue, rawMessage, log.reset);
			connection.ws.send(rawMessage);
		}
	};

	init(server);

	return {
		send: send
	};
};
