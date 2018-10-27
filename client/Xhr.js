function xhr(url, data, callback) {
    if (!window.XMLHttpRequest || !window.JSON) return;
    var request = new XMLHttpRequest();
    request.addEventListener('readystatechange', function () {
        if (request.readyState != 4) {
            // 0   UNSENT  Client has been created. open() not called yet.
            // 1   OPENED  open() has been called.
            // 2   HEADERS_RECEIVED    send() has been called, and headers and status are available.
            // 3   LOADING Downloading; responseText holds partial data.
        } else {
            // 4   DONE    The operation is complete.
            if (request.status == 200) {
                // server MUST return JSON text
                callback(JSON.parse(request.responseText));
            } else {
                console.log(request.status, request);
            }
        }
    });
    request.addEventListener('error', function (e) { 
        // error on network layer
        // denied cross-domain request
        console.log(request.status, request, e);
    });
    request.addEventListener('timeout', function (e) {
        console.log(request.status, request, e);
    });
    request.open('POST', url, true);
    request.setRequestHeader("Content-type", "application/json; charset=utf-8");
    request.timeout = 4000; // Set timeout to 4 seconds (4000 milliseconds)
    request.send(JSON.stringify(data));
    return request;
}