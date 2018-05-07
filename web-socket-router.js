/*
* Router Receives a connection String
*
* it will perform the conneciton to the server. Anytime the connection si closed
* it will try to reconnect. Until it fails several times.
*
*/
var WebSocketRouter = function (connection_query, ctx) {

  //
  var BEFORE = 'BEFORE';

  //
  var AFTER = 'AFTER;'




  /*
  *
  *
  *
  *
  */
  function ConnectionHandler (connection_query, on_message) {

      // Connection query could be used to re-establish
      // The connection in case is lots
      this.connection_query = connection_query;

      // Connection on message will be used to dispatch
      // Messages
      this.on_message = on_message;

      // Holds any message dispatched before the connection
      // was established
      // Also, if the connection is closed, the WS, will Hold
      // the message and try to reconnect to send it
      this.messageQueue = [];

      // Connection retry will hold the attempts
      // Before giviging up 10 retries
      this.connectionsAttemp = 0;

      // Attemp to connect for the first time
      this.connect();

  }


  /*
  *
  */
  ConnectionHandler.prototype.connect = function () {

    // Increase the attemp count by one to let know
    // That a connection has been alread tried
    this.connectionsAttemp++;

    // The connection is established using WebSocket
    // If the connection is closed, the Handler will try
    // To reconnect
    this.connection = new WebSocket(this.connection_query);

    // Whenever the new connection is open, the connection
    // Handler will flush the messageQueue
    this.connection.onopen = this.flush.bind(this);

    // Whenever the connection is closed, the WS
    // Will try to reconnect up to 10 times.
    this.connection.onclose = this.reconnect.bind(this);

    // Connection on-message will dispatch all received
    // Messages to the wrapper class. Messages will be dispatched
    // Already parsed
    this.connection.onmessage = this.dispatch.bind(this);

  }


  /*
  *
  */
  ConnectionHandler.prototype.dispatch = function (message) {
      this.on_message(JSON.parse(message.data));
  }


  /*
  *
  */
  ConnectionHandler.prototype.reconnect = function () {
    if (this.connectionsAttemp < 10) {
      this.connect();
    } else {
      console.log(`10 Attemps to connect failed to the server ${this.connection_query}. Is server up?`);
    }
  }


  /*
  *
  */
  ConnectionHandler.prototype.flush = function () {

    // Reset the connections attempt since the connection,
    // Has been stablished sucesfully
    this.connectionsAttemp = 0;

    // Execute all queued messages
    for (let message of this.messageQueue) {
        this.send(message);
    }

    // Empty the message Queue could provoke an issue when The
    // messages beeing flushed are producing erros that push them back
    // To the queue. Messages could be lost
    this.messageQueue = [];

  }


  /*
  *
  */
  ConnectionHandler.prototype.send = function (message) {
    try {
        this.connection.send(JSON.stringify(message));
    } catch (err) { console.log(err); }
  }


  /*
  *
  */
  ConnectionHandler.prototype.send = function (message) {
    try {
        this.connection.send(JSON.stringify(message));
    } catch (err) {
        this.messageQueue.push(message);
    }
  }


  /*
  *
  */
  Router.prototype.close = function () {
      this.messageQueue = [];

      if (this.connection.readyState == 1) {
          this.connection.close();
      } else {
          this.connection.onopen = function () {
              this.connection.close ();
          }
      }
  }




  /*
  *
  *
  *
  *
  */
  function Router (connection_query, ctx) {

    this.action = {
        UPDATE: 'UPDATE',
        DELETE: 'DELETE',
        CREATE: 'CREATE',
        SUBSCRIBE: 'SUBSCRIBE',
        REQUEST: 'REQUEST'
    }

    //Due to several version of the router beeing used on different places of the application
    this.version = '1.3.2';

    //
    this.events = [];

    //
    this.lastEvents = [];

    //
    this.registeredTasks = [];

    // Will manage all connection-related aspects
    // Of the WebSocket
    this.connection = new ConnectionHandler(connection_query, this.dispatch.bind(this));

  }


  /*
  *
  */
  Router.prototype.send = function (message) {
    try {
        this.executeTaks(message, BEFORE);
        this.connection.send(message);
        this.executeTaks(message, AFTER);
    } catch (err) { console.log(err); }
  }


  /*
  *
  */
  Router.prototype.ExceptionHandler = function () {
    return {
        'message': 'NO HANDLER ASOCIATED'
    }
  }


  /*
  *
  */
  Router.prototype.LOG = function () { }


  /*
  *
  */
  Router.prototype.on = function (n, fn) {
      var event = {n: this.routify(n), fn: fn, action: "*"};
      this.events.push (event);

      return new function () {
          this.action = function (ACTION) {
              if (ACTION)
                  event.action = ACTION;

              return this;
          }

          this.filters = function (filters) {
              if (filters)
                  event.filters = filters;

              return this;
          }

          this.bind = function (bind) {
              if (bind)
                  event.bind = bind;

              return this;
          }

          this.executeLast = function () {
              lastEvents.push(events [events.indexOf(event)]);
              delete events [events.indexOf(event)];
              events.length = events.length - 1;
          }
      }
  }


  /*
  *
  */
  Router.prototype.delete = function (n, fn, filters) {
      return this.on (n, fn).action (this.action.DELETE).filters (filters);
  }


  /*
  *
  */
  Router.prototype.update = function (n, fn, filters) {
      return this.on (n, fn).action (this.action.UPDATE).filters (filters);
  }


  /*
  *
  */
  Router.prototype.create = function (n, fn, filters) {
      return this.on (n, fn).action (this.action.CREATE).filters (filters);
  }


  /*
  *
  */
  Router.prototype.request = function (n, fn, filters) {
      return this.on (n, fn).action (this.action.REQUEST).filters (filters);
  }


  /*
  *
  */
  Router.prototype.subscribe = function (n, fn, filters) {
    return this.on (n, fn).action (this.action.SUBSCRIBE).filters (filters);
  }


  /*
  *
  */
  Router.prototype.intercept = function (n, fn) {
      this.events.push ({n: this.routify(n), fn: fn});
  }


  /*
  *
  */
  Router.prototype.beforeSend = function (route, fn) {
      this.registerSendTask (route, fn, BEFORE);
  };


  /*
  *
  */
  Router.prototype.afterSend = function (route, fn) {
      this.registerSendTask (route, fn, AFTER);
  };


  /*
  *
  */
  Router.prototype.registerSendTask = function (route, fn, position) {
      this.registeredTasks.push ({
          route: this.routify(route),
          fn: fn,
          position: position
      });
  }


  /*
  *
  */
  Router.prototype.message = function (options) {
      this.send(Object.assign({ route: "*" }, options));
      console.log(Object.assign({ route: "*" }, options));
  }


  /*
  *
  */
  Router.prototype.getConnection = function () {
      return this.connection;
  }


  /*
  *
  */
  Router.prototype.applyFilters = function (dataFilters, eventFilters) {
      var isFilterMatching = true;

      Object.keys(dataFilters).forEach(function(key) {
          if (!this.routify(eventFilters [key].toString ()).exec(dataFilters [key].toString ())) {
              isFilterMatching = false;
          }
      });

      return isFilterMatching;
  }


  /*
  *
  */
  Router.prototype.shouldEventExecute = function (data, evt) {
      if (!this.routify (evt.action).exec(data.action)) {
          return false;
      }

      if ((data.filters && !evt.filters) || (!data.filters && evt.filters) || (data.filters && !applyFilters (data.filters, evt.filters))) {
          return false;
      }

      return evt.n.exec(data.route);
  }


  /*
  *
  */
  Router.prototype.shouldTaskExecute = function (data, task, position) {
      if (position != task.position) {
          return false;
      }

      return task.route.exec(data.route);
  }


  /*
  *
  */
  Router.prototype.applyToQueue = function (evt, run) {
      if (evt.fn instanceof Array) {
          for (var j = 0; j < evt.fn.length; j++) {
              run.push(evt.fn [j].bind (evt.bind ? evt.bind : ctx));
          }
      } else {
          run.push(evt.fn.bind (evt.bind ? evt.bind : ctx));
      }
  }


  /*
  *
  */
  Router.prototype.dispatch = function (data) {
      var run = [];

      //Events
      for (var i = 0; i < this.events.length; i++) {
          if (this.shouldEventExecute (data, this.events [i])) {
              this.applyToQueue(this.events [i], run);
          }
      }

      //Execute Last Events
      for (var i = 0; i < this.lastEvents.length; i++) {
          if (this.shouldEventExecute (data, this.lastEvents [i])) {
              this.applyToQueue(this.lastEvents [i], run);
          }
      }

      this.runner (run, data.data);
  }


  /*
  *
  */
  Router.prototype.runner = function (run, data) {
      try {
          for (var i = 0; i < run.length; i++) {
              run [i] (data);
          }
      } catch (e) {
          this.ExceptionHandler (e);
      }
  }


  /*
  *
  */
  Router.prototype.routify = function (n) {
      return new RegExp('^' + n
              .replace (/\/\*/g, '*')
              .replace (/\*/g, '.*')
              .replace (/\//g, '\\/') + '$', '');
  }


  /*
  *
  */
  Router.prototype.error = function (error) {
      this.send ({ route: '/socket/error', data: error });
  }


  /*
  *
  */
  Router.prototype.executeTaks = function (data, position) {
      for (var i = 0; i < this.registeredTasks.length; i++) {
          if (this.shouldTaskExecute(data, this.registeredTasks [i], position)) {
              this.registeredTasks [i].fn.bind (ctx) (data);
          }
      }
  }

  return new Router(connection_query, ctx);

};
