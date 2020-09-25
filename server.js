const https = require('https');
const path = require('path');
const fs = require('fs');
const serveStatic = require('serve-static');
const log = require('./lib/utils/log');
const Signaling = require('./lib/Signaling');
const webrtcHandshake = require('./webrtcHandshake');
const echoChat = require('./echoChat');

const currentDir = path.dirname(fs.realpathSync(__filename));

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
	res.addListener('finish', function () {
		const ip = req.connection.remoteAddress?req.connection.remoteAddress:'0.0.0.0';
		log.write('access', ip, res.statusCode, req.url);
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
server.listen(8000, '0.0.0.0');

var signaling = new Signaling(server, {
	xhr: true,
	jsonp: true,
	ws: true
});

echoChat(signaling);
webrtcHandshake(signaling);
