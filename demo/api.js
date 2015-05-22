var Kawa = require('../lib/kawa.js')
var watchify = require('watchify')
var browserify = require('browserify')
var resolve = require('path').resolve
var useragent = require('useragent')
var open = require('open')

var PORT = process.env.PORT || 3242
var filepath = resolve(__dirname,'./sandbox.test.js')

function testAgents(filepath, agents, callback) {
  var results = {}
  var remain = agents.map(function (agent) { return agent })
  var kawa = Kawa()

  kawa
   .reporter('json')
   .silent(true)
   .addTest(filepath, kawa.bundler(filepath))

  kawa.on('stdout', function (output) {
    var json = JSON.parse(output)
    var ua = useragent.parse(json.userAgent)
    var indexOfAgent = remain.indexOf(ua.family)
    var stats = json.stats
    json.userAgent = ua
    results[ua.family] = json
    if (indexOfAgent !== -1) {
      remain.splice(indexOfAgent, 1)
    }
    console.error('%s: suites:%s passes:%s/%s failures:%s duration:%sms',
      ua.family,
      stats.suites,
      stats.passes,
      stats.tests,
      stats.failures,
      stats.duration)
    if (!remain.length) {
      callback(null, results)
    }
  })

  kawa.on('stderr', function (output) {
    callback(new Error(output))
  })

  kawa.listen(PORT)

  kawa.server.on('listening', function(err) {
    if (err) {
      return callback(err)
    }
    // remain.forEach(function (agent) {
    //   console.error('Open http://localhost:%s with %s', PORT, agent.toLowerCase())
    //   open('http://localhost:' + PORT, agent.toLowerCase())
    // })
  })

  return kawa
}


testAgents(filepath, ['Chrome', 'Firefox'], function (err, results) {
  if(err) {
    console.error(err.stack)
  } else {
    // console.log(results)
    // process.exit(0)
  }
})
