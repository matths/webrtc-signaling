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
		sessions.identifySessionMiddleware(req, null, function(req, res) {
			var session = sessions.getById(req.sessionId);
			if (session.isNew) {
				delete session.isNew;
				headers.push('Set-Cookie: session='+req.sessionId);
			}
		});
	};

	function wsConnection (ws, req) {
		ws.on('close', function () {
			console.log('close', arguments);
		});
		ws.on('message', function (rawMessage) {
			console.log('message', arguments);
			var session = sessions.getById(req.sessionId);
			session.ws = this;

			if (typeof(message) == 'function') {
				message = message(session);
			}

			var message = JSON.parse(rawMessage);
			messageHandler(req.sessionId, message);
		});
	};

	function send (sessionId, message) {
		var session = sessions.getById(sessionId);
		if (session.ws) {
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
