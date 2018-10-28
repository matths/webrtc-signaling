const parseBodyMiddleware = require('../request/parseBodyMiddleware');
const log = require('../utils/log');

// channel using XmlHttpRequest (XHR)

var exports = module.exports = function getChannel (server, sessions, messageHandler) {

	function init (server) {
		server.prependListener('request', function (req, res) {
			req.signaling = false;
			if (req.url.indexOf('signaling')!==-1) {
				req.signaling = true;
				xhrRequestHandler(req, res);
				return false;
			}
		});
	};

	function xhrRequestHandler (req, res) {
		sessions.identifySessionMiddleware(req, res, receiveMessage);
	};

	function receiveMessage(req, res) {
		parseBodyMiddleware(req, res, function (req, res) {
			var sessionId = req.sessionId;
			var session = sessions.getById(req.sessionId);
			session.channel = 'xhr';

			var message = req.body;
			var messageIsEmpty = (Object.keys(message).length === 0);
			if (!messageIsEmpty) {
				setTimeout(function () {
					log.write('xhrChannel', 'receive', session.id, log.yellow, message, log.reset);
					messageHandler(sessionId, message);
				}, 0);
			}

			sendMessage(req, res);
		});
	};

	function sendMessage(req, res) {
		var session = sessions.getById(req.sessionId);

		res.setHeader('Content-Type', 'application/json');
		if (session.isNew) {
			delete session.isNew;
			res.setHeader('Set-Cookie', ['session='+req.sessionId]);
		}

		if (session.messages && session.messages.length > 0) {
			var message = session.messages.shift();

			if (typeof(message) == 'function') {
				message = message(session);
			}

			log.write('xhrChannel', 'send', session.id, log.bright, log.blue, message, log.reset);
		} else {
			var message = {};
		}

		res.end(JSON.stringify(message));
	};

	function send (sessionId, message) {
		var session = sessions.getById(sessionId);
		if (session) {
			if (!session.messages) {
				session.messages = [];
			}
			session.messages.push(message);
		}
	};

	init(server);

	return {
		send: send
	};
};
