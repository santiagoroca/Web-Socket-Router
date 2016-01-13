var LOG = new function () {

    var debug = Config.DEBUG;

    var format = function (msg) {
        return new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString() + msg + '\n';
    }

    this.log = function (msg) {
        if (!debug) return;

        fs.writeFile(CONSTANTS.CONFIG.LOGFILE, format (msg), {flag: 'a'}, function (err) {
            if (err)
                this.error (err);
        });
    }

    this.error = function (err) {
        fs.writeFile(CONSTANTS.CONFIG.ERRORFILE, format (err), {flag: 'a'}, function (err) {});
    }

}

module.exports = LOG;