# *Web Socket Router*

Overview
--------
This is implementation of websocket to provide a clear way to connecto to and from a websocket server. Providing tools such, methods, routes, and filters.



* Creating a new instance of the Web Socket Router

By creating a new instance of the web socket router and passing to the constructor the built-in-web-socket-instance, you are able to start subscribing and sending messages.

```javascript
var webSocketRouterInstance = new WebSocketRouter(new WebSocket('ws://domain:port')[, context]);
```



* Sending messages

Using the message object's builder, you cand send messages to/from the server.

```javascript
new webSocketRouterInstance.message().route('/artist').action(webSocketRouterInstance.action.CREATE).data({
	id: 0,
	name: 'Pearl Jam'
}).send();
```



* Listening to messages

This way you can define a listener for the route '/artist' with action CREATE.

```javascript
webSocketRouterInstance.create('/artist', function (artist) {
	//Save Artist Data
});
```


* Routes Interceptors

You can also intercept messages to do error checking.

```javascript
webSocketRouterInstance.intercetp('*', function (artist) {
	if (!artits.id) {
    	throw ('No artist id defined.')
    }
});
```

* Defining filters

This way you can define a listener for the route '/artist' with action CREATE filtering by the name Pearl Jam. Filters will apply to any first-child key of the data object. 

```javascript
webSocketRouterInstance.create('/artist', function (artist) {
	//Save Artist Data
}).filter ({
	name: 'Pearl Jam'
});
```

* Pre and post message Events
This Way you can define an event before sending any route containing '/artist'.

```javascript
webSocketRouterInstance.beforeSend('/artist', function (artist) {
	artist.name = artist.name.replace (/ /g, '_');
});
```

And post send events.

```javascript
webSocketRouterInstance.afterSend('/artist', function (artist) {
	delete ArtistTempData[artist.name];
});
```

* Binding a different context for the listener.
Even when you can defined a default context on the Web Socket Constructor, you can also define a custom execution context for the function.

```javascript
webSocketRouterInstance.on('/artist/create', artistController.create).bind(artistController);
```


## *The message-builder object.*

Empty message
```javascript
new webSocketRouterInstance.message().send();
```

Empty data to artist on default Action
```javascript
new webSocketRouterInstance.message().route('/artist').send();
```

Custom data to artist with DELETE action
```javascript
new webSocketRouterInstance.message().route('/artist').data({
	id: 1
}).action(webSocketRouterInstance.action.DELETE).send();
```


Custom data to artist with custom action
```javascript
new webSocketRouterInstance.message().route('/artist').data({
	id: 1
}).action('myCustomActionName').send();
```


## *Listener Object*

* The message-builder object.

Empty data to artist on default Action - Listener
```javascript
webSocketRouterInstance.on('/artist', artistController.list);
```

Custom data to artist with DELETE action - Listener (Delete action its predefined and has a .delete method).
```javascript
webSocketRouterInstance.delete('/artist', artistController.delete);
```


Custom data to artist with custom action - Listener (Custom actions needs to use the .on method and specify the action name).
```javascript
webSocketRouterInstance.delete('/artist', artistController.delete).action('myCustomAction');
```
