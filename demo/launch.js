var testy    = require('../lib/testy.js')
var read     = require('fs').readFile
var join     = require('path').join
var chokidar = require('chokidar')
var basename = require('path').basename
var watchify = require('watchify')
var concat   = require('concat-stream')
var launcher = require('browser-launcher')
var uuid     = require('uuid')


testy.server.listen(3042, function() {
  console.log('Listen on http://localhost:3042/')
  console.log('Launch on chrome ...')


    launcher(function (err, launch) {
        if (err) {
          throw err;
          // return console.error(err);
        }

        console.log('# available browsers:');
        console.dir(launch.browsers);

      var opts = {
          browser : 'chrome',
      };
      launch('http://localhost:3042/?uid='+uuid.v4(), opts, function (err, ps) {
        if (err) return console.error(err);
        console.log('Success')
        setTimeout(function() {
          console.log('Send kill signal');
          ps.kill('SIGINT')
        },3000);
        ps.on('exit', function(code) {
          console.log('EXIT', code);
        })
      })
    })




});



var filepath = join(__dirname,'./client.test.js');

var b = watchify(filepath);

function update() {
  b.bundle({debug:true})
    .pipe(concat(function(data) {
      testy.add(filepath, data.toString())
    }))
}

b.on('update', update);

update();


testy.app.get('/service.json', function(req, res) {
  res.json({json:true})
})
