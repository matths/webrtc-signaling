var exports = module.exports = function parseCookies (req) {
	req.cookies = {};
	var cookiesAsString = req.headers.cookie;
	if (cookiesAsString) {
		cookiesAsString.split(';').forEach(function(cookie) {
			var parts = cookie.split('=');
			req.cookies[parts.shift().trim()] = decodeURI(parts.join('='));
		});
	}
};
