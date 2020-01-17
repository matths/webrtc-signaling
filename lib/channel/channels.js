const xhrChannel = require('./xhrChannel');
const wsChannel = require('./wsChannel');

var exports = module.exports = {
	getXhrChannel: xhrChannel,
	getWsChannel: wsChannel
};
