const parseBodyMiddleware = require('../request/parseBodyMiddleware');

// channel using XmlHttpRequest (XHR)

var exports = module.exports = function getChannel (server, sessions, messageHandler) {

	function init (server) {
		server.prependListener('request', function (req, res) {
			if (req.url.indexOf('signaling')!==-1) {
				xhrRequestHandler(req, res);
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

			var message = req.body;
			var messageIsEmpty = (Object.keys(message).length === 0);
			if (!messageIsEmpty) {
				setTimeout(function () {
					console.log('RECEIVE', sessionId, message);
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

			console.log('SEND', req.sessionId, message);
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
