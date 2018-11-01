const ws = require ('ws');
const log = require('../utils/log');

// channel using WebSockets (WS)

var exports = module.exports = function getChannel (server, sessions, messageHandler) {

	function init (server) {
		const wss = new ws.Server({server});
		wss.on('headers', wsHeaders);
		wss.on('connection', wsConnection);
	};

	function wsHeaders (headers, req) {
		sessions.identifySession(req);
		var session = sessions.getById(req.sessionId);
		if (session.isNew) {
			delete session.isNew;
			log.write('wsChannel', 'set cookie', log.bright, log.red, session.id, log.reset);
			headers.push('Set-Cookie: session='+session.id);
		}
	};

	function wsConnection (ws, req) {
		var session = sessions.getById(req.sessionId);

		ws.on('close', function () {
			session.ws = false;
			session.channel = false;
		});

		ws.on('message', function (rawMessage) {
			session.ws = this;
			session.channel = 'ws';

			var message = JSON.parse(rawMessage);
			log.write('wsChannel', 'receive', session.id, log.yellow, message, log.reset);
			messageHandler(session.id, message);
		});
	};

	function send (sessionId, message) {
		var session = sessions.getById(sessionId);

		var readyStates = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
		if (session.ws && session.ws.readyState==readyStates.indexOf('OPEN')) {

			if (typeof(message) == 'function') {
				message = message(session);
			}

			log.write('wsChannel', 'send', session.id, log.bright, log.blue, message, log.reset);
			var rawMessage = JSON.stringify(message);
			session.ws.send(rawMessage);
		}
	};

	init(server);

	return {
		send: send
	};
};
