function WsChannel(host, openedCallback) {
    this.initChannel(host, openedCallback);
}

Object.assign(WsChannel.prototype, {
    initChannel: function(host, openedCallback) {
        this.url = 'wss://' + host;
        this.ws = false;
        this.openedCallback = openedCallback;

        this.startWebSocket()
    },

    startWebSocket: function() {
        this.ws = new WebSocket(this.url, []);
        this.ws.addEventListener('error', this.errorHandler.bind(this));
        this.ws.addEventListener('message', this.messageHandler.bind(this));
        this.ws.addEventListener('open', this.openHandler.bind(this));
        this.ws.addEventListener('close', this.closeHandler.bind(this));
    },

    errorHandler: function (e) {
        console.log('ws error', e);
    },

    openHandler: function (e) {
        console.log('ws open', e);
//        this.send({});
        this.openedCallback(this);
    },

    closeHandler: function (e) {
        console.log('ws close', e);
    },

    messageHandler: function (e) {
        console.log('ws message', e);
        var messageRaw = e.data;
        var message = JSON.parse(messageRaw);
        var emptyResult = (Object.keys(message).length === 0);
        if (!emptyResult) {
            console.log('received: ', message);
            this.onmessage(message);
            this.dispatchEvent({
                type: 'message',
                message: message
            });
        }
    },

    send: function(message) {
        var messageRaw = JSON.stringify(message);
        this.ws.send(messageRaw);
    },

    onmessage: function(message) {
    }
});

Object.assign(WsChannel.prototype, EventDispatcher.prototype);
