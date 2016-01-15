var app = express();
app.use(bodyParser.json());

var server = app.listen(9090, function () {});

module.exports = server;
