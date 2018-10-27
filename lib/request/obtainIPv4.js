var exports = module.exports = function obtainIPv4(req) {
	var ipv4 = req.connection.remoteAddress;
	req.ipv4 = (ipv4.indexOf(':')!==false) ? ipv4.split(':').pop() : ipv4;
};
