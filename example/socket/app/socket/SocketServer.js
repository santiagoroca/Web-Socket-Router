wsServer = new WebSocketServer({
    httpServer: HTTPServer
});

wsServer.on('request', SocketClient);