var useragent = require('useragent')
var Charm = require('charm')

module.exports = matrixReporter

var COLORS = {
  white: 'white',
  black: 'black',
  header: 25,
  darkgrey: 234,
  grey: 240,
  running: 33,
  failure: 124,
  success: 112,
  pending: 240,
  err: 208
}

function matrixReporter (kawa) {
  var charm = Charm()
  charm.pipe(process.stdout)
  charm.reset()
  charm.cursor(false)

  process.on('exit', function () {
    charm.cursor(true)
  })

  var stats = {}

  kawa.on('reload', function (data) {
    Object.keys(stats).forEach(function (k) {
      if (stats[k].status === -1) {
        delete stats[k]
      } else {
        stats[k].status = -1
      }
    })
    update()
  })

  kawa.on('json', function (data) {
    stats[data.userAgent] = data
    update()
  })

  // Update (to draw the interface at least one time before receiving any data)
  update()

  function update () {
    var keys = Object.keys(stats)
    var count = keys.length
    var port = kawa.server.address().port

    // Write kawa header
    charm
      .display('reset')
      .position(1, 1)
      .background(COLORS.header)
      .foreground(COLORS.white)
      .erase('line')
      .display('bright')
      .write(' KAWA ➔ http://localhost:' + port)
      .foreground(COLORS.darkgrey)
      .write(' (press ^C to leave)')

    // Clear screen
    charm
      .foreground(COLORS.white)
      .position(1, 2)
      .background(COLORS.darkgrey)
      .erase('line')
      .position(1, 3)
      .background(COLORS.black)
      .erase('down')

    keys.forEach(function (k, index) {
      var data = stats[k]
      var ua = useragent.parse(data.userAgent)

      // Prepare line for one user agent
      charm
        .position((index * 3) + 1, 2)
        .display('reset')
        .foreground(COLORS.white)
        .background(COLORS.black)
        .display('bright')

      switch (data.status) {
        case 0:
          charm.display('blink')
          charm.background(COLORS.running)
          break
        case 1:
          if (data.stats.failures > 0) {
            charm.background(COLORS.failure)
          } else {
            charm.background(COLORS.success)
          }
          break
        default:
          charm.background(COLORS.pending)
      }

      // Write user agent index (horizontal)
      charm.write(' ' + index + ' ')

      // Write user agent index (vertical)
      charm
        .position(1, index + 3)
        .write(' ' + index + ' ')

      // Write user agent name
      charm
        .display('reset')
        .background(COLORS.black)
        .foreground(COLORS.white)
        .right(1)
        .write(ua.toString())

      // Add state (duration / running / pending)
      charm.foreground(COLORS.grey)
      if (data.stats.duration) {
        charm.write(' (' + data.stats.duration + 'ms)')
      } else if (data.status === 0) {
        charm.write(' (running)')
      } else if (data.status === -1) {
        charm.write(' (pending)')
      }

      // Print last error
      if (data.stats.failures && data.tests) {
        charm.display('reset')
        data.tests.forEach(function (test) {
          if (!test.err.stack) {
            return
          }
          // Error header
          charm
            .position(1, count + 4)
            .erase('down')
            .background(COLORS.grey)
            .foreground(COLORS.err)
            .write(' ERR ')
            .background(COLORS.black)
            .foreground(COLORS.white)
            .write(' ' + test.fullTitle + ' (' + ua.toString() + ')')
          // Error stack
          charm
            .foreground(COLORS.grey)
            .position(1, keys.length + 6)
            .write(test.err.stack)
        })
      }
    })
  }
}
