const channel = document.getElementById('channel');
const nickname = document.getElementById('nickname');
const message = document.getElementById('message');
const messages = document.getElementById('messages');
const startBtn = document.getElementById('start');
const sendBtn = document.getElementById('send');

var signaling;

function sendMessage () {
    var msg = message.value;
    if (!msg) return;

    signaling.send({
        type: 'chat',
        nickname: nickname.value?nickname.value:'anonymous',
        message: msg
    });

    message.value = '';
};

function start () {
    var type = channel.selectedOptions[0].value;
    var host = window.location.host;
    signaling = SignalingChannel.getChannel(host, type, channelOpened);
    channel.disabled = true;
    nickname.disabled = true;
    startBtn.disabled = true;
    message.disabled = false;
    sendBtn.disabled = false;
}

startBtn.addEventListener('click', start);

sendBtn.addEventListener('click', sendMessage);
message.addEventListener('keyup', function (e) {
    if (e.keyCode === 13) {
        sendMessage();
    }
});

function channelOpened (signaling) {
    signaling.addEventListener('message', function (e) {
        var div = document.createElement('div');
        div.innerHTML = '<span class="nickname">'+e.message.nickname+':</span> <span class="message">'+e.message.message+'</span>';
        // messages.insertBefore(div, messages.firstChild);
        messages.append(div);
        messages.scrollTop = messages.scrollHeight - messages.clientHeight;

        while (messages.children.length > 20) {
            // messages.lastElementChild.remove();
            messages.firstElementChild.remove();
        }
    });
};
