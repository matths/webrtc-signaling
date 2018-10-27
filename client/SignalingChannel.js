function SignalingChannel() {
    throw new Error('use SignalingChannel.getChannel(url, type) to create a signaling channel.');
}

SignalingChannel.getChannel = function (url, type, openedCallback) {
    var capitalizedType = type.charAt(0).toUpperCase() + type.toLowerCase().slice(1);
    var knownChannels = ['Xhr', 'Ws'];
    if (knownChannels.indexOf(capitalizedType)!=-1) {
        var Channel = window[capitalizedType + 'Channel'];
        if (Channel) {
            var TypedSignalingChannel = function(url, openedCallback) {
                this.initChannel(url, openedCallback)
                this.initSignaling()
            }
            TypedSignalingChannel.name = capitalizedType+'SignalingChannel';
            Object.assign(TypedSignalingChannel.prototype, SignalingChannel.prototype);
            Object.assign(TypedSignalingChannel.prototype, Channel.prototype);
            return new TypedSignalingChannel(url, openedCallback);
        }
    }
};

Object.assign(SignalingChannel.prototype, {

    // send ice candidate or sdp messages
    sendIceCandidate: function(callId, candidate) {
        this.send({
            "to": callId,
            "candidate": candidate
        });
    },
    sendLocalDescription: function(callId, localDescription) {
        this.send({
            "to": callId,
            "sdp": localDescription
        });
    },

    // receive ice candidate or sdp messages
    initSignaling: function() {
        debug('initSignaling');
        this.addEventListener('message', function (e) {
            var message = e.message;
            if (message.from != null && message.sdp != null) {
                if (this.onSdp && typeof this.onSdp === 'function') {
                    this.onSdp(message.from, message.sdp);
                }
                this.dispatchEvent({
                    type: 'sdp',
                    from: message.from,
                    sdp: message.sdp
                });
            } else if (message.from != null && message.candidate != null) {
                if (this.onCandidate && typeof this.onCandidate === 'function') {
                    this.onCandidate(message.from, message.candidate);
                }
                this.dispatchEvent({
                    type: 'candidate',
                    from: message.from,
                    candidate: message.candidate
                });
            }
        });
    }

});
