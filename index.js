var express = require('express');
var expressStaticGzip = require("express-static-gzip");
var morgan = require('morgan');
var app = express();
var port = process.env.PORT ? process.env.PORT : 5000;

app.use(morgan('dev'));
app.use('/', expressStaticGzip("./app/"))
app.listen(port);

console.log("Server started listening on PORT: " + port);

