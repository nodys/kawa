var testy    = require('../lib/testy.js')
var read     = require('fs').readFile
var join     = require('path').join
var chokidar = require('chokidar')
var basename = require('path').basename
var watchify = require('watchify')
var concat   = require('concat-stream')

testy.server.listen(3042, function() {
  console.log('Listen on http://localhost:3042/')
});



var filepath = join(__dirname,'./client.test.js');

var b = watchify([
  join(__dirname,'./basic.test.js'),
  join(__dirname,'./browserify.test.js'),
  join(__dirname,'./client.test.js')
]);

function update() {
  b.bundle({debug:true})
    .pipe(concat(function(data) {
      testy.add('all.js', data.toString())
    }))
}

b.on('update', update);

update();


testy.app.get('/service.json', function(req, res) {
  res.json({json:true})
})
