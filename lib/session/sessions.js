const parseCookies = require('../request/parseCookies');
const obtainIPv4 = require('../request/obtainIPv4');
const obtainMacAddressMiddleware = require('../request/obtainMacAddressMiddleware');
const uniqueId = require('../utils/uniqueId');
const md5hash = require('../utils/md5hash');

var sessions = [];

function identifySession(req) {
	parseCookies(req);
	obtainIPv4(req);
	createOrUpdateSession(req);
};

function enrichWithMacAddress(req, res, next) {
	obtainMacAddressMiddleware(req, res, function(req, res, next2) {
		var session = getByIds(req.sessionId, req.streamId);
		session.macAddress = req.macAddress;
		next(req, res);
	});
}

function identifySessionMiddleware (req, res, next) {
	identifySession(req);
	enrichWithMacAddress(req, res, next);
};

function createOrUpdateSession (req) {
	req.streamId = differentiateStreamsWithinSession(req);
	req.sessionId = req.cookies['session'];
	if (!req.sessionId || !getByIds(req.sessionId, req.streamId)) {
		createSession(req);
	}
	updateSession(req);
};

function differentiateStreamsWithinSession (req) {
	var streamId = 'default';
	if (req.headers) {
		if (req.headers['sec-websocket-key']) {
			// unique websocket key
			streamId = req.headers['sec-websocket-key'];
		}
		if (req.headers['x-window-name']) {
			// unique xhr window.name
			streamId = req.headers['x-window-name'];
		}
	}
	return streamId;
}

function createSession (req) {
	req.sessionId = uniqueId();
	console.log("new session", req.sessionId);
	sessions.push({
		id: md5hash(req.sessionId+req.streamId),
		sessionId: (req.sessionId),
		streamId: (req.streamId),
		created: Date.now(),
		isNew: true,
		ipv4: req.ipv4,
		macAddress: req.macAddress
	});
};

function updateSession (req) {
	var session = getByIds(req.sessionId, req.streamId);
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

function getByIds (sessionId, streamId) {
	return sessions.filter(function(session) {
		return (session.sessionId == sessionId && session.streamId == streamId);
	}).shift();
};

function getOther (sessionId, streamId) {
	return sessions.filter(function(session) {
		return !(session.sessionId == sessionId && session.streamId == streamId);
	});
};

var exports = module.exports = {
	identifySession: identifySession,
	identifySessionMiddleware: identifySessionMiddleware,
	updateSession: updateSession,
	removeSession: removeSession,
	getAll: getAll,
	getByIds: getByIds,
	getOther: getOther
};
