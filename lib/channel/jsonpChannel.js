const url = require('url');
const log = require('../utils/log');
const jsoncrush = require('../utils/jsoncrush');

// channel using JSON with Padding (JSONP)

var exports = module.exports = function getChannel (server, connections, messageHandler) {

	function init (server) {
		prependJsonpListener (server);
	}

	function prependJsonpListener (server) {
		server.prependListener('request', function (req, res) {
			if (req.signaling && req.method=='GET') {
                jsonpRequestHandler(req, res);
			}
		});
	}

	function jsonpRequestHandler (req, res) {
		connections.identifyConnectionMiddleware(req, res, receiveMessage);
	};

	function receiveMessage(req, res) {
        var connection = connections.getOne(req.sessionId, req.gatewayId);
        connection.channel = 'jsonp';

        var query = url.parse(req.url, true).query;
		req.jsonpCallback = query.callback;
		var message = JSON.parse(jsoncrush.JSONUncrush(decodeURIComponent(query.message)));

        var messageIsEmpty = (Object.keys(message).length === 0);
        if (!messageIsEmpty) {
            setTimeout(function () {
                log.write('jsonpChannel', 'JSONP receive', connection.sessionId, connection.gatewayId, log.yellow, JSON.stringify(message), log.reset);
                messageHandler(connection, message);
            }, 0);
        }

        sendMessage(req, res);
    };
    
	function sendMessage(req, res) {
		var connection = connections.getOne(req.sessionId, req.gatewayId);

		res.setHeader('Content-Type', 'application/javascript');
		if (connection.isNew) {
			delete connection.isNew;
			log.write('jsonpChannel', 'JSONP set cookie', log.bright, log.red, connection.sessionId, connection.gatewayId, log.reset);
			res.setHeader('Set-Cookie', ['session='+connection.sessionId]);
		}

		var message = {};
		if (connection.messages && connection.messages.length > 0) {
			message = connection.messages.shift();

			if (typeof(message) == 'function') {
				message = message(connection);
			}

			log.write('jsonpChannel', 'JSONP send', connection.sessionId, connection.gatewayId, log.bright, log.blue, JSON.stringify(message), log.reset);
		}

		res.end(req.jsonpCallback+'('+JSON.stringify(message)+');');
	};

	function send (sessionId, gatewayId, message) {
		var connection = connections.getOne(sessionId, gatewayId);
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
