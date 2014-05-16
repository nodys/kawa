var basename   = require('path').basename
var browserify = require('browserify')
var concat     = require('concat-stream')
var ejs        = require('ejs')
var es         = require('event-stream')
var events     = require('events')
var express    = require('express')
var fs         = require('fs')
var http       = require('http')
var index      = ejs.compile(require('rfile')('./testy.ejs'))
var join       = require('path').join
var phantom    = require('phantom')
var read       = require('fs').readFile
var socketio   = require('socket.io')
var stream     = require('stream')
var util       = require('util')
var uuid       = require('node-uuid')


module.exports = function (options) {

  function Testy() {
    events.EventEmitter.call(this);
  }
  util.inherits(Testy, events.EventEmitter);
  var testy       = new Testy;

  var htmlHeaders = {
    scripts : {},
    styles  : {},
    tests   : {}
  }

  // Read arguments
  options   = options || {};

  var app        = testy.app    = express()
  var server     = testy.server = http.createServer(app);
  var io         = testy.io     = socketio.listen(server);
  var ioTesty    = testy.io; //testy.io.of('/testy')

  // Can use clean namespace yet
  // http://stackoverflow.com/questions/15725236/phantomjs-socket-io-and-gevent-socketio-making-it-work
  // var ioTesty    = testy.io.of('/testy')

  // Which reporter must be used
  //(http://visionmedia.github.io/mocha/#reporters)
  var REPORTER   = options.reporter   || 'html';

  // Which  interface must be used
  // (see http://visionmedia.github.io/mocha/#interfaces)
  var UI         = options.ui         || 'bdd';

  // Print out stdout / stderr?
  var SILENT     = options.silent     || false;

  // Start a phantomjs client
  var PHANTOM    = options.usePhantom || false;

  // Run only once and exit with the resulting code
  var ONCE       = options.runOnce    || false;


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


  testy.silent = function(silent) {
    if(!silent) {
      return SILENT;
    }
    SILENT = silent;
    return testy;
  }


  testy.usePhantom = function() {
    PHANTOM = true;
    return testy;
  }


  testy.runOnce = function() {
    ONCE = true;
    return testy;
  }


  testy.listen = function() {
    server.listen.apply(server, arguments);
    return testy;
  }


  testy.use = function() {
    app.use.apply(app, arguments);
    return testy;
  }


  function addHtmlHeader(type, filepath, sourceOrOptions) {

    function add(filepath, source) {
      htmlHeaders[type][filepath] = source;
      ioTesty.emit('__testy__reload');
    }

    // Normalize arguments
    if('object' == typeof(filepath)) {
      sourceOrOptions = filepath;
      filepath = sourceOrOptions.filepath || uuid.v4() + '.js';
    }

    // If the source is a stream, we cache it
    if(sourceOrOptions && sourceOrOptions.pipe) {
      sourceOrOptions.pipe(concat(function(data) {
        add(filepath, data.toString())
      }))
      return testy;
    }

    // If the source look-like a browserify/watchify bundler
    // we use it as a ressource updater
    if(sourceOrOptions
      && sourceOrOptions.constructor
      && sourceOrOptions.constructor.name == 'Browserify'
      && sourceOrOptions.bundle) {
      function update() {
        sourceOrOptions.bundle({})
          .pipe(concat(function(data) {
            add(filepath, data.toString())
          }))
      }
      sourceOrOptions.on('update', update); // Watchify only
      update(); // Update once
      return testy;
    }

    // If the source is a string
    if(sourceOrOptions && ('string' == typeof(sourceOrOptions))) {
      add(filepath, sourceOrOptions)
      return testy;
    }


    // Source not provided= read it
    read(filepath, function(err, source) {
      if(err) {
        console.error(err);
        return;
      }
      add(filepath, source.toString())
    })
    return testy;

  }

  testy.addScript = function(filepath, sourceOrOptions) {
    addHtmlHeader('scripts', filepath, sourceOrOptions)
    return this;
  }

  testy.addCss = function(filepath, sourceOrOptions) {
    addHtmlHeader('styles', filepath, sourceOrOptions)
    return this;
  }

  testy.addTest = function(filepath, sourceOrOptions) {
    addHtmlHeader('tests', filepath, sourceOrOptions)
    return this;
  }

  if(options.scripts) {
    options.scripts.forEach()
  }


  testy.remove = function(id) {
    delete tests[id]
    ioTesty.emit('__testy__reload');
    return testy;
  }

  // Index
  app.get('/', function(req, res) {
    res.type('text/html')
    res.end(index({
      tests:   Object.keys(htmlHeaders.tests),
      styles:  Object.keys(htmlHeaders.styles),
      scripts: Object.keys(htmlHeaders.scripts)
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


  app.get('/__testy__/test', function(req, res) {
    res.type('text/javascript')
    res.end(htmlHeaders.tests[req.query.id] || '');
  })

  app.get('/__testy__/script', function(req, res) {
    res.type('text/javascript')
    res.end(htmlHeaders.scripts[req.query.id] || '');
  })

  app.get('/__testy__/style', function(req, res) {
    res.type('text/css')
    res.end(htmlHeaders.styles[req.query.id] || '');
  })

  ioTesty.on('connection', function (socket) {
    var client;

    testy.emit('connection', socket);

    socket.on('__testy__stdout', function(args) {
      var args   = args.map(decodeURI);
      var output = util.format.apply(null, args);
      testy.emit('stdout', output, client)
      SILENT || process.stdout.write(output)
    })

    socket.on('__testy__stderr', function(args) {
      var args   = args.map(decodeURI);
      var output = util.format.apply(null, args);
      testy.emit('stderr', output, client)
      SILENT || process.stderr.write(output)
    })

    socket.on('__testy__end', function(code) {
      client.exitCode = code;
      testy.emit('end', client);
      if(ONCE) {
        process.exit(code);
      }
    })

    setTimeout(function() {
      socket.emit('__testy__ready', function(isReady, _client) {
        if(!isReady) return;

        client          = _client;
        client.reporter = REPORTER;

        testy.emit('start', client)
        socket.emit('__testy__start', {
          reporter: client.reporter
        })
      });
    },100);
  })

  function startPhantom(port) {
    phantom.create(function (ph) {
      ph.createPage(function(page) {
        page.open('http://localhost:'+port+'/', function(status) {})
      })
    })
  }


  // Listen for server listening
  testy.server.on('listening', function() {
    var port = testy.server.address().port;

    console.log('Testy is ready: http://localhost:%s/', port);

    if(PHANTOM) {
      startPhantom(port)
    }


  })


  return testy;
}





