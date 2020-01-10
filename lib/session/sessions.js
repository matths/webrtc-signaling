const parseCookies = require('../request/parseCookies');
const obtainIPv4 = require('../request/obtainIPv4');
const obtainMacAddressMiddleware = require('../request/obtainMacAddressMiddleware');
const uniqueId = require('../utils/uniqueId');

var sessions = [];

function identifySession(req) {
	parseCookies(req);
	obtainIPv4(req);
	createOrUpdateSession(req);
};

function enrichWithMacAddress(req, res, next) {
	obtainMacAddressMiddleware(req, res, function(req, res, next2) {
		var session = getById(req.sessionId);
		session.macAddress = req.macAddress;
		next(req, res);
	});
}

function identifySessionMiddleware (req, res, next) {
	identifySession(req);
	enrichWithMacAddress(req, res, next);
};

function createOrUpdateSession (req) {
	req.sessionId = req.cookies['session'];
	if (!req.sessionId || !getById(req.sessionId)) {
		createSession(req);
	}
	updateSession(req);
};

function createSession (req) {
	req.sessionId = uniqueId();
	console.log("new session", req.sessionId);
	sessions.push({
		id: req.sessionId,
		created: Date.now(),
		isNew: true,
		ipv4: req.ipv4,
		macAddress: req.macAddress
	});
};

function updateSession (req) {
	var session = getById(req.sessionId);
	session.updated = Date.now();
	// removeInactiveSessions();
};

function removeInactiveSessions () {
	var now = Date.now();
	sessions = sessions.filter(function(session) {
		console.log(now, session.updated, now - session.updated);
		return (now - session.updated) < (1 * 60 * 1000);
	});
};

function removeSession (sessionToRemove) {
	sessions = sessions.filter(function(session) {
		return sessionToRemove != session;
	});
};

function getAll () {
	return sessions;
};

function getById (sessionId) {
	return sessions.filter(function(session) {
		return (session.id == sessionId);
	}).shift();
};

function getOther (sessionId) {
	return sessions.filter(function(session) {
		return (session.id != sessionId);
	});
};

var exports = module.exports = {
	identifySession: identifySession,
	identifySessionMiddleware: identifySessionMiddleware,
	updateSession: updateSession,
	removeSession: removeSession,
	getAll: getAll,
	getById: getById,
	getOther: getOther
};
