const crypto = require("crypto");

const ws = require ('ws');
const macfromip = require('./macfromip');

var knownPeers = require('../config/known_peers.js');


var config = {
	"cookieName": "messaging",
	"useMacAddress": true
};

var peers = [];


function getPeerById(id) {
	var peer = peers.filter(function(_peer) {
		return (_peer.id == id);
	}).shift();
	return peer;
}

function getAvailablePeers() {
	return peers.map(function(_peer) {
		return {
			id: _peer.id,
			name: _peer.name
		};
	});
}

function getUniqueId() {
	// return crypto.randomBytes(3*4).toString('base64');
	return crypto.randomBytes(16).toString("hex");
}

function identifyPeer(req) {
	var peerId = req.cookies[config.cookieName];
	if (!peerId) {
		peerId = getUniqueId();
	}
	var peer = getPeerById(peerId);
	if (!peer) {
		peer = {
			"id": peerId,
			"name": false,
			"partnerId": false,
			"ipv4": false,
			"macAddress": false,
			messages: []
		};
		peers.push(peer);
	}
	req.peer = peer;
}

function messageToSelf(req, message) {
	req.peer.messages.push(message);
}

function messageToAll(req, message) {
	peers.forEach(function(_peer) {
		_peer.messages.push(message);
	});
}

function messageToOthers(req, message) {
	peers.forEach(function(_peer) {
		if (req.peer != _peer) {
			_peer.messages.push(message);
		}
	});
}

function messageToPartner(req, message) {
	peers.forEach(function(_peer) {
		if (req.peer.partnerId == _peer.id) {
			_peer.messages.push(message);
		}
	});
}

function responseWithAvailablePeers(req, res, next) {
	var responseMessage = { "availablePeers": getAvailablePeers() };

	var responseMessageFunction = function (_req) {
		responseMessage.availablePeers.forEach(function (_availablePeer) {
			_availablePeer.self = (_availablePeer.id == _req.peer.id) ? 1 : 0;
		});
		return responseMessage;
	};

	messageToAll(req, responseMessageFunction);
	sendMessages(req, res, next);
}

function messaging(req, res, next) {
	identifyPeer(req);

	req.peer.ipv4 = req.ipv4;

	var message = req.body;
	var messageIsEmpty = (Object.keys(message).length === 0);

	if (!messageIsEmpty) {
		console.log('FROM', req.ipv4, message);
	}

	if (message.introduction) {
		req.peer.name = message.introduction;

		if (!config.useMacAddress) {
			responseWithAvailablePeers(req, res, next);

		} else {
			obtainMacAddressMiddleware(req, res, function(req, res, next) {
				var macAddress = req.peer.macAddress = req.macAddress;

				// lookup mac address in known peer config
				var knownPeer = knownPeers.filter(function (_knownPeer) {
					return (_knownPeer.macAddress == macAddress);
				}).shift();

				if (knownPeer) {
					req.peer.name  = knownPeer.name;
				}

				responseWithAvailablePeers(req, res, next);
			});
		}
	} else {
		if (message.partner) {
			req.peer.partnerId = message.partner;
			peers.forEach(function (peer) {
				if (peer.id == req.peer.partnerId) {
					peer.partnerId = req.peer.id;
				}
			});
		}

		// WebRTC signaling
		if (message.candidate || message.sdp) {
			messageToPartner(req, message);
		}

		sendMessages(req, res, next);
	}
}

function sendMessages(req, res, next) {

	res.setHeader('Content-Type', 'application/json');
	res.setHeader('Set-Cookie', [config.cookieName+'='+req.peer.id]);

	if (req.peer.messages.length>0) {
		var message = req.peer.messages.shift();

		if (typeof(message) == 'function') {
			message = message(req);
		}

		console.log('TO', req.ipv4, message);
	} else {
		var message = {};
	}

	res.end(JSON.stringify(message));
}

function xhrRequestHandler (req, res) {
	obtainIPv4(req);
	obtainMacAddressMiddleware(req, res, function (req, res) {
		parseCookies(req);
		identifyPeer(req);
		parseBodyMiddleware(req, res, messaging);
	});
};

function wsHeaders (headers, req) {
	obtainIPv4(req);
	obtainMacAddressMiddleware(req, null, function (req, res) {
		parseCookies(req);
		identifyPeer(req);
		headers.push(`Set-Cookie: ${cookieName}=${req.peer.id}`)
	});
};

function wsConnection (ws, req) {
	ws.on('close', function () {
		console.log('close', arguments);
	});
	ws.on('message', function (message) {
		console.log('message', arguments);
		ws.send(message);
	});
};

function parseCookies (req) {
	req.cookies = {};
	var cookiesAsString = req.headers.cookie;
	if (cookiesAsString) {
		cookiesAsString.split(';').forEach(function(cookie) {
			var parts = cookie.split('=');
			req.cookies[parts.shift().trim()] = decodeURI(parts.join('='));
		});
	}
};

function parseBodyMiddleware(req, res, next) {
	if (req.method == 'POST') {
		var rawBody = '';
		req.on('data', function (data) {
			rawBody += data;
			if (rawBody.length > 1e6) {
				req.connection.destroy(); // too big, cancel now
			}
		});
		req.on('end', function () {
			req.rawBody = rawBody;
			req.body = JSON.parse(rawBody);
			next(req, res);
		});
	} else {
		req.rawBody = false;
		req.body = false;
		next(req, res);
	}
};

function obtainIPv4(req) {
	var ipv4 = req.connection.remoteAddress;
	req.ipv4 = (ipv4.indexOf(':')!==false) ? ipv4.split(':').pop() : ipv4;
};

function obtainMacAddressMiddleware(req, res, next) {
	if (!req.ipv4) {
		obtainIPv4(req);
	}
	if (req.ipv4=='127.0.0.1') {
		req.macAddress = '00:00:00:00:00:00';
		next(req, res);
	} else {
		macfromip.getMac(req.ipv4, function(err, macAddress) {
			if (err) {
				console.log('error retrieving mac address', err);
			}
			req.macAddress = macAddress;
			next(req, res);
		});
	}
};

function signaling(server, options = {}) {
    var defaults = {
        xhr: false,
        ws: false
    };
    var actual = Object.assign({}, defaults, options);

    if (actual.xhr) {
		server.prependListener('request', function (req, res) {
			if (req.url.indexOf('signaling')!==-1) {
				xhrRequestHandler(req, res);
			}
		});
	}

    if (actual.ws) {
		const wss = new ws.Server({server});
		wss.on('headers', function connection(headers, req) {
			wsHeaders(headers, req);
		});
		wss.on('connection', function connection(ws, req) {
			wsConnection(ws, req);
		});
    }
}

var exports = module.exports = signaling;

