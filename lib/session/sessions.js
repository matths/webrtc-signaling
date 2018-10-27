const parseCookies = require('../request/parseCookies');
const obtainIPv4 = require('../request/obtainIPv4');
const obtainMacAddressMiddleware = require('../request/obtainMacAddressMiddleware');
const uniqueId = require('../utils/uniqueId');

var sessions = [];

function identifySessionMiddleware (req, res, next) {
	parseCookies(req);
	obtainIPv4(req);
	obtainMacAddressMiddleware(req, res, function(req, res) {
		createOrUpdateSession (req, res, next);
	});
};

function createOrUpdateSession (req, res, next) {
	req.sessionId = req.cookies['session'];
	if (!req.sessionId || !getById(req.sessionId)) {
		req.sessionId = uniqueId();
		console.log("new session", req.sessionId);
		sessions.push({
			id: req.sessionId,
			isNew: true,
			ipv4: req.ipv4,
			macAddress: req.macAddress
		});
	}
	next(req, res);
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
	identifySessionMiddleware: identifySessionMiddleware,
	getAll: getAll,
	getById: getById,
	getOther: getOther
};
