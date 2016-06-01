var gzippo = require('gzippo');
var express = require('express');
var morgan = require('morgan');
var app = express();
var port = process.env.PORT ? process.env.PORT : 5000;

app.use(morgan('dev'));
app.use(gzippo.staticGzip(__dirname + "/app" , {
          maxAge: 0,
          clientMaxAge: 0
}));
app.listen(port);

console.log("Server started listening on PORT: " + port);

