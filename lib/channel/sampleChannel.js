// simplified channel example

var exports = module.exports = function getChannel (server, connections, messageHandler) {

	server.addListener('receiveEvent', receive);
	function receive (event) {
		messageHandler(event.connection, event.message);
	}

	function send (connectionId, message) {
		var connection = server.getConnection(connectionId);
		connection.send(message);
	}

	return {
		send: send
	};
};
