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
		var session = sessions.getByIds(req.sessionId, req.streamId);
		if (session.isNew) {
			delete session.isNew;
			log.write('wsChannel', 'set cookie', log.bright, log.red, session.sessionId, session.streamId, log.reset);
			headers.push('Set-Cookie: session='+session.sessionId);
		}
	};

	function wsConnection (ws, req) {
		var session = sessions.getByIds(req.sessionId, req.streamId);
		session.ws = ws;
		session.channel = 'ws';

		ws.on('close', function () {
			session.ws = false;
			session.channel = false;
			sessions.removeSession(session);
		});

		ws.on('message', function (rawMessage) {
			var message = JSON.parse(rawMessage);
			log.write('wsChannel', 'receive', session.sessionId, session.streamId, log.yellow, message, log.reset);
			messageHandler(session, message);
		});
	};

	function send (sessionId, streamId, message) {
		var session = sessions.getByIds(sessionId, streamId);

		var readyStates = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
		if (session.ws && session.ws.readyState==readyStates.indexOf('OPEN')) {

			if (typeof(message) == 'function') {
				message = message(session);
			}

			log.write('wsChannel', 'send', session.sessionId, session.streamId, log.bright, log.blue, message, log.reset);
			var rawMessage = JSON.stringify(message);
			session.ws.send(rawMessage);
		}
	};

	init(server);

	return {
		send: send
	};
};
