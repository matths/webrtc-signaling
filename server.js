const https = require('https');
const path = require('path');
const fs = require('fs');

const currentDir = path.dirname(fs.realpathSync(__filename));

const serveStatic = require('serve-static');
const serveStaticFilesMiddleware = serveStatic(path.join(currentDir, 'client'), {
	'index': ['index.html', 'index.htm']	
});

// to create self-signed certificate and key run `npm run-scripts create-ssl`
const key = fs.readFileSync(path.join(currentDir, 'ssl/private/server.key'));
const cert = fs.readFileSync(path.join(currentDir, 'ssl/certs/server.crt'));
const options = {
	key: key,
	cert: cert,
	requestCert: false,
	rejectUnauthorized: false
};

var server = https.createServer(options, function (req, res) {
	serveStaticFilesMiddleware(req, res, function (err) {
		if (err) {
			console.log(err);
		} else {
			console.log("fall-through for", req.url);
			res.writeHead(404, {"Content-Type": "text/plain"});
			res.write("404 Not Found\n");
			res.end();
		}
	});
});
server.listen(8000);

const signaling = require('./lib/signaling');
signaling(server, {
	xhr: false,
	ws: true
});

// const repl = require('repl');
// const replServer = repl.start({
// 	prompt: 'channel test >'
// });

// const channel = require('./lib/channel/channel');
// const ch = channel.getWsChannel(server, function (sessionId, message) {
// 	console.log("incoming");
// 	ch.send(sessionId, '{"foo": "bar"}');
// });
// replServer.context.channel = ch;
