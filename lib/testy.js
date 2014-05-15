var basename   = require('path').basename
var browserify = require('browserify')
var ejs        = require('ejs')
var es         = require('event-stream')
var express    = require('express')
var fs         = require('fs')
var http       = require('http')
var index      = ejs.compile(require('rfile')('./testy.ejs'))
var join       = require('path').join
var read       = require('fs').readFile
var socketio   = require('socket.io')
var stream     = require('stream')
var util       = require('util')
var uuid       = require('node-uuid')
var events     = require('events')
var concat   = require('concat-stream')



module.exports = function (options, callback) {

  // Read arguments
  if('function' == typeof(options)) {
    callback  = options;
    options   = {};
  } else {
    options   = options || {};  }

  var testy      = {};
  events.EventEmitter.call(testy);

  var tests      = {};
  var app        = testy.app    = express()
  var server     = testy.server = http.createServer(app);
  var io         = testy.io     = socketio.listen(server);


  var PORT       = options.port     || 3042;
  var HOST       = options.host     || '0.0.0.0';
  var REPORTER   = options.reporter || 'html';
  var UI         = options.ui       || 'bdd';



  testy.listen = function() {
    server.listen.apply(server, arguments);
    return testy;
  }

  if(callback) {
    testy.listen(PORT, HOST, callback)
  }

  testy.reporter = function(reporter) {
    if(!reporter) {
      return REPORTER;
    }
    REPORTER = reporter;
    return testy;
  }

  testy.ui = function(ui) {
    if(!ui) {
      return UI;
    }
    UI = ui;
    return testy;
  }

  testy.use = function() {
    app.use.apply(app, arguments);
    return testy;
  }



  testy.add = function(filepath, source) {

    function add(filepath, source) {
      tests[filepath] = source;
      io.sockets.emit('__testy__reload');
    }

    if(filepath.pipe) {
      source   = filepath;
      filepath = uuid.v4() + '.js'
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
    } else if(source.pipe) {
      // Source provided as stream, filepath is just an id
      source.pipe(concat(function(data) {
        add(filepath, data.toString())
      }))
    } else {
      console.error('Warning: Invalid source provided for', filepath)
    }

    return testy;
  }

  testy.remove = function(id) {
    delete tests[id]
    io.sockets.emit('__testy__reload');
    return testy;
  }


  // Index
  app.get('/', function(req, res) {
    res.type('text/html')
    res.end(index({
      tests: Object.keys(tests)
    }))
  })

  // Source map support (for stack trace of bundles)
  app.get('/__testy__/browser-source-map-support.js', function(req, res) {
    res.type('text/javascript')
    fs.createReadStream(join(__dirname, '../node_modules/source-map-support/browser-source-map-support.js'))
      .pipe(res);
  })

  // Mocha
  app.get('/__testy__/mocha.js', function(req, res) {
    res.type('text/javascript')
    fs.createReadStream(join(__dirname, '../node_modules/mocha/mocha.js'))
      .pipe(res);
  })

  app.get('/__testy__/mocha.css', function(req, res) {
    res.type('text/css')
    fs.createReadStream(join(__dirname, '../node_modules/mocha/mocha.css'))
      .pipe(res);
  })


  app.get('/__testy__/client.js', function(req, res) {
    res.type('text/javascript')
    fs.createReadStream(join(__dirname, './client.js'))
      .pipe(es.map(function(data,done) {
        done(null, data.toString().replace(/\{\{UI\}\}/g,UI))
      }))
      .pipe(res);
  })


  // Tests
  app.get('/__testy__/tests', function(req, res) {
    res.type('text/javascript')
    res.end(tests[req.query.id] || '');
  })

  io.sockets.on('connection', function (socket) {
    console.log('Connect');
    socket.on('__testy__stdout', function(args) {
      var args = args.map(decodeURI);
      process.stdout.write(util.format.apply(null, args))
    })

    socket.on('__testy__stderr', function(args) {
      var args = args.map(decodeURI);
      process.stderr.write(util.format.apply(null, args))
    })

    socket.on('__testy__end', function(err) {
      console.log('Exit')
    })


    socket.on('__testy__whoiam', function(_userAgent) {
      console.log('__testy__whoiam', _userAgent);
      userAgent = _userAgent;
      socket.emit('__testy__launch', {
        reporter: REPORTER
      });
    })
    socket.emit('__testy__whoareu');

  })


  return testy;
}







