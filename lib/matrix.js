var useragent = require('useragent')
var Charm = require('charm')

module.exports = matrixReporter

function matrixReporter (kawa) {
  var charm = Charm()
  charm.pipe(process.stdout)
  charm.reset()
  charm.cursor(false)

  var colors = [ 128, ]
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

  function update () {
    var keys = Object.keys(stats)
    var count = keys.length
    charm.display('reset')
    charm.background('black')
    charm.position(1, 2)
    charm.erase('line')
    charm.erase('down')
    keys.forEach(function (k, index) {
      var data = stats[k]
      var ua = useragent.parse(data.userAgent)
      charm.position((index * 3) + 1, 2)
      charm.display('reset')
      charm.foreground('white')
      charm.background('black')
      charm.display('bright')

      switch (data.status) {
        case 0:
          charm.display('blink')
          charm.background(33)
          break
        case 1:
          if (data.stats.failures > 0) {
            charm.background(124)
          } else {
            charm.background(112)
          }
          break
        default:
          charm.background(240)
      }
      charm.write(' ' + index + ' ')

      charm.position(1, index + 3)
      charm.write(' ' + index + ' ')
      charm.display('reset')
      charm.background('black')
      charm.foreground('white')
      charm.right(1)
      charm.write(ua.toString())

      charm.foreground(240)
      if (data.stats.duration) {
        charm.write(' (' + data.stats.duration + 'ms)')
      } else if (data.status === 0) {
        charm.write(' (running)')
      } else if (data.status === -1) {
        charm.write(' (wait for client)')
      }

      if (data.stats.failures && data.tests) {
        charm.display('reset')
        data.tests.forEach(function (test) {
          if (!test.err.stack) {
            return
          }
          charm.position(1, count + 4)
          charm.erase('line')
          charm.erase('down')
          charm.background(240)
          charm.foreground(208)
          charm.write(' ERR ')
          charm.background('black')
          // charm.position( 1, keys.length + 5)
          charm.foreground('white')
          charm.write(' ' + test.fullTitle + ' (' + ua.toString() + ')')
          charm.foreground(240)
          charm.position(1, keys.length + 6)
          charm.write(test.err.stack)
        })
      }
    })
  }
}
