var exports = module.exports = function parseBodyMiddleware(req, res, next) {
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