var testy    = require('../lib/testy.js')
var join     = require('path').join
var watchify = require('watchify')
var express  = require('express')
var morgan   = require('morgan')


var app      = express();
app.use(morgan('dev'))
app.get('/service.json', function(req, res) {
  res.json({json:true})
})

var tester = testy()
  .silent(true)
  .reporter('spec')
  .use(app)
  .usePhantom()
  // .addScript(join(__dirname,'./vendor.js'))
  .addScript(
    watchify(join(__dirname,'./vendor.js')))
  .addTest(
    watchify(join(__dirname,'./client.test.js')))
  .on('start', function(data) {
    console.log('Start:', data.userAgent);
  })
  .on('stdout', function(data) {
    process.stdout.write(data);
  })
  .on('end', function(data) {
    console.log('End:', data.userAgent);
  })
  .listen(3042)
