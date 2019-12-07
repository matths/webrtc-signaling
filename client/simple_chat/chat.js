
const nickname = document.getElementById('nickname');
const message = document.getElementById('message');
const messages = document.getElementById('messages');
const sendBtn = document.getElementById('send');

function sendMessage () {
    if (!message.value) return;
    channel.send({
        type: 'chat',
        nickname: nickname.value?nickname.value:'anonymous',
        message: message.value
    });
};

sendBtn.addEventListener('click', sendMessage);
message.addEventListener('keyup', function (e) {
    if (e.keyCode === 13) {
        sendMessage();
    }
});

function channelOpened (channel) {
    channel.addEventListener('message', function (e) {
        var div = document.createElement('div');
        div.innerHTML = '<span class="nickname">'+e.message.nickname+':</span> <span class="message">'+e.message.message+'</span>';
        messages.insertBefore(div, messages.firstChild);

        while (messages.children.length > 20) {
            messages.lastElementChild.remove();
        }
    });
};

var host = window.location.host;
//var channel = new XhrChannel(host, channelOpened);
var channel = new WsChannel(host, channelOpened);
