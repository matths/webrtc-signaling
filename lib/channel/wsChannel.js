const ws = require ('ws');

// channel using WebSockets (WS)

var exports = module.exports = function getChannel (server, sessions, messageHandler) {

	function init (server) {
		const wss = new ws.Server({server});
		wss.on('headers', function connection(headers, req) {
			wsHeaders(headers, req);
		});
		wss.on('connection', function connection(ws, req) {
			wsConnection(ws, req);
		});
	};

	function wsHeaders (headers, req) {
		sessions.identifySession(req);
		var session = sessions.getById(req.sessionId);
		if (session.isNew) {
			delete session.isNew;
			headers.push('Set-Cookie: session='+req.sessionId);
		}
	};

	function wsConnection (ws, req) {
		var session = sessions.getById(req.sessionId);

		ws.on('close', function () {
			console.log('close', arguments);
			session.ws = false;
		});

		ws.on('message', function (rawMessage) {
			console.log('message', arguments);
			session.ws = this;

			var message = JSON.parse(rawMessage);
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

			console.log("send per ws", message);
			var rawMessage = JSON.stringify(message);
			session.ws.send(rawMessage);
		}
	};

	init(server);

	return {
		send: send
	};
};
