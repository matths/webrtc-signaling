const parseCookies = require('../request/parseCookies');
const obtainIPv4 = require('../request/obtainIPv4');
const obtainMacAddressMiddleware = require('../request/obtainMacAddressMiddleware');
const uniqueId = require('../utils/uniqueId');
const md5hash = require('../utils/md5hash');

var connections = [];
var createdMaxAge = (24 * 60 * 60 * 1000); // 24h * 60min * 60s * 1000ms
var updateddMaxAge = (15 * 1000); // 15s * 1000ms

function identifyConnection(req) {
	parseCookies(req);
	obtainIPv4(req);
	createOrUpdateConnection(req);
};

function enrichWithMacAddress(req, res, next) {
	obtainMacAddressMiddleware(req, res, function(req, res, next2) {
		var connection = getOne(req.sessionId, req.gatewayId);
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
	if (!req.sessionId || !getOne(req.sessionId, req.gatewayId)) {
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
	connections.push({
		id: md5hash(req.sessionId+req.gatewayId),
		sessionId: (req.sessionId),
		gatewayId: (req.gatewayId),
		created: Date.now(),
		updated: Date.now(),
		isNew: true,
		ipv4: req.ipv4,
		macAddress: req.macAddress
	});
};

function updateConnection (req) {
	var connection = getOne(req.sessionId, req.gatewayId);
	connection.updated = Date.now();
	removeInactiveConnections();
};

function removeInactiveConnections () {
	connections = connections.filter(function(connection) {
		const createdAge = connection.updated - connection.created;
		const updatedAge = Date.now() - connection.updated;
		const keep = (createdAge < createdMaxAge) && ((updatedAge < updateddMaxAge) || (connection.channel == 'ws'));
		if (!keep) {
		 	console.log('auto remove connection', connection.sessionId, connection.gatewayId, connection.channel);
		}
		return keep;
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

function getOne (sessionId, gatewayId) {
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
	getOne: getOne,
	getOther: getOther
};
