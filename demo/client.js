var testy    = require('../lib/testy.js')
var read     = require('fs').readFile
var join     = require('path').join
var chokidar = require('chokidar')
var basename = require('path').basename
var watchify = require('watchify')
var concat   = require('concat-stream')
var app      = require('express')();
var morgan   = require('morgan')

var filepath = join(__dirname,'./client.test.js');


// app.use(morgan('dev'))
app.get('/service.json', function(req, res) {
  res.json({json:true})
})

var t = testy()
  .reporter('spec')
  .use(app)
  .listen(3042, function() {
    console.log('Listen on http://localhost:3042/')
  });


var b = watchify(filepath);
function update() {
  t.add(b.bundle({debug:true}))
}
b.on('update', update);
update();


