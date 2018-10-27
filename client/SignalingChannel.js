function SignalingChannel() {
    throw new Error('use SignalingChannel.getChannel(url, type) to create a signaling channel.');
}

SignalingChannel.getChannel = function (url, type) {
    var capitalizedType = type.charAt(0).toUpperCase() + type.toLowerCase().slice(1);
    var knownChannels = ['Xhr', 'Ws'];
    if (knownChannels.indexOf(capitalizedType)!=-1) {
        var Channel = window[capitalizedType + 'Channel'];
        if (Channel) {
            var TypedSignalingChannel = function(url) {
                this.initChannel(url)
                this.initSignaling()
            }
            TypedSignalingChannel.name = capitalizedType+'SignalingChannel';
            Object.assign(TypedSignalingChannel.prototype, SignalingChannel.prototype);
            Object.assign(TypedSignalingChannel.prototype, Channel.prototype);
            return new TypedSignalingChannel(url);
        }
    }
};

Object.assign(SignalingChannel.prototype, {

    // send ice candidate or sdp messages
    sendIceCandidate: function(candidate) {
        this.send({ "candidate": candidate });
    },
    sendLocalDescription: function(localDescription) {
        this.send({ "sdp": localDescription });
    },

    // receive ice candidate or sdp messages
    initSignaling: function() {
        debug('initSignaling');
        this.addEventListener('message', function (e) {
            var message = e.message;
            if (message.sdp != null) {
                if (this.onSdp && typeof this.onSdp === 'function') {
                    this.onSdp(message.sdp);
                }
                this.dispatchEvent({
                    type: 'sdp',
                    sdp: message.sdp
                });
            } else if (message.candidate != null) {
                if (this.onCandidate && typeof this.onCandidate === 'function') {
                    this.onCandidate(message.candidate);
                }
                this.dispatchEvent({
                    type: 'candidate',
                    candidate: message.candidate
                });
            }
        });
    }

});
