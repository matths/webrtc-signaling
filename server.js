const https = require('https');
const path = require('path');
const fs = require('fs');

const log = require('./lib/utils/log');

const currentDir = path.dirname(fs.realpathSync(__filename));

const serveStatic = require('serve-static');
const serveStaticFilesMiddleware = serveStatic(path.join(currentDir, 'client'), {
	'index': ['index.html', 'index.htm']	
});

// to create self-signed certificate and key run `npm run create-ssl`
const key = fs.readFileSync(path.join(currentDir, 'ssl/private/server.key'));
const cert = fs.readFileSync(path.join(currentDir, 'ssl/certs/server.crt'));
const options = {
	key: key,
	cert: cert,
	requestCert: false,
	rejectUnauthorized: false
};

var server = https.createServer(options, function (req, res) {
	if (req.signaling) {
		return;
	}

	res.addListener('finish', function () {
		log.write('serve-static', req.connection.remoteAddress, res.statusCode, req.url);
	});

	serveStaticFilesMiddleware(req, res, function (err) {
		if (err) {
			log.write('serve-static', log.red+'error'+log.reset, err);
			res.writeHead(500, {"Content-Type": "text/plain"});
			res.write("500 Internal Server Error\n");
			res.end();
		} else {
			res.writeHead(404, {"Content-Type": "text/plain"});
			res.write("404 Not Found\n");
			res.end();
		}
	});
});
server.listen(8000);

const signaling = require('./lib/signaling');
signaling(server, {
	xhr: true,
	ws: true
});
