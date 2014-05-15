var phantom  = require('phantom')
var testy    = require('../lib/testy.js')
var read     = require('fs').readFile
var join     = require('path').join
var chokidar = require('chokidar')
var basename = require('path').basename
var watchify = require('watchify')
var concat   = require('concat-stream')
var launcher = require('browser-launcher')
var uuid     = require('uuid')



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
  console.log('Request service.json');
  res.json({json:true})
})



testy.server.listen(3042, function() {
  console.log('Listen on http://localhost:3042/')
  console.log('Launch on phantom ...')


  phantom.create(function (ph) {
    console.log('Phantom created');
    ph.createPage(function(page) {
      console.log('Page created');
      page.open('http://localhost:3042/', function(status) {
        console.log('Opened with status=', status)
        page.evaluate(function() {return socket},function(x) {
          console.log('Evaluation done', x)
        })
      })
    })
  })


});

