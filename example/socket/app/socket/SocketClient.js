module.exports = function (request) {

    this.router = new Router (request.accept(null, request.origin), this);
    this.router.ExceptionHandler = new ExceptionHandler ('US');

    this.router.subscribe ('*', function (data) {
        console.log ('* subscribe');
    });

    this.router.create ('/ruta/de/sabri', function (data) {
        console.log ('* subscribe filter id = 1');
    }, {
        sabri: true
    });

    new this.router.message().route('/deleteroute').data({message: 'hola'}).action(this.router.action.DELETE).filters({id: 1}).send();

}