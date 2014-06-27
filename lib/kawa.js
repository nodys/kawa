var basename   = require('path').basename
var dirname    = require('path').dirname
var concat     = require('concat-stream')
var ejs        = require('ejs')
var es         = require('event-stream')
var events     = require('events')
var express    = require('express')
var fs         = require('fs')
var http       = require('http')
var index      = ejs.compile(require('rfile')('./kawa.ejs'))
var join       = require('path').join
var phantom    = require('phantom')
var read       = require('fs').readFile
var socketio   = require('socket.io')
var stream     = require('stream')
var util       = require('util')
var uuid       = require('node-uuid')


module.exports = function (options) {

  function Kawa() {
    events.EventEmitter.call(this);
  }
  util.inherits(Kawa, events.EventEmitter);
  var kawa       = new Kawa;

  var htmlHeaders = {
    scripts : {},
    styles  : {},
    tests   : {}
  }

  // Read arguments
  options   = options || {};

  var app        = kawa.app    = express()
  var server     = kawa.server = http.createServer(app);
  var io         = kawa.io     = socketio.listen(server);
  var ioKawa     = kawa.io; //kawa.io.of('/kawa')

  // Can use clean namespace yet
  // http://stackoverflow.com/questions/15725236/phantomjs-socket-io-and-gevent-socketio-making-it-work
  // var ioKawa    = kawa.io.of('/kawa')

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


  kawa.reporter = function(reporter) {
    if(!reporter) {
      return REPORTER;
    }
    REPORTER = reporter;
    return kawa;
  }

  kawa.ui = function(ui) {
    if(!ui) {
      return UI;
    }
    UI = ui;
    return kawa;
  }


  kawa.silent = function(silent) {
    if(!silent) {
      return SILENT;
    }
    SILENT = silent;
    return kawa;
  }


  kawa.usePhantom = function() {
    PHANTOM = true;
    return kawa;
  }


  kawa.runOnce = function() {
    ONCE = true;
    return kawa;
  }


  kawa.listen = function() {
    server.listen.apply(server, arguments);
    return kawa;
  }


  kawa.use = function() {
    app.use.apply(app, arguments);
    return kawa;
  }


  function addHtmlHeader(type, filepath, sourceOrOptions) {

    function add(filepath, source) {
      htmlHeaders[type][filepath] = source;
      ioKawa.emit('__kawa__reload');
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
      return kawa;
    }

    // If the source look-like a browserify/watchify bundler
    // we use it as a ressource updater
    if(sourceOrOptions
      && sourceOrOptions.constructor
      && sourceOrOptions.constructor.name == 'Browserify'
      && sourceOrOptions.bundle) {
      function update() {
        sourceOrOptions.bundle({debug:true})
          .pipe(concat(function(data) {
            add(filepath, data.toString())
          }))
      }
      sourceOrOptions.on('update', update); // Watchify only
      update(); // Update once
      return kawa;
    }

    // If the source is a string
    if(sourceOrOptions && ('string' == typeof(sourceOrOptions))) {
      add(filepath, sourceOrOptions)
      return kawa;
    }


    // Source not provided= read it
    read(filepath, function(err, source) {
      if(err) {
        console.error(err);
        return;
      }
      add(filepath, source.toString())
    })
    return kawa;

  }

  kawa.addScript = function(filepath, sourceOrOptions) {
    addHtmlHeader('scripts', filepath, sourceOrOptions)
    return this;
  }

  kawa.addCss = function(filepath, sourceOrOptions) {
    addHtmlHeader('styles', filepath, sourceOrOptions)
    return this;
  }

  kawa.addTest = function(filepath, sourceOrOptions) {
    addHtmlHeader('tests', filepath, sourceOrOptions)
    return this;
  }

  if(options.scripts) {
    options.scripts.forEach()
  }


  kawa.remove = function(id) {
    delete tests[id]
    ioKawa.emit('__kawa__reload');
    return kawa;
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
  app.get('/__kawa__/browser-source-map-support.js', function(req, res) {
    res.type('text/javascript')
    fs.createReadStream(join(dirname(require.resolve('source-map-support')), 'browser-source-map-support.js'))
      .pipe(res);
  })

  // Mocha
  app.get('/__kawa__/mocha.js', function(req, res) {
    res.type('text/javascript')
    fs.createReadStream(join(dirname(require.resolve('mocha')), 'mocha.js'))
      .pipe(res);
  })

  app.get('/__kawa__/mocha.css', function(req, res) {
    res.type('text/css')
    fs.createReadStream(join(dirname(require.resolve('mocha')), 'mocha.css'))
      .pipe(res);
  })


  app.get('/__kawa__/client.js', function(req, res) {
    res.type('text/javascript')
    fs.createReadStream(join(__dirname, './client.js'))
      .pipe(es.map(function(data,done) {
        done(null, data.toString().replace(/\{\{UI\}\}/g,UI))
      }))
      .pipe(res);
  })


  app.get('/__kawa__/test', function(req, res) {
    res.type('text/javascript')
    res.end(htmlHeaders.tests[req.query.id] || '');
  })

  app.get('/__kawa__/script', function(req, res) {
    res.type('text/javascript')
    res.end(htmlHeaders.scripts[req.query.id] || '');
  })

  app.get('/__kawa__/style', function(req, res) {
    res.type('text/css')
    res.end(htmlHeaders.styles[req.query.id] || '');
  })

  ioKawa.on('connection', function (socket) {
    var client;

    kawa.emit('connection', socket);

    socket.on('__kawa__stdout', function(args) {
      var args   = args.map(decodeURI);
      var output = util.format.apply(null, args);
      kawa.emit('stdout', output, client)
      SILENT || process.stdout.write(output)
    })

    socket.on('__kawa__stderr', function(args) {
      var args   = args.map(decodeURI);
      var output = util.format.apply(null, args);
      kawa.emit('stderr', output, client)
      SILENT || process.stderr.write(output)
    })

    socket.on('__kawa__end', function(code) {
      client.exitCode = code;
      kawa.emit('end', client);
      if(ONCE) {
        process.exit(code);
      }
    })

    setTimeout(function() {
      socket.emit('__kawa__ready', function(isReady, _client) {
        if(!isReady) return;

        client          = _client;
        client.reporter = REPORTER;

        kawa.emit('start', client)
        socket.emit('__kawa__start', {
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
  kawa.server.on('listening', function() {
    var port = kawa.server.address().port;

    console.log('Kawa wait for client on: http://localhost:%s/', port);

    if(PHANTOM) {
      startPhantom(port)
    }


  })


  return kawa;
}
