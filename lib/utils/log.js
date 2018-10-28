const path = require('path');
const fs = require('fs');
const logger = require('../../config/logger.js');

const currentDir = path.dirname(fs.realpathSync(__filename));
const filepath = path.join(currentDir, '../../log/');

if (!fs.existsSync(filepath)){
    fs.mkdirSync(filepath);
}

function getCurrentDateTime () {
	var date = new Date();
	var datetime = date.getFullYear() + "/" + (date.getMonth()+1)  + "/" + date.getDate();
	datetime +=  " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
	return datetime;
}

function getDefaultLog () {
	return {
		"name": "default",
		"type": "console",
		"addDatetime": false,
		"addName": true
	};
}

function findLogByName (name) {
	var log = logger.filter(function (log) {
		return (log.name == name);
	}).shift();

	if (!log) {
		log = getDefaultLog();
	}

	return log;
}

function getCallingModuleName () {
	var currentFile = fs.realpathSync(__filename);
	var moduleFile = false;
	try {
		throw Error()
	} catch (e) {
		var isLog = false;
		e.stack.split('\n').some(function (trace) {
			var matches = /\(([^\(]*\.js):(\d*):(\d*)\)/.exec(trace);
			if (matches && matches.length==4) {
				var file = matches[1];
				var line = matches[2];
				var char = matches[3];
				if (isLog && (file!=currentFile)) {
					moduleFile = file;
					return true;
				} else {
					isLog = (file==currentFile);
				}
			}
			return false;
		});
		return moduleFile;
	}
}

function write (name, message) {
	var callingFunctioName = arguments.callee.caller.name;
	var callingModuleName = getCallingModuleName();

	var log = findLogByName(name);

	var args = Array.prototype.slice.call(arguments);
	args.shift();
	if (log.addName) {
		args.unshift(log.name);
	}
	if (log.addDatetime) {
		args.unshift(getCurrentDateTime());
	}

	if (log.type == 'console') {
		console.log.apply(console, args);

	} else if (log.type == 'file') {
		var message = args.join(' ') + "\n";
		var file = path.join(filepath, log.file);
		fs.appendFile(file, message, function (err) {
			if (err) console.log('error logging to file.');
		});
	}
}

var exports = module.exports = {
	write: write,

	reset: "\x1b[0m",

	bright: "\x1b[1m",
	dim: "\x1b[2m",
	underscore: "\x1b[4m",
	blink: "\x1b[5m",
	reverse: "\x1b[7m",
	hidden: "\x1b[8m",

	black: "\x1b[30m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	magenta: "\x1b[35m",
	cyan: "\x1b[36m",
	white: "\x1b[37m",

	backgroundBlack: "\x1b[40m",
	backgroundRed: "\x1b[41m",
	backgroundGreen: "\x1b[42m",
	backgroundYellow: "\x1b[43m",
	backgroundBlue: "\x1b[44m",
	backgroundMagenta: "\x1b[45m",
	backgroundCyan: "\x1b[46m",
	backgroundWhite: "\x1b[47m"
}
