function XhrChannel(url) {
    init(url)
}

Object.assign(XhrChannel.prototype, {
    initChannel: function(url) {
        this.url = url;
        this.messages = [];
        this.emptyResult = false;
        this.isTransmitting = false;
        this.count = 0;

        this.startTransmitLoop()
    },

    startTransmitLoop: function() {
        var that = this;
        this.interval = setInterval(function () {
            that.transmit.call(that);
        }, 200);
    },

    transmit: function() {
        if (!this.isTransmitting) {
            var message = false;
            var isEmpty = false;
            if (this.messages.length > 0) {
                message = this.messages.shift();
            } else if (!this.emptyResult) {
                message = {};
                isEmpty = true;
            } else if (this.count == 10) {
                message = {};
                isEmpty = true;
                this.count = 0;
            } else {
                this.count++;
            }
            if (message) {
                this.isTransmitting = true;
                if (!isEmpty) {
                    console.log('sent: ', message);
                }
                var that = this;
                xhr(this.url, message, function(messageBack) {
                    that.isTransmitting = false;
                    that.count = 0;
                    that.emptyResult = (Object.keys(messageBack).length === 0);
                    if (!that.emptyResult) {
                        console.log('received: ', messageBack);
                        that.onmessage(messageBack);
                        that.dispatchEvent({
                            type: 'message',
                            message: messageBack
                        });
                    }
                });
            }
        }
    },

    send: function(message) {
        this.messages.push(message);
    },

    onmessage: function(message) {
    }
});

Object.assign(XhrChannel.prototype, EventDispatcher.prototype);
