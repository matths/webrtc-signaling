function removeScriptTagWithId(scriptId) {
    var elem = document.getElementById(scriptId);
    if (elem) {
        document.body.removeChild(elem);
    }
}

function jsonp(url, data, callback) {
    // ("X-Window-Name", window.name)
    if (!window.name) {
        window.name = randomId();
    }

    var scriptId = randomId();

    setTimeout(function () {
        removeScriptTagWithId(scriptId)
    }, 4000);

    window['jsonpCallback'+scriptId] = function (json) {
        removeScriptTagWithId(scriptId);
        callback(json);
        window['jsonpCallback'+scriptId] = null;
        delete(window['jsonpCallback'+scriptId]);
    }

    var crushedJson = JSONCrush(JSON.stringify(data));
    var script = document.createElement('script');
    script.id = scriptId;
    script.type = 'text/javascript';
    script.src = url + '?message=' + crushedJson + '&callback=' + 'jsonpCallback' + scriptId;
    document.body.append(script)
}

function randomId() {
    var x = 2147483648;
    return Math.floor(Math.random() * x).toString(36) +
    Math.abs(Math.floor(Math.random() * x) ^ Date.now()).toString(36);
}
