const connections = require('./lib/connection/connections');
let signaling;

function echoChat(_signaling) {
    signaling = _signaling;
    signaling.addListener('message', function (connection, message) {
        if (message.type == 'chat') {
            messageToAll(message); // just echo
        }
    });    
}

function messageToAll (message) {
    connections.getAll().forEach(function(connection) {
        signaling.send(connection, message);
    });
};

var exports = module.exports = echoChat;
