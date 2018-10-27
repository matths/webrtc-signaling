# webrtc-signaling

a simple signaling server and client to run webrtc one2one video chat between recent chrome (also android chrome) browsers

basic usage:

1. clone directory, install dependencies

```shell
git clone https://github.com/matths/webrtc-signaling.git
npm install
```

2. create a self-signed certificate (MAC and Linux only)

```shell
npm run create-ssl
```

3. run signaling server

```shell
npm start
```

4. open client in your browser

```shell
npm open-client
```

4. open client in a browser on another device in the same (W)LAN

https://[ip of your server]:8000/
