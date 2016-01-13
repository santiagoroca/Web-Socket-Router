var app = express();
app.use(bodyParser.json());

var server = app.listen(8080, function () {});

module.exports = server;