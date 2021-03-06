function debug() {
    if (window.console) {
        console.log.apply(console, arguments);
    }
}

function createVideoElement(parent, width, height, muted) {
    var video = document.createElement('video');
    video.width = width;
    video.height = height;
    video.autoplay = true;
    video.muted = muted;
    parent.append(video);
    return video;
}

window.addEventListener("load", function (e) {

    var width = 400;
    var height = 300;

    var body = document.getElementsByTagName('body')[0];
    var localVideo = createVideoElement(body, width, height, true);
    var remoteVideo = createVideoElement(body, width, height, true); //false);

    var localStream = null;
    var remoteStream = null;

    var peerConnection= new RTCPeerConnection({
        // configuration
        iceServers: [] // [{"url": "stun:stun.l.google.com:19302"}]
    });

    var gotLocalStream = function(_localStream) {
        localStream = _localStream;
        localVideo.srcObject = localStream;
        // localVideo.src = window.URL.createObjectURL(localStream);
        peerConnection.addStream(localStream);
    };

    // local video stream
    var gotRemoteStream = function(_remoteStream) {
        remoteStream = _remoteStream;
        remoteVideo.srcObject = remoteStream;
        // remoteVideo.src = window.URL.createObjectURL(remoteStream);
    };

    var signalingChannelOpened = function(signalingChannel) {
        signalingChannel.send({"introduction": "noname"});
    };

    var host = window.location.host;
    var type = 'xhr'; // 'ws';
    var signalingChannel = SignalingChannel.getChannel(host, type, signalingChannelOpened);

    signalingChannel.addEventListener('sdp', function (e) {
        debug('sdp');
        // If we get a sdp we have to sign and return it?!
        var unsignedRemoteDescription = new RTCSessionDescription(e.sdp);
        if (e.sdp.type=='offer') {
            debug('OFFER');
            var callId = e.from;
            //when somebody sends us an offer 
            peerConnection.setRemoteDescription(unsignedRemoteDescription, function () {
                peerConnection.createAnswer(function (localDescription) {
                    signalingChannel.sendLocalDescription(callId, localDescription);
                    return peerConnection.setLocalDescription(localDescription);
                }, function () {
                    debug('createAnswer ERROR', arguments);
                });
            }, function() {
                debug('setRemoteDescription ERROR', arguments);
            });
        }
        if (e.sdp.type=='answer') {
            debug('ANSWER');
            //when we got an answer from a remote user
            peerConnection.setRemoteDescription(unsignedRemoteDescription); 
        }
    });

    signalingChannel.addEventListener('candidate', function (e) {
        debug('candidate');
        var iceCandidate = new RTCIceCandidate(e.candidate);
        peerConnection.addIceCandidate(iceCandidate);
    });

    signalingChannel.addEventListener('message', function (e) {
        var message = e.message;
        if (message.availableCallIds != null) {
            var html = "";
            for (var i = 0; i<message.availableCallIds.length; i++) {
                var availableCallId = message.availableCallIds[i];
                if (availableCallId.self) {
                    html += "<li><span data-call-id='"+availableCallId.callId+"'>"+availableCallId.name+"</span></li>"
                } else {
                    html += "<li><a data-call-id='"+availableCallId.callId+"' href='#'>"+availableCallId.name+"</a></li>"
                }
            }
            var callIdList = document.getElementById('call-id-list');
            callIdList.innerHTML = html;
        }
    });

    // remote stream arrives
    peerConnection.addEventListener('addstream', function (e) {
        debug('addstream');
        gotRemoteStream(e.stream);
    });

    // send any ice candidates to the other peer
    peerConnection.addEventListener('icecandidate', function (e) {
        debug('icecandidate');
        signalingChannel.sendIceCandidate(callId, e.candidate);
    });

    var constraints = {
        video: { height: 240, width: 320 },
        audio: true
    };
    navigator.getUserMedia(constraints, gotLocalStream, function(err) {
        debug("getUserMedia error", err);
    });

    var callIdList = document.getElementById('call-id-list');
    callIdList.addEventListener('click', function(e) {
        e.preventDefault();
        if (e.target.nodeName.toLowerCase() == 'a') {
            callId = e.target.dataset.callId;
            // call = offer
            peerConnection.createOffer(function (localDescription) {
                signalingChannel.sendLocalDescription(callId, localDescription);
                return peerConnection.setLocalDescription(localDescription);
            }, function () {
                debug(arguments);
            });
        }
        return false;
    });

    window.stopLocalVideo = function () {
        localStream.getAudioTracks()[0].stop();
        localStream.getVideoTracks()[0].stop();
        localVideo.pause();
        localVideo.src="";
    }

});