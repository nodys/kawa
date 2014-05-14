var testy    = require('../lib/testy.js')
var read     = require('fs').readFile
var join     = require('path').join
var chokidar = require('chokidar')
var basename = require('path').basename

testy.server.listen(3042, function() {
  console.log('Listen on http://localhost:3042/')
});

function update(path) {
  testy.add(path);
}

function remove(path) {
  testy.remove(path);
}

var testpath = join(__dirname, './basic.test.js');

// Update once
update(testpath)

// Watch and update
chokidar.watch(testpath)
  .on('add',    update)
  .on('change', update)
  .on('unlink', remove)
