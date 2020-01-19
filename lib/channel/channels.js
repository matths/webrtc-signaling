const xhrChannel = require('./xhrChannel');
const jsonpChannel = require('./jsonpChannel');
const wsChannel = require('./wsChannel');

var exports = module.exports = {
	getXhrChannel: xhrChannel,
	getJsonpChannel: jsonpChannel,
	getWsChannel: wsChannel
};
