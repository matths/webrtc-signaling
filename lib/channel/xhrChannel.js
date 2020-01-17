const parseBodyMiddleware = require('../request/parseBodyMiddleware');
const log = require('../utils/log');

// channel using XmlHttpRequest (XHR)
var exports = module.exports = function getChannel (server, connections, messageHandler) {

	function init (server) {
		makeExistingListenersIgnoreSignaling(server);
		prependSignalingListener(server);
	}

	function makeExistingListenersIgnoreSignaling (server) {
		const listeners = server.rawListeners('request').map(listener => {
			return (req, res) => {
				if (req.signaling) {
					return; // ignore all signaling requests
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
			req.signaling = false;
			if (req.url.indexOf('signaling')!==-1) {
				req.signaling = true;

				addAllowOriginHeader(req, res);
				addAllowCredentials(req, res);
				if (isPreflightRequest(req)) {
					addCorsPreflightHeaders(req, res);
					res.end('');
				} else {
					xhrRequestHandler(req, res);
				}
			}
		});
	};

	function isPreflightRequest (req) {
		return req.method=='OPTIONS';
	}

	function addAllowOriginHeader (req, res) {
		// allow all origins
		res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
	}

	function addAllowCredentials (req, res) {
		// allow cookies
		res.setHeader('Access-Control-Allow-Credentials', true);
	}

	function addCorsPreflightHeaders (req, res) {
		// req.headers['access-control-request-method'];
		// req.headers['access-control-request-headers'];
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
		res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Window-Name');
		res.setHeader('Access-Control-Max-Age', 86400); // 24 hours
	}

	function xhrRequestHandler (req, res) {
		connections.identifyConnectionMiddleware(req, res, receiveMessage);
	};

	function receiveMessage(req, res) {
		parseBodyMiddleware(req, res, function (req, res) {
			var connection = connections.getByIds(req.sessionId, req.gatewayId);
			connection.channel = 'xhr';

			var message = req.body;

			var messageIsEmpty = (Object.keys(message).length === 0);
			if (!messageIsEmpty) {
				setTimeout(function () {
					log.write('xhrChannel', 'XHR receive', connection.sessionId, connection.gatewayId, log.yellow, JSON.stringify(message), log.reset);
					messageHandler(connection, message);
				}, 0);
			}

			sendMessage(req, res);
		});
	};

	function sendMessage(req, res) {
		var connection = connections.getByIds(req.sessionId, req.gatewayId);

		res.setHeader('Content-Type', 'application/json');
		if (connection.isNew) {
			delete connection.isNew;
			log.write('xhrChannel', 'XHR set cookie', log.bright, log.red, connection.sessionId, connection.gatewayId, log.reset);
			res.setHeader('Set-Cookie', ['session='+connection.sessionId]);
		}

		var message = {};
		if (connection.messages && connection.messages.length > 0) {
			message = connection.messages.shift();

			if (typeof(message) == 'function') {
				message = message(connection);
			}

			log.write('xhrChannel', 'XHR send', connection.sessionId, connection.gatewayId, log.bright, log.blue, JSON.stringify(message), log.reset);
		}

		res.end(JSON.stringify(message));
	};

	function send (sessionId, gatewayId, message) {
		var connection = connections.getByIds(sessionId, gatewayId);
		if (connection) {
			if (!connection.messages) {
				connection.messages = [];
			}
			connection.messages.push(message);
		}
	};

	init(server);

	return {
		send: send
	};
};
