module.exports = function (connection, ctx) {
    var events = [];
    var router = this;

    this.action = {
        UPDATE: 'UPDATE',
        DELETE: 'DELETE',
        CREATE: 'CREATE',
        SUBSCRIBE: 'SUBSCRIBE',
        REQUEST: 'REQUEST'
    }

    this.ExceptionHandler = function () {
        return {
            'message': 'NO HANDLER ASOCIATED'
        }
    }

    this.LOG = function () {}

    if (connection.on)
        connection.on('message', function (message) {
            if (message.type === 'utf8')
                dispatch(JSON.parse(message.utf8Data));
        });
    else
        connection.onmessage = function (message) {
            dispatch(JSON.parse(message.data));
        }

    if (connection.on)
        connection.on('close', function (data) {
            for (var i = 0; i < events.length; i++)
                if (events [i].n == 'close') events [i].fn (data);
        });
    else
        connection.onclose = function (data) {
            for (var i = 0; i < events.length; i++)
                if (events [i].n == 'close') events [i].fn (data);
        }

    var applyFilters = function (dataFilters, eventFilters) {
        var isFilterMatching = true;

        Object.keys(dataFilters).forEach(function(key) {
            if (dataFilters [key] != eventFilters [key]) isFilterMatching = false;
        });

        return isFilterMatching;
    }

    var shouldEventExecute = function (data, evt) {
        if (data.action && evt.action != data.action)
            return false;

        if ((data.filters && !evt.filters) || (!data.filters && evt.filters) || (data.filters && !applyFilters (data.filters, evt.filters)))
            return false;

        return evt.n.exec(data.route);
    }

    var applyToQueue = function (evt, run) {
        if (evt.fn instanceof Array)
            for (var j = 0; j < evt.fn.length; j++)
                run.push(evt.fn [j].bind (ctx));
        else
            run.push(evt.fn.bind (ctx));
    }

    var dispatch = function (data) {
        var run = [];

        for (var i = 0; i < events.length; i++) {
            if (shouldEventExecute (data, events [i])) {
                applyToQueue(events [i], run);
            }
        }

        runner (run, data.data);
    }

    var runner = function (run, data) {
        try {
            for (var i = 0; i < run.length; i++) {
                run [i] (data);
            }
        } catch (e) {
            error (router.ExceptionHandler (e));
        }
    }

    var routify = function (n) {
        return new RegExp('^' + n
                .replace (/\/\*/g, '*')
                .replace (/\*/g, '.*')
                .replace (/\//g, '\\/') + '$', '');
    }

    this.on = function (n, fn) {
        var event = {n: routify(n), fn: fn};

        events.push (event);

        return new function () {
            this.action = function (ACTION) {
                if (ACTION)
                    events [events.indexOf(event)].action = ACTION;

                return this;
            }

            this.filters = function (filters) {
                if (filters)
                    events [events.indexOf(event)].filters = filters;

                return this;
            }
        }
    }

    this.delete = function (n, fn, filters) { this.on (n, fn).action (this.action.DELETE).filters (filters); }
    this.update = function (n, fn, filters) { this.on (n, fn).action (this.action.UPDATE).filters (filters); }
    this.create = function (n, fn, filters) { this.on (n, fn).action (this.action.CREATE).filters (filters); }
    this.request = function (n, fn, filters) { this.on (n, fn).action (this.action.REQUEST).filters (filters); }
    this.subscribe = function (n, fn, filters) { this.on (n, fn).action (this.action.SUBSCRIBE).filters (filters); }

    this.intercept = function (n, fn) {
        events.push ({n: routify(n), fn: fn});
    }

    //On Send Message End
    var onEnd = function (err) {}

    //Message Constructor
    function message (route, data) {
        return JSON.stringify ({
            route: route,
            data: data
        });
    }

    //Error Message Constructor
    var error = function (error) {
        send ({ route: '/socket/error', data: error });
    }

    var send = function (message) {
        try {
            connection.send(JSON.stringify(message), onEnd);
        } catch (err) {
            this.LOG (err);
        }
    }

    this.message = function () {
        var message = {};

        this.route = function (route) {
            message.route = route;

            return this;
        }

        this.action = function (action) {
            message.action = action;

            return this;
        }

        this.data = function (data) {
            message.data = data;

            return this;
        }

        this.filters = function (filters) {
            message.filters = filters;

            return this;
        }

        this.send = function () {
            send (message);
        }
    }

    //Send Message to current Client
    this.send = function (message) {
        send (message);
    }

    //Returns current connection
    this.getConnection = function () {
        return connection;
    }

    //Due to several version of the router beeing used on different places of the application
    this.version = '1.1.1';
}