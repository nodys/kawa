/* global mocha Mocha io */

;(function () {
  // Set mocha mode (modified by server template)
  mocha.setup('{{UI}}')

  function initialize () {

    if (!window.console) {
      window.console = {
        log: function () { return },
        info: function () { return },
        warn: function () { return },
        error: function () { return }
      }
    }

    if (!window.process) {
      window.process = {
        stdout: {
          write: function () {
            return window.console.log.apply(window.console, arguments)
          }
        },
        stderr: {
          write: function () {
            return window.console.log.apply(window.console, arguments)
          }
        }
      }
      Mocha.process.stdout = window.process.stdout
      Mocha.process.stderr = window.process.stderr
    }

    var socket = io.connect()

    socket.on('__kawa__reload', function () {
      document.location.reload()
    })

    function configureOutput () {
      console.info = console.log = function () {
        var args = Array.prototype.slice.call(arguments).map(encodeURI)
        args.push('\n')
        socket.emit('__kawa__stdout', args)
      }

      console.warn = console.error = function () {
        var args = Array.prototype.slice.call(arguments).map(encodeURI)
        args.push('\n')
        socket.emit('__kawa__stderr', args)
      }

      console.trace = function () {
        try {
          throw new Error()
        } catch (e) {
          var stack = e.stack
          if (stack) {
            stack = stack.split('\n').slice(2).join('\n')
            process.stdout.write(stack + '\n')
          }
        }
      }

      window.process = {
        stdout: {
          write: function () {
            var args = Array.prototype.slice.call(arguments)
            socket.emit('__kawa__stdout', args.map(encodeURI))
          }
        },
        stderr: {
          write: function () {
            var args = Array.prototype.slice.call(arguments)
            socket.emit('__kawa__stderr', args.map(encodeURI))
          }
        }
      }
      Mocha.process.stdout = window.process.stdout
      Mocha.process.stderr = window.process.stderr
    }

    var isStarted = false
    var isFinished = false
    var restartRequired = false

    function restart () {
      restartRequired = false
      document.location.reload()
    }

    socket.on('__kawa__ready', function (cb) {
      if (isStarted) {
        cb(false)
        if (!isFinished) {
          restartRequired = true
        } else {
          restart()
        }
        return
      } else {
        cb(true, {userAgent: window.navigator.userAgent})
      }
    })

    socket.on('__kawa__start', function (options) {
      isStarted = true
      if (options.reporter !== 'html') {
        configureOutput()
      }
      mocha.checkLeaks()
      mocha.reporter(options.reporter || 'html')

      mocha.run(function (err) {
        socket.emit('__kawa__end', err ? 1 : 0)
        isFinished = true
        if (restartRequired) {
          restart()
        }
      })
    })
  }

  document.addEventListener('DOMContentLoaded', initialize)

}())
