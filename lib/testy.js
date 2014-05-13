var express = require('express')
var fs      = require('fs')
var join    = require('path').join
var ejs     = require('ejs')
var rfile   = require('rfile')
var index   = ejs.compile(rfile('./testy.ejs'))
var socketio= require('socket.io')
var http    = require('http')


var tests   = {};
var app     = express()
var server  = http.createServer(app);
var io      = socketio.listen(server);

// Index
app.get('/', function(req, res) {
  res.type('text/html')
  res.end(index({
    tests: Object.keys(tests)
  }))
})

// Mocha
app.get('/mocha.js', function(req, res) {
  res.type('text/javascript')
  fs.createReadStream(join(__dirname, '../node_modules/mocha/mocha.js'))
    .pipe(res);
})

app.get('/mocha.css', function(req, res) {
  res.type('text/css')
  fs.createReadStream(join(__dirname, '../node_modules/mocha/mocha.css'))
    .pipe(res);
})


// Tests
app.get('/tests/:id', function(req, res) {
  res.type('text/javascript')
  res.end(tests[req.params.id])
})


io.sockets.on('connection', function (socket) {
  console.log('New socket.io connection');
  socket.on('log', function(args) {
    // console.log('Log on client:', args)
    console.log.apply(null, args);
  })
})


exports.listen = function(port) {
  server.listen(port || 3042, function(err) {
    // Send a reload
    setTimeout(function() {
      io.sockets.emit('reload');
    },500);
  })
}


exports.add = function(id, src) {
  tests[id] = src;
  io.sockets.emit('reload');
}

exports.remove = function(id) {
  delete tests[id]
}



