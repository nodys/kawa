var express    = require('express')
var fs         = require('fs')
var join       = require('path').join
var ejs        = require('ejs')
var rfile      = require('rfile')
var index      = ejs.compile(rfile('./testy.ejs'))
var socketio   = require('socket.io')
var http       = require('http')
var browserify = require('browserify')
var util       = require('util')
var uuid       = require('node-uuid')
var basename   = require('path').basename
var read       = require('fs').readFile
var stream     = require('stream')

var tests      = {};
var app        = express()
var server     = http.createServer(app);
var io         = socketio.listen(server);

exports.app    = app;
exports.server = server;
exports.io     = io;


exports.add = function(filepath, source) {

  function add(filepath, source) {
    tests[filepath] = source;
    io.sockets.emit('reload');
  }


  if(!source) {
    // Source not provided= read it
    read(filepath, function(err, source) {
      if(err) {
        console.error(err);
        return;
      }
      add(filepath, source.toString())
    })
  } else if('string' == typeof(source)) {
    // Source provided, filepath is just an id
    add(filepath, source)
  } else {
    console.error('Warning: Invalid source provided for', filepath)
  }
}

exports.remove = function(id) {
  delete tests[id]
}


// Index
app.get('/', function(req, res) {
  res.type('text/html')
  res.end(index({
    tests: Object.keys(tests)
  }))
})

// Source map support (for stack trace of bundles)
app.get('/browser-source-map-support.js', function(req, res) {
  res.type('text/javascript')
  fs.createReadStream(join(__dirname, '../node_modules/source-map-support/browser-source-map-support.js'))
    .pipe(res);
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
app.get('/tests', function(req, res) {
  res.type('text/javascript')
  res.end(tests[req.query.id] || '');
})

io.sockets.on('connection', function (socket) {

  socket.on('stdout', function(args) {
    var args = args.map(decodeURI);
    console.log(userAgent)
    process.stdout.write(util.format.apply(null, args))
  })

  socket.on('stderr', function(args) {
    var args = args.map(decodeURI);
    process.stderr.write(util.format.apply(null, args))
  })

  socket.on('end', function(err) {
    console.log('Exit')
  })

  socket.emit('whoareu');

  socket.on('whoiam', function(_userAgent) {
    userAgent = _userAgent;
    socket.emit('launch', {
      reporter: 'spec'
    });

  })

})



