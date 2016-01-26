module.exports = function (request) {

    this.router = new Router (request.accept(null, request.origin), this);
    this.router.ExceptionHandler = new ExceptionHandler ('US');

    this.router.subscribe ('*', function (data) {
	new this.message ().route ("/custom/route").send ();
    });

    this.router.create ('/ruta/de/sabri', function (data) {
        console.log ('* subscribe filter id = 1');
    }, {
        sabri: true
    });

    new this.router.message().route('/someroute').data({}).action(this.router.action.DELETE).filters({filter: 1}).send();

}
