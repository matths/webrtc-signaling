const macfromip = require('../utils/macfromip');

var exports = module.exports = function obtainMacAddressMiddleware(req, res, next) {
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