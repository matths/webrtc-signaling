var signalingChannelOpened = function(signalingChannel) {
};

const nickname = document.getElementById('nickname');
nickname.addEventListener('keyup', function (e) {
    if (e.keyCode === 13) {
        const val = nickname.value;
        if (val!='') {
            signalingChannel.send({'introduction': val});
        }
    }
});

var host = window.location.host;
var type = 'xhr'; // 'ws';
var signalingChannel = SignalingChannel.getChannel(host, type, signalingChannelOpened);

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
