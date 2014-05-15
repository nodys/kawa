
;(function() {

  // Set mocha mode
  mocha.setup('{{UI}}')


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
    socket.on('__testy__reload', function () {
      document.location.reload();
    });


    function configureOutput() {
      var originalLog   = console.log;

      console.info = console.log = function() {
        var args = Array.prototype.slice.call(arguments).map(encodeURI);
        args.push('\n')
        socket.emit('__testy__stdout', args);
      }

      console.warn = console.error = function() {
        var args = Array.prototype.slice.call(arguments).map(encodeURI);
        args.push('\n')
        socket.emit('__testy__stderr', args);
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
          socket.emit('__testy__stdout', args.map(encodeURI));
        }},
        stderr: { write: function() {
          var args = Array.prototype.slice.call(arguments);
          socket.emit('__testy__stderr', args.map(encodeURI));
        }},
      };
      Mocha.process.stdout = window.process.stdout;
      Mocha.process.stderr = window.process.stderr;
    }


    var launched=false;

    socket.on('__testy__launch', function(options) {
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
        socket.emit('__testy__end');
      });
    })

    socket.on('__testy__whoareu', function() {
      setTimeout(function() {
        socket.emit('__testy__whoiam', window.navigator.userAgent)
      },100)
    })


  }

  document.addEventListener('DOMContentLoaded', initialize)

}());
