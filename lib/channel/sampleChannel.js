// simplified channel example

var exports = module.exports = function getChannel (server, sessions, messageHandler) {

	server.addListener('receiveEvent', receive);
	function receive (event) {
		messageHandler(event.session, event.message);
	}

	function send (sessionId, message) {
		var session = server.getSession(sessionId);
		session.send(message);
	}

	return {
		send: send
	};
};
