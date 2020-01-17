const parseCookies = require('../request/parseCookies');
const obtainIPv4 = require('../request/obtainIPv4');
const obtainMacAddressMiddleware = require('../request/obtainMacAddressMiddleware');
const uniqueId = require('../utils/uniqueId');
const md5hash = require('../utils/md5hash');

var connections = [];

function identifyConnection(req) {
	parseCookies(req);
	obtainIPv4(req);
	createOrUpdateConnection(req);
};

function enrichWithMacAddress(req, res, next) {
	obtainMacAddressMiddleware(req, res, function(req, res, next2) {
		var connection = getByIds(req.sessionId, req.gatewayId);
		connection.macAddress = req.macAddress;
		next(req, res);
	});
}

function identifyConnectionMiddleware (req, res, next) {
	identifyConnection(req);
	enrichWithMacAddress(req, res, next);
};

function createOrUpdateConnection (req) {
	req.gatewayId = differentiateGatewayWithinConnection(req);
	req.sessionId = req.cookies['session'];
	if (!req.sessionId || !getByIds(req.sessionId, req.gatewayId)) {
		createConnection(req);
	}
	updateConnection(req);
};

function differentiateGatewayWithinConnection (req) {
	var gatewayId = 'default';
	if (req.headers) {
		if (req.headers['sec-websocket-key']) {
			// unique websocket key
			gatewayId = req.headers['sec-websocket-key'];
		}
		if (req.headers['x-window-name']) {
			// unique xhr window.name
			gatewayId = req.headers['x-window-name'];
		}
	}
	return gatewayId;
}

function createConnection (req) {
	req.sessionId = uniqueId();
	console.log("new connection", req.sessionId, req.gatewayId);
	connections.push({
		id: md5hash(req.sessionId+req.gatewayId),
		sessionId: (req.sessionId),
		gatewayId: (req.gatewayId),
		created: Date.now(),
		isNew: true,
		ipv4: req.ipv4,
		macAddress: req.macAddress
	});
};

function updateConnection (req) {
	var connection = getByIds(req.sessionId, req.gatewayId);
	connection.updated = Date.now();
	// removeInactiveConnections();
};

function removeInactiveConnections () {
	var now = Date.now();
	connections = connections.filter(function(connection) {
		console.log(now, connection.updated, now - connection.updated);
		return (now - connection.updated) < (1 * 60 * 1000);
	});
};

function removeConnection (connectionToRemove) {
	connections = connections.filter(function(connection) {
		return connectionToRemove != connection;
	});
};

function getAll () {
	return connections;
};

function getByIds (sessionId, gatewayId) {
	return connections.filter(function(connection) {
		return (connection.sessionId == sessionId && connection.gatewayId == gatewayId);
	}).shift();
};

function getOther (sessionId, gatewayId) {
	return connections.filter(function(connection) {
		return !(connection.sessionId == sessionId && connection.gatewayId == gatewayId);
	});
};

var exports = module.exports = {
	identifyConnection: identifyConnection,
	identifyConnectionMiddleware: identifyConnectionMiddleware,
	updateConnection: updateConnection,
	removeConnection: removeConnection,
	getAll: getAll,
	getByIds: getByIds,
	getOther: getOther
};
