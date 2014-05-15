
;(function() {

  // Set mocha mode
  mocha.setup('bdd')


  function initialize() {

    // PhantomJS doesn't support bind yet
    Function.prototype.bind = Function.prototype.bind || function (thisp) {
      var fn = this;
      return function () {
        return fn.apply(thisp, arguments);
      }
    }

    if (!window.console) {
      window.console = {
        log   : function () { return; },
        info  : function () { return; },
        warn  : function () { return; },
        error : function () { return; }
      };
    }

    if (!window.process) {
      window.process = {
        stdout: {
          write: function () {
            return window.console.log.apply(window.console, arguments);
          }
        },
        stderr: {
          write: function () {
            return window.console.log.apply(window.console, arguments);
          }
        },
      };
      Mocha.process.stdout = window.process.stdout;
      Mocha.process.stderr = window.process.stderr;
    }

    var socket = io.connect();
    socket.on('reload', function () {
      document.location.reload();
    });


    function configureOutput() {
      var originalLog   = console.log;

      console.info = console.log = function() {
        var args = Array.prototype.slice.call(arguments).map(encodeURI);
        args.push('\n')
        socket.emit('stdout', args);
      }

      console.warn = console.error = function() {
        var args = Array.prototype.slice.call(arguments).map(encodeURI);
        args.push('\n')
        socket.emit('stderr', args);
      }

      console.trace = function () {
        try {
          throw new Error();
        } catch (e) {
          var stack = e.stack;
          if (stack) {
            stack = stack.split('\n').slice(2).join('\n');
            process.stdout.write(stack + '\n');
          }
        }
      }

      window.process = {
        stdout: { write: function() {
          var args = Array.prototype.slice.call(arguments);
          socket.emit('stdout', args.map(encodeURI));
        }},
        stderr: { write: function() {
          var args = Array.prototype.slice.call(arguments);
          socket.emit('stderr', args.map(encodeURI));
        }},
      };
      Mocha.process.stdout = window.process.stdout;
      Mocha.process.stderr = window.process.stderr;
    }


    var launched=false;

    socket.on('launch', function(options) {
      console.log('LAUNCH', options.reporter)
      if(launched) {
        return document.location.reload();
      } else {
        launched = true;
      }

      if(options.reporter !== 'html') {
        configureOutput()
      }

      mocha.checkLeaks();
      mocha.reporter(options.reporter || 'html')
      mocha.run(function() {
        socket.emit('end');
      });
    })

    socket.on('whoareu', function() {
      console.log('whoareu', window.navigator.userAgent);
      setTimeout(function() {
        socket.emit('whoiam', window.navigator.userAgent)
      },100)
    })


  }


  document.addEventListener('DOMContentLoaded', initialize)

}());
