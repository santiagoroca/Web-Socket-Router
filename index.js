module.exports = function (connection, ctx) {
    var events = [];
    var permissions = {};
    var router = this;

    connection.on('message', function (message) {
        if (message.type === 'utf8')
            dispatch(JSON.parse(message.utf8Data));
    });

    connection.on('close', function (data) {
        for (var i = 0; i < events.length; i++)
            if (events [i].n == 'close') events [i].fn (data);
    });

    var dispatch = function (data) {
        var run = [];

        for (var i = 0; i < events.length; i++) {
            if (events [i].n.exec(data.route) && (!data.a || (events [i].a && events [i].a === data.action))) {
                if (events [i].fn instanceof Array) 
                    for (var j = 0; j < events [i].fn.length; j++)
                        run.push(events [i].fn [j].bind (ctx));
                else
                    run.push(events [i].fn.bind (ctx));
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
            router.error (ctx.exceptionHandler.error (e));
        }
    }

    var routify = function (n) {
        return new RegExp('^' + n
            .replace (/\/\*/g, '*')
            .replace (/\*/g, '.*')
            .replace (/\//g, '\\/') + '$', '');
    }

    this.on = function (n, fn) {
        events.push ({n: routify(n), fn: fn});
    }

    this.action = function (n, a, fn) {
        events.push ({n: routify(n), a: a, fn: fn});
    }

    this.delete = function (n, fn) { this.action (n, 'DELETE', fn); }
    this.update = function (n, fn) { this.action (n, 'UPDATE', fn); }
    this.create = function (n, fn) { this.action (n, 'CREATE', fn); }
    this.request = function (n, fn) { this.action (n, 'REQUEST', fn); }
    this.subscribe = function (n, fn) { this.action (n, 'SUBSCRIBE', fn); }

    this.intercept = function (n, fn) {
        events.push ({n: routify(n), fn: fn});
    }

    //On Send Message End
    this.onEnd = function () {}

    //Message Constructor
     function message (route, data) {
        return JSON.stringify ({
            route: route,
            data: data
        });
    }

    //Error Message Constructor
    this.error = function (error) {
        this.send ({ route: '/socket/error', data: error });
    }

    //Send Message to current Client
    this.send = function (data, clb) {
        try {
            connection.send(JSON.stringify(data), this.onEnd);
        } catch (err) {}
    }

    //Returns current connection
    this.getConnection = function () {
        return connection;
    }

    //Due to several version of the router beeing used on different places of the application
    this.version = '1.0.0';
}